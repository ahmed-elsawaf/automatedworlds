/**
 * AutomatedWorlds — Discount Codes & Affiliate Procedures
 */

import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import {
  requireUser,
  requireAdmin,
  now,
  computeDiscount,
  writeAuditLog,
} from "./helpers";

// ─────────────────────────────────────────────────────────────────────────────
// DISCOUNT CODES
// ─────────────────────────────────────────────────────────────────────────────

export const validateDiscountCode = query({
  args: {
    code: v.string(),
    ideaId: v.id("ideas"),
    amountCents: v.number(),
  },
  handler: async (ctx, args) => {
    const dc = await ctx.db
      .query("discountCodes")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!dc || !dc.isActive) return { valid: false, reason: "Code not found or inactive." };
    if (dc.expiresAt && dc.expiresAt < Date.now())
      return { valid: false, reason: "Code has expired." };
    if (dc.maxUses && dc.usedCount >= dc.maxUses)
      return { valid: false, reason: "Code has reached its usage limit." };
    if (dc.minOrderAmount && args.amountCents < dc.minOrderAmount)
      return {
        valid: false,
        reason: `Minimum order of $${(dc.minOrderAmount / 100).toFixed(2)} required.`,
      };
    if (
      dc.applicableIdeaIds &&
      dc.applicableIdeaIds.length > 0 &&
      !dc.applicableIdeaIds.includes(args.ideaId)
    )
      return { valid: false, reason: "Code is not valid for this idea." };

    const discountCents = computeDiscount(args.amountCents, dc);
    const finalCents = args.amountCents - discountCents;

    return {
      valid: true,
      discountCodeId: dc._id,
      discountType: dc.discountType,
      discountValue: dc.discountValue,
      discountCents,
      finalCents,
    };
  },
});

/** Record code usage after a successful order. Called from order creation flow. */
export const recordDiscountCodeUsage = mutation({
  args: {
    discountCodeId: v.id("discountCodes"),
    userId: v.id("users"),
    orderId: v.id("orders"),
    amountSaved: v.number(),
  },
  handler: async (ctx, args) => {
    const dc = await ctx.db.get(args.discountCodeId);
    if (!dc) throw new Error("NOT_FOUND");

    await ctx.db.insert("discountCodeUsages", {
      discountCodeId: args.discountCodeId,
      userId: args.userId,
      orderId: args.orderId,
      amountSaved: args.amountSaved,
      createdAt: now(),
    });

    await ctx.db.patch(args.discountCodeId, {
      usedCount: dc.usedCount + 1,
    });
  },
});

// ── Admin CRUD ─────────────────────────────────────────────────────────────

export const createDiscountCode = mutation({
  args: {
    code: v.string(),
    description: v.optional(v.string()),
    discountType: v.union(v.literal("percent"), v.literal("fixed")),
    discountValue: v.number(),
    maxUses: v.optional(v.number()),
    applicableIdeaIds: v.optional(v.array(v.id("ideas"))),
    minOrderAmount: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    const code = args.code.toUpperCase().trim();

    const existing = await ctx.db
      .query("discountCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (existing) throw new Error("CONFLICT: Code already exists.");

    if (args.discountType === "percent" && args.discountValue > 100)
      throw new Error("VALIDATION: Percent discount cannot exceed 100.");

    const id = await ctx.db.insert("discountCodes", {
      ...args,
      code,
      usedCount: 0,
      isActive: true,
      createdBy: actor._id,
      createdAt: now(),
    });

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "discountCode.create",
      targetType: "discountCode",
      targetId: id,
      metadata: { code, discountType: args.discountType, discountValue: args.discountValue },
    });

    return id;
  },
});

export const updateDiscountCode = mutation({
  args: {
    discountCodeId: v.id("discountCodes"),
    isActive: v.optional(v.boolean()),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    const { discountCodeId, ...patch } = args;

    await ctx.db.patch(discountCodeId, patch);

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "discountCode.update",
      targetType: "discountCode",
      targetId: discountCodeId,
      metadata: patch,
    });
  },
});

