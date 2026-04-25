import { action } from "./_generated/server";
import { v } from "convex/values";
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const generateIdeaFromUrl = action({
  args: {
    url: v.string(),
    categoryId: v.id("categories"),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    roiPotential: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("very_high")
    ),
  },
  handler: async (ctx, args): Promise<Id<"ideas">> => {
    // 1. Authenticate check (ensure they are logged in)
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated: You must be signed in.");

    // 2. Scrape URL
    let html = "";
    try {
      const response = await fetch(args.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch URL: ${response.status} ${response.statusText}`
        );
      }
      html = await response.text();
    } catch (err: any) {
      throw new Error(`Scraping failed: ${err.message}`);
    }

    const $ = cheerio.load(html);
    $("script, style, nav, footer, iframe, noscript, svg").remove();
    let textContent = $("body").text().replace(/\s+/g, " ").trim();

    // Truncate to avoid exceeding token limits
    if (textContent.length > 50000) {
      textContent = textContent.slice(0, 50000);
    }

    if (!textContent) {
        throw new Error("Failed to extract meaningful text from the provided URL.");
    }

    // 3. Call Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
You are an expert SaaS analyst and copywriter. I am providing you with the text scraped from a SaaS website (${args.url}).
I want you to analyze this SaaS and generate a structured "Idea" profile for a marketplace where users can buy the codebase or rights to similar apps.

Text from website:
"""
${textContent}
"""

Generate a JSON object with the following structure (do NOT include markdown code blocks around the JSON):
{
  "title": "A catchy, short name for this SaaS idea",
  "tagline": "A one-sentence pitch",
  "description": "A 2-3 paragraph markdown pitch explaining what this is and why it's a great opportunity.",
  "targetAudience": "Who is this for?",
  "problemStatement": "What problem does this solve?",
  "solutionOverview": "How does this solve the problem?",
  "uniqueValueProp": "What makes this unique?",
  "revenueModel": "How does this make money? (markdown)",
  "revenueStreams": ["Subscription", "One-time"],
  "competitors": [
    { "name": "Competitor Name", "url": "https://...", "weakness": "Their weakness compared to our idea" }
  ],
  "techStack": [
    { "name": "Next.js", "role": "Frontend", "url": "https://nextjs.org" }
  ],
  "marketSize": "e.g. $4.2B by 2027",
  "goToMarket": "markdown GTM strategy",
  "growthStrategy": "markdown growth strategy",
  "timeToLaunch": "e.g. 2-4 weeks",
  "sections": [
    {
      "type": "feature_list",
      "title": "Core Features",
      "content": "JSON string containing features"
    },
    {
      "type": "faq",
      "title": "Frequently Asked Questions",
      "content": "JSON string containing FAQs"
    }
  ]
}

For the \`sections\`, please provide at least two sections:
1. type: "feature_list", content must be a JSON string of an array of objects: \`[{"title": "Feature 1", "description": "Desc 1"}, ...]\`.
2. type: "faq", content must be a JSON string of an array of objects: \`[{"question": "Q1", "answer": "A1"}, ...]\`.
Note that the \`content\` field of each section must be a STRING that represents a valid JSON array, do not output raw arrays for the content field.
Make the output professional, detailed, and highly persuasive.
`;

    const modelResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = modelResponse.text;
    if (!responseText) {
      throw new Error("Failed to generate content from AI");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch (err: any) {
      throw new Error("Failed to parse AI response: " + err.message + "\n\nResponse was:\n" + responseText);
    }

    // 4. Save to Database
    const ideaId: Id<"ideas"> = await ctx.runMutation(api.ideas.createIdea, {
      title: parsed.title || "Generated Idea",
      tagline: parsed.tagline,
      description: parsed.description,
      categoryId: args.categoryId,
      difficulty: args.difficulty,
      roiPotential: args.roiPotential,
      targetAudience: parsed.targetAudience,
      problemStatement: parsed.problemStatement,
      solutionOverview: parsed.solutionOverview,
      uniqueValueProp: parsed.uniqueValueProp,
      revenueModel: parsed.revenueModel,
      revenueStreams: parsed.revenueStreams || [],
      competitors: parsed.competitors || [],
      techStack: parsed.techStack || [],
      marketSize: parsed.marketSize,
      goToMarket: parsed.goToMarket,
      growthStrategy: parsed.growthStrategy,
      timeToLaunch: parsed.timeToLaunch,
      priceCodeBase: 9900,
      priceCustomization: 149900,
    });

    if (parsed.sections && Array.isArray(parsed.sections)) {
      for (let i = 0; i < parsed.sections.length; i++) {
        const sec = parsed.sections[i];
        
        // Ensure content is a string
        let contentStr = sec.content;
        if (typeof contentStr !== 'string') {
            contentStr = JSON.stringify(contentStr);
        }

        await ctx.runMutation(api.ideas.upsertIdeaSection, {
          ideaId,
          type: sec.type as any,
          title: sec.title,
          content: contentStr,
          sortOrder: i,
          isVisible: true,
        });
      }
    }

    return ideaId;
  },
});

export const generateSocialPost = action({
  args: {
    ideaId: v.id("ideas"),
    platform: v.literal("facebook"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const idea = await ctx.runQuery(api.ideas.adminGetIdea, { ideaId: args.ideaId });
    if (!idea) throw new Error("Idea not found");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const prompt = `
You are a world-class SaaS Acquisition Specialist. Your goal is to generate a high-converting Facebook post for an entrepreneur or investor to ACQUIRE the following SaaS business/codebase:

Title: ${idea.title}
Tagline: ${idea.tagline}
Description: ${idea.description || "N/A"}
Problem: ${idea.problemStatement || "N/A"}
Solution: ${idea.solutionOverview || "N/A"}

Requirements:
1. Person: You are selling the ASSET (the code and the business), not the service.
2. Hook: Start with why this is a massive business opportunity or a high-ROI acquisition.
3. The Product: Briefly explain what the SaaS does so the buyer understands the value.
4. Acquisition Value: Mention what's included (Full Source Code, Rights, Scalable Backend, etc.).
5. Monetization: Mention how the new owner will make money (Subscriptions, API credits, etc.).
6. Bullets: Use max 5 bullets to highlight technical/business strengths.
7. CTA: A clear call to action to "Acquire the full source code today".
8. Tone: Entrepreneurial, professional, and opportunistic.
9. Image: Provide a "headline_short" (max 35 chars) and a "tagline_short" (max 50 chars) for a marketing image.

Output as JSON (no markdown):
{
  "postText": "the full post content",
  "imageHeadline": "short headline for image",
  "imageTagline": "short tagline for image"
}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!result.text) throw new Error("AI failed to generate content");
    const response = JSON.parse(result.text);
    return response;
  },
});

export const enhanceIdea = action({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // 1. Get current idea data
    const idea = await ctx.runQuery(api.ideas.adminGetIdea, { ideaId: args.ideaId });
    if (!idea) throw new Error("Idea not found");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    // 2. Build the prompt
    const prompt = `
You are a world-class SaaS Acquisition Specialist and Copywriter. Your goal is to ENHANCE an existing SaaS idea to make it extremely persuasive for potential buyers (entrepreneurs and investors).

Current Idea Data:
- Title: ${idea.title}
- Tagline: ${idea.tagline}
- Description: ${idea.description || "N/A"}
- Target Audience: ${idea.targetAudience || "N/A"}
- Problem: ${idea.problemStatement || "N/A"}
- Solution: ${idea.solutionOverview || "N/A"}
- Unique Value Prop: ${idea.uniqueValueProp || "N/A"}
- Revenue Model: ${idea.revenueModel || "N/A"}

Requirements:
1. Rewrite the Title to be punchy and professional.
2. Rewrite the Tagline to be a high-impact "one-sentence pitch".
3. Expand the Description into 3-4 professional markdown paragraphs. Focus on the market opportunity and ROI potential.
4. Deepen the Problem Statement and Solution Overview.
5. Create/Refine the Unique Value Proposition.
6. Refine the Revenue Model.
7. Generate content for two standard sections:
   - "feature_list": A comprehensive list of at least 5 core features.
   - "faq": A list of 4-6 common questions a buyer or user might have.

Output as a single JSON object (no markdown code blocks):
{
  "title": "...",
  "tagline": "...",
  "description": "...",
  "targetAudience": "...",
  "problemStatement": "...",
  "solutionOverview": "...",
  "uniqueValueProp": "...",
  "revenueModel": "...",
  "sections": [
    { "type": "feature_list", "title": "Core Features", "content": [{"title": "...", "description": "..."}] },
    { "type": "faq", "title": "Frequently Asked Questions", "content": [{"question": "...", "answer": "..."}] }
  ]
}

Note: The "content" field in "sections" should be the raw array of objects (the mutation will stringify it).
Make the tone professional, opportunistic, and data-driven.
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    if (!result.text) throw new Error("AI failed to generate content");
    const enhanced = JSON.parse(result.text);

    // 3. Update the idea
    await ctx.runMutation(api.ideas.updateIdea, {
      ideaId: args.ideaId,
      title: enhanced.title,
      tagline: enhanced.tagline,
      description: enhanced.description,
      targetAudience: enhanced.targetAudience,
      problemStatement: enhanced.problemStatement,
      solutionOverview: enhanced.solutionOverview,
      uniqueValueProp: enhanced.uniqueValueProp,
      revenueModel: enhanced.revenueModel,
    });

    // 4. Update sections
    if (enhanced.sections && Array.isArray(enhanced.sections)) {
      for (let i = 0; i < enhanced.sections.length; i++) {
        const sec = enhanced.sections[i];
        await ctx.runMutation(api.ideas.upsertIdeaSection, {
          ideaId: args.ideaId,
          type: sec.type,
          title: sec.title,
          content: JSON.stringify(sec.content),
          sortOrder: i + 10, // Put these after initial content if any
          isVisible: true,
        });
      }
    }

    return { success: true };
  },
});
