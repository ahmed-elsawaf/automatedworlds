/**
 * AutomatedWorlds — Orders Procedures
 *
 * Covers:
 *  • Polar webhook order creation (internal)
 *  • Buyer order queries (my orders, order detail)
 *  • Code delivery & download tracking
 *  • Admin order management (list, refund notes, override status)
 */

import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import {
  requireUser,
  requireAdmin,
  now,
  writeAuditLog,
  sendNotification,
} from "./helpers";

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — called from Polar webhook action
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates an order record when Polar fires an order.created / checkout.succeeded event.
 * The action handler is responsible for resolving userId + ideaId from Polar metadata.
 */
export const createOrderFromPolar = internalMutation({
  args: {
    userId: v.id("users"),
    ideaId: v.id("ideas"),
    type: v.union(
      v.literal("code_purchase"),
      v.literal("exclusive_license"),
      v.literal("customization_deposit")
    ),
    amountTotal: v.number(),
    amountTax: v.number(),
    currency: v.string(),
    polarOrderId: v.string(),
    polarProductId: v.string(),
    polarCheckoutId: v.optional(v.string()),
    receiptUrl: v.optional(v.string()),
    buyerNotes: v.optional(v.string()),
    maxDownloads: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Idempotency — don't double-insert if webhook fires twice
    const existing = await ctx.db
      .query("orders")
      .withIndex("by_polarOrderId", (q) =>
        q.eq("polarOrderId", args.polarOrderId)
      )
      .unique();
    if (existing) return existing._id;

    const orderId = await ctx.db.insert("orders", {
      userId: args.userId,
      ideaId: args.ideaId,
      type: args.type,
      status: "paid",
      amountTotal: args.amountTotal,
      amountTax: args.amountTax,
      currency: args.currency,
      polarOrderId: args.polarOrderId,
      polarProductId: args.polarProductId,
      polarCheckoutId: args.polarCheckoutId,
      receiptUrl: args.receiptUrl,
      codeDelivered: false,
      downloadCount: 0,
      maxDownloads: args.maxDownloads ?? 10,
      buyerNotes: args.buyerNotes,
      createdAt: now(),
      updatedAt: now(),
    });

    // Update idea purchase count
    const idea = await ctx.db.get(args.ideaId);
    if (idea) {
      await ctx.db.patch(args.ideaId, {
        purchaseCount: idea.purchaseCount + 1,
        // If exclusive, mark sold out
        ...(args.type === "exclusive_license" ? { status: "sold_out" } : {}),
      });
    }

    // Update user stats
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        totalPurchases: user.totalPurchases + 1,
        totalSpent: user.totalSpent + args.amountTotal,
        updatedAt: now(),
      });
    }

    // Notify buyer
    await sendNotification(ctx, {
      userId: args.userId,
      type: "order_confirmed",
      title: "Order Confirmed 🎉",
      body: `Your purchase of "${idea?.title}" is confirmed. We'll deliver your code shortly.`,
      actionUrl: `/dashboard/orders/${orderId}`,
      relatedId: orderId,
    });

    return orderId;
  },
});

/**
 * Mark an order's payment status from a Polar webhook (e.g., refunded, disputed).
 */
export const updateOrderStatusFromPolar = internalMutation({
  args: {
    polarOrderId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("refunded"),
      v.literal("disputed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_polarOrderId", (q) =>
        q.eq("polarOrderId", args.polarOrderId)
      )
      .unique();

    if (!order) throw new Error("NOT_FOUND: Order not found.");

    await ctx.db.patch(order._id, { status: args.status, updatedAt: now() });

    if (args.status === "refunded") {
      // Roll back purchase count
      const idea = await ctx.db.get(order.ideaId);
      if (idea) {
        await ctx.db.patch(order.ideaId, {
          purchaseCount: Math.max(0, idea.purchaseCount - 1),
        });
      }
      const user = await ctx.db.get(order.userId);
      if (user) {
        await ctx.db.patch(order.userId, {
          totalPurchases: Math.max(0, user.totalPurchases - 1),
          totalSpent: Math.max(0, user.totalSpent - order.amountTotal),
          updatedAt: now(),
        });
      }
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES — buyer
// ─────────────────────────────────────────────────────────────────────────────

/** All orders for the current user. */
export const getMyOrders = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, { paginationOpts }) => {
    const user = await requireUser(ctx);

    const page = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(paginationOpts);

    const enriched = await Promise.all(
      page.page.map(async (order) => {
        const idea = await ctx.db.get(order.ideaId);
        return { ...order, idea };
      })
    );

    return { ...page, page: enriched };
  },
});

/** Single order detail — verifies the caller owns it. */
export const getOrderById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const user = await requireUser(ctx);
    const order = await ctx.db.get(orderId);

    if (!order) return null;
    if (order.userId !== user._id && user.role !== "admin")
      throw new Error("FORBIDDEN");

    const idea = await ctx.db.get(order.ideaId);
    const codeAsset = await ctx.db
      .query("codeAssets")
      .withIndex("by_idea_latest", (q) =>
        q.eq("ideaId", order.ideaId).eq("isLatest", true)
      )
      .unique();

    return { ...order, idea, codeAsset };
  },
});