export const listDiscountCodes = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, { activeOnly }) => {
    await requireAdmin(ctx);

    if (activeOnly) {
      return ctx.db
        .query("discountCodes")
        .withIndex("by_isActive", (q) => q.eq("isActive", true))
        .order("desc")
        .collect();
    }

    return ctx.db.query("discountCodes").order("desc").collect();
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// AFFILIATE LINKS
// ─────────────────────────────────────────────────────────────────────────────

export const getOrCreateAffiliateLink = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("affiliateLinks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) return existing;

    // Generate a unique code: first 4 chars of userId + random suffix
    const code = (user._id.toString().slice(0, 4) + Math.random().toString(36).slice(2, 6)).toUpperCase();

    const id = await ctx.db.insert("affiliateLinks", {
      userId: user._id,
      code,
      commissionRate: 0.2, // default 20%
      totalClicks: 0,
      totalSales: 0,
      totalEarnings: 0,
      isActive: true,
      createdAt: now(),
    });

    return ctx.db.get(id);
  },
});

/** Record a click on an affiliate link (called from middleware/server action). */
export const recordAffiliateClick = internalMutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const link = await ctx.db
      .query("affiliateLinks")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    if (!link || !link.isActive) return null;

    await ctx.db.patch(link._id, {
      totalClicks: link.totalClicks + 1,
    });

    return link._id;
  },
});

/** Record an affiliate conversion after a paid order. */
export const recordAffiliateConversion = mutation({
  args: {
    affiliateLinkId: v.id("affiliateLinks"),
    buyerUserId: v.id("users"),
    orderId: v.id("orders"),
    saleAmount: v.number(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.affiliateLinkId);
    if (!link) throw new Error("NOT_FOUND");

    const commissionEarned = Math.round(args.saleAmount * link.commissionRate);

    await ctx.db.insert("affiliateConversions", {
      affiliateLinkId: args.affiliateLinkId,
      affiliateUserId: link.userId,
      buyerUserId: args.buyerUserId,
      orderId: args.orderId,
      saleAmount: args.saleAmount,
      commissionEarned,
      isPaid: false,
      createdAt: now(),
    });

    await ctx.db.patch(args.affiliateLinkId, {
      totalSales: link.totalSales + args.saleAmount,
      totalEarnings: link.totalEarnings + commissionEarned,
    });
  },
});

export const getMyAffiliateDashboard = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const link = await ctx.db
      .query("affiliateLinks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!link) return null;

    const conversions = await ctx.db
      .query("affiliateConversions")
      .withIndex("by_affiliate_link", (q) =>
        q.eq("affiliateLinkId", link._id)
      )
      .order("desc")
      .take(20);

    const unpaidEarnings = conversions
      .filter((c) => !c.isPaid)
      .reduce((s, c) => s + c.commissionEarned, 0);

    return { link, conversions, unpaidEarnings };
  },
});

/** Admin: mark affiliate commissions as paid. */
export const adminMarkAffiliatesPaid = mutation({
  args: { conversionIds: v.array(v.id("affiliateConversions")) },
  handler: async (ctx, { conversionIds }) => {
    const actor = await requireAdmin(ctx);

    await Promise.all(
      conversionIds.map((id) =>
        ctx.db.patch(id, { isPaid: true, paidAt: now() })
      )
    );

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "affiliate.markPaid",
      targetType: "affiliateConversion",
      targetId: conversionIds[0],
      metadata: { count: conversionIds.length },
    });
  },
});

export const adminListUnpaidConversions = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const conversions = await ctx.db
      .query("affiliateConversions")
      .withIndex("by_is_paid", (q) => q.eq("isPaid", false))
      .order("asc")
      .collect();

    return Promise.all(
      conversions.map(async (c) => {
        const affiliate = await ctx.db.get(c.affiliateUserId);
        const order = await ctx.db.get(c.orderId);
        return { ...c, affiliate, order };
      })
    );
  },
});

export const adminSetCommissionRate = mutation({
  args: { affiliateLinkId: v.id("affiliateLinks"), commissionRate: v.number() },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);

    if (args.commissionRate < 0 || args.commissionRate > 1)
      throw new Error("VALIDATION: Rate must be between 0 and 1.");

    await ctx.db.patch(args.affiliateLinkId, {
      commissionRate: args.commissionRate,
    });

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "affiliate.setRate",
      targetType: "affiliateLink",
      targetId: args.affiliateLinkId,
      metadata: { commissionRate: args.commissionRate },
    });
  },
});