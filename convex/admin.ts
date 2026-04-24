/**
 * AutomatedWorlds — Admin Dashboard
 *
 * Single query that assembles the top-level KPIs for the admin home page.
 */

import { query } from "./_generated/server";
import { requireAdmin } from "./helpers";

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const last30 = now - 30 * 24 * 60 * 60 * 1000;
    const last7 = now - 7 * 24 * 60 * 60 * 1000;

    // ── Ideas ──────────────────────────────────────────────────────────────
    const [published, drafts, archived] = await Promise.all([
      ctx.db
        .query("ideas")
        .withIndex("by_status", (q) => q.eq("status", "published"))
        .collect()
        .then((r) => r.length),
      ctx.db
        .query("ideas")
        .withIndex("by_status", (q) => q.eq("status", "draft"))
        .collect()
        .then((r) => r.length),
      ctx.db
        .query("ideas")
        .withIndex("by_status", (q) => q.eq("status", "archived"))
        .collect()
        .then((r) => r.length),
    ]);

    // ── Users ──────────────────────────────────────────────────────────────
    const allUsers = await ctx.db.query("users").collect();
    const newUsers30 = allUsers.filter((u) => u.createdAt >= last30).length;
    const paidUsers = allUsers.filter((u) => u.plan !== "free").length;

    // ── Revenue (last 30 days paid orders) ────────────────────────────────
    const recentOrders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "paid"))
      .filter((q) => q.gte(q.field("createdAt"), last30))
      .collect();

    const revenue30 = recentOrders.reduce((s, o) => s + o.amountTotal, 0);
    const orderCount30 = recentOrders.length;

    // ── Revenue last 7 days ────────────────────────────────────────────────
    const orders7 = recentOrders.filter((o) => o.createdAt >= last7);
    const revenue7 = orders7.reduce((s, o) => s + o.amountTotal, 0);

    // ── Customizations pending action ─────────────────────────────────────
    const [pendingCustomizations, pendingReviews] = await Promise.all([
      ctx.db
        .query("customizationRequests")
        .withIndex("by_status", (q) => q.eq("status", "submitted"))
        .collect()
        .then((r) => r.length),
      ctx.db
        .query("reviews")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect()
        .then((r) => r.length),
    ]);

    // ── Top 5 ideas by revenue ─────────────────────────────────────────────
    const allPaidOrders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "paid"))
      .collect();

    const revenueByIdea: Record<string, number> = {};
    for (const o of allPaidOrders) {
      revenueByIdea[o.ideaId] = (revenueByIdea[o.ideaId] ?? 0) + o.amountTotal;
    }

    const topIdeaIds = Object.entries(revenueByIdea)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);

    const topIdeas = await Promise.all(
      topIdeaIds.map(async (id) => {
        const idea = await ctx.db.get(id as any);
        return {
          idea,
          revenueCents: revenueByIdea[id],
        };
      })
    );

    return {
      ideas: { published, drafts, archived, total: published + drafts + archived },
      users: { total: allUsers.length, newLast30Days: newUsers30, paidUsers },
      revenue: {
        last30DaysCents: revenue30,
        last7DaysCents: revenue7,
        orderCount30,
      },
      actionRequired: {
        pendingCustomizations,
        pendingReviews,
      },
      topIdeas,
    };
  },
});