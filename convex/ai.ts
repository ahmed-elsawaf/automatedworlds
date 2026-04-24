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
