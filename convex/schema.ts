import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(), // Clerk ID
    email: v.string(),
    plan: v.union(v.literal("free"), v.literal("pro")),
    purchasedIdeas: v.array(v.id("marketplaceItems")),
    savedIdeas: v.array(v.id("ideas")),
  }).index("by_userId", ["userId"]),

  ideas: defineTable({
    title: v.string(),
    summary: v.string(),
    fullReport: v.string(), // Markdown content
    slug: v.string(),
    dateFeatured: v.number(),
    
    // Quantitative Data
    searchVolume: v.number(),
    growthPercentage: v.number(),
    revenuePotential: v.string(), // e.g., "$1M - $10M"
    
    // Qualitative Scores (1-10)
    opportunityScore: v.number(),
    problemScore: v.number(),
    executionDifficulty: v.number(),
    goToMarketScore: v.number(),
    
    // Categorization
    tags: v.array(v.string()), // e.g., ["AI", "B2B", "High Growth"]
    isIdeaOfTheDay: v.boolean(),
  }).index("by_date", ["dateFeatured"])
    .index("by_slug", ["slug"]),

  marketplaceItems: defineTable({
    ideaId: v.id("ideas"),
    priceCents: v.number(),
    techStack: v.array(v.string()),
    demoUrl: v.optional(v.string()),
    githubRepoUrl: v.string(), // Revealed after purchase
    includedFeatures: v.array(v.string()),
  }).index("by_ideaId", ["ideaId"]),

  purchases: defineTable({
    userId: v.id("users"),
    marketplaceItemId: v.id("marketplaceItems"),
    polarCheckoutId: v.string(),
    purchasedAt: v.number(),
  }).index("by_user", ["userId"]),
});
