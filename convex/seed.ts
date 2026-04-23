import { mutation } from "./_generated/server";

export default mutation({
  args: {},
  handler: async (ctx) => {
    // Check if ideas already exist to avoid duplicates
    const existing = await ctx.db.query("ideas").first();
    if (existing) return "Already seeded";

    const ideasToInsert = [
      {
        title: "Micro-SaaS for Local Gym Member Retention",
        summary: "An automated SMS and email sequence platform tailored specifically for independent gyms to reduce churn.",
        fullReport: "### The Problem\nLocal gyms suffer from high churn. Members sign up in January and leave by March.\n\n### The Solution\nAutomated milestone check-ins, class reminders, and win-back campaigns using personalized SMS.\n\n### Monetization\n$49-$199/month subscription for gym owners based on member count.",
        slug: "gym-retention-saas",
        dateFeatured: Date.now(),
        searchVolume: 12500,
        growthPercentage: 45,
        revenuePotential: "$10k - $50k / MRR",
        opportunityScore: 8,
        problemScore: 9,
        executionDifficulty: 4,
        goToMarketScore: 7,
        tags: ["B2B", "Fitness", "Marketing"],
        isIdeaOfTheDay: true,
      },
      {
        title: "AI-Powered Request for Proposal (RFP) Responder",
        summary: "A tool that digests enterprise RFPs and automatically drafts compliance matrices and responses based on past successful bids.",
        fullReport: "### The Problem\nEnterprise sales teams spend weeks answering 200-question RFPs.\n\n### The Solution\nVector database search of past answers + LLM generation for new but similar questions.\n\n### Monetization\nHigh-ticket SaaS ($500-$2000/mo) or pay-per-RFP.",
        slug: "ai-rfp-responder",
        dateFeatured: Date.now() - 86400000,
        searchVolume: 8200,
        growthPercentage: 120,
        revenuePotential: "$100k+ / MRR",
        opportunityScore: 9,
        problemScore: 10,
        executionDifficulty: 8,
        goToMarketScore: 5,
        tags: ["AI", "Enterprise B2B", "Sales"],
        isIdeaOfTheDay: false,
      },
      {
        title: "Shopify Returns Management Portal",
        summary: "A seamless self-serve returns portal for small Shopify merchants to handle exchanges and refunds without customer service tickets.",
        fullReport: "### The Problem\nE-commerce returns are a logistical nightmare for small shops.\n\n### The Solution\nA self-serve portal that integrates with Shopify APIs and prints return labels automatically.\n\n### Monetization\nUsage-based pricing (e.g., $0.50 per return processed) or flat $29/mo.",
        slug: "shopify-returns-portal",
        dateFeatured: Date.now() - 86400000 * 2,
        searchVolume: 45000,
        growthPercentage: 15,
        revenuePotential: "$50k / MRR",
        opportunityScore: 7,
        problemScore: 8,
        executionDifficulty: 6,
        goToMarketScore: 8,
        tags: ["E-commerce", "Shopify", "Logistics"],
        isIdeaOfTheDay: false,
      }
    ];

    for (const idea of ideasToInsert) {
      await ctx.db.insert("ideas", idea);
    }

    return "Seeded successfully";
  },
});
