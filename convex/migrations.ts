import { mutation } from "./_generated/server";

export const cleanupLegacyFields = mutation({
  args: {},
  handler: async (ctx) => {
    const ideas = await ctx.db.query("ideas").collect();
    let count = 0;
    for (const idea of ideas) {
      const anyIdea = idea as any;
      if (anyIdea.isExclusive !== undefined || anyIdea.priceExclusive !== undefined) {
        await ctx.db.patch(idea._id, {
          // Setting to undefined removes the field in Convex
          isExclusive: undefined,
          priceExclusive: undefined,
        } as any);
        count++;
      }
    }
    return `Cleaned up ${count} ideas.`;
  },
});