/** Check whether the current user has purchased a specific idea. */
export const hasPurchasedIdea = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return false;

    const order = await ctx.db
      .query("orders")
      .withIndex("by_user_idea", (q) =>
        q.eq("userId", user._id).eq("ideaId", ideaId)
      )
      .filter((q) => q.eq(q.field("status"), "paid"))
      .first();

    return !!order;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS — code delivery
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate and return a short-lived download URL for the code asset.
 * Enforces ownership and download limits.
 */
export const generateDownloadUrl = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const user = await requireUser(ctx);
    const order = await ctx.db.get(orderId);

    if (!order) throw new Error("NOT_FOUND");
    if (order.userId !== user._id) throw new Error("FORBIDDEN");
    if (order.status !== "paid") throw new Error("ORDER_NOT_PAID");
    if (order.downloadCount >= order.maxDownloads)
      throw new Error("DOWNLOAD_LIMIT_REACHED: Please contact support.");

    // Fetch latest code asset
    const asset = await ctx.db
      .query("codeAssets")
      .withIndex("by_idea_latest", (q) =>
        q.eq("ideaId", order.ideaId).eq("isLatest", true)
      )
      .unique();

    if (!asset) throw new Error("CODE_NOT_READY: The code file is not uploaded yet.");

    // Track download
    await ctx.db.insert("orderDownloads", {
      orderId,
      userId: user._id,
      fileId: asset.fileId,
      fileName: asset.fileName,
      createdAt: now(),
    });

    await ctx.db.patch(orderId, {
      downloadCount: order.downloadCount + 1,
      codeDelivered: true,
      codeDeliveredAt: order.codeDeliveredAt ?? now(),
      updatedAt: now(),
    });

    // Return a short-lived Convex storage URL
    const url = await ctx.storage.getUrl(asset.fileId);
    return { url, fileName: asset.fileName, version: asset.version };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS — admin
// ─────────────────────────────────────────────────────────────────────────────

export const adminUpdateOrder = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("refunded"),
        v.literal("disputed"),
        v.literal("failed")
      )
    ),
    adminNotes: v.optional(v.string()),
    maxDownloads: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    const { orderId, ...patch } = args;

    await ctx.db.patch(orderId, { ...patch, updatedAt: now() });

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "order.adminUpdate",
      targetType: "order",
      targetId: orderId,
      metadata: patch,
    });
  },
});

export const adminListOrders = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("refunded"),
        v.literal("disputed"),
        v.literal("failed")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const base = args.status
      ? ctx.db
          .query("orders")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
      : ctx.db.query("orders");

    const page = await base.order("desc").paginate(args.paginationOpts);

    const enriched = await Promise.all(
      page.page.map(async (order) => {
        const user = await ctx.db.get(order.userId);
        const idea = await ctx.db.get(order.ideaId);
        return { ...order, user, idea };
      })
    );

    return { ...page, page: enriched };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES — admin revenue dashboard
// ─────────────────────────────────────────────────────────────────────────────

export const getRevenueSummary = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, { days = 30 }) => {
    await requireAdmin(ctx);

    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "paid"))
      .filter((q) => q.gte(q.field("createdAt"), since))
      .collect();

    const totalRevenue = orders.reduce((s, o) => s + o.amountTotal, 0);
    const byType: Record<string, number> = {};
    for (const o of orders) {
      byType[o.type] = (byType[o.type] ?? 0) + o.amountTotal;
    }

    // Revenue by day
    const byDay: Record<string, number> = {};
    for (const o of orders) {
      const day = new Date(o.createdAt).toISOString().split("T")[0];
      byDay[day] = (byDay[day] ?? 0) + o.amountTotal;
    }

    return {
      totalRevenueCents: totalRevenue,
      orderCount: orders.length,
      byType,
      byDay,
      averageOrderValueCents: orders.length
        ? Math.round(totalRevenue / orders.length)
        : 0,
    };
  },
});