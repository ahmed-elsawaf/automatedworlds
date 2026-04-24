/**
 * AutomatedWorlds — Customization Requests & Messages
 *
 * Covers:
 *  • Buyer: submit brief, accept/reject quote
 *  • Admin: update status, send quote, mark delivered
 *  • Threaded messaging (buyer ↔ admin)
 *  • File attachment uploads
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  requireUser,
  requireAdmin,
  now,
  writeAuditLog,
  sendNotification,
} from "./helpers";

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS — buyer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit customization brief after the deposit order is paid.
 */
export const submitCustomizationRequest = mutation({
  args: {
    orderId: v.id("orders"),
    ideaId: v.id("ideas"),
    brandName: v.optional(v.string()),
    brandColors: v.optional(v.array(v.string())),
    brandLogoFileId: v.optional(v.id("_storage")),
    targetDomain: v.optional(v.string()),
    customFeatures: v.optional(v.string()),
    additionalNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Verify the order belongs to this user
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("NOT_FOUND: Order not found.");
    if (order.userId !== user._id) throw new Error("FORBIDDEN");
    if (order.status !== "paid") throw new Error("ORDER_NOT_PAID");
    if (order.type !== "customization_deposit")
      throw new Error("NOT_CUSTOMIZATION_ORDER");

    // Prevent duplicate submissions
    const existing = await ctx.db
      .query("customizationRequests")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .first();
    if (existing) throw new Error("CONFLICT: Customization request already submitted.");

    const requestId = await ctx.db.insert("customizationRequests", {
      orderId: args.orderId,
      userId: user._id,
      ideaId: args.ideaId,
      status: "submitted",
      brandName: args.brandName,
      brandColors: args.brandColors,
      brandLogoFileId: args.brandLogoFileId,
      targetDomain: args.targetDomain,
      customFeatures: args.customFeatures,
      additionalNotes: args.additionalNotes,
      createdAt: now(),
      updatedAt: now(),
    });

    // Auto-send a welcome message from admin side
    const idea = await ctx.db.get(args.ideaId);

    // Notify admin(s) — find admins to notify
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .take(5);

    for (const admin of admins) {
      await sendNotification(ctx, {
        userId: admin._id,
        type: "customization_message",
        title: "New Customization Request",
        body: `${user.name ?? user.email} submitted a brief for "${idea?.title}".`,
        actionUrl: `/admin/customizations/${requestId}`,
        relatedId: requestId,
      });
    }

    return requestId;
  },
});

/** Buyer accepts the admin's quote. */
export const acceptCustomizationQuote = mutation({
  args: { requestId: v.id("customizationRequests") },
  handler: async (ctx, { requestId }) => {
    const user = await requireUser(ctx);
    const req = await ctx.db.get(requestId);

    if (!req) throw new Error("NOT_FOUND");
    if (req.userId !== user._id) throw new Error("FORBIDDEN");
    if (req.status !== "quoted") throw new Error("NO_QUOTE_TO_ACCEPT");

    if (req.quoteExpiresAt && req.quoteExpiresAt < Date.now())
      throw new Error("QUOTE_EXPIRED");

    await ctx.db.patch(requestId, {
      status: "accepted",
      quoteAcceptedAt: now(),
      updatedAt: now(),
    });

    // Notify admin
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .take(5);

    const idea = await ctx.db.get(req.ideaId);

    for (const admin of admins) {
      await sendNotification(ctx, {
        userId: admin._id,
        type: "customization_message",
        title: "Quote Accepted",
        body: `${user.name ?? user.email} accepted the quote for "${idea?.title}". Work can begin.`,
        actionUrl: `/admin/customizations/${requestId}`,
        relatedId: requestId,
      });
    }
  },
});

/** Buyer cancels their request. */
export const cancelCustomizationRequest = mutation({
  args: { requestId: v.id("customizationRequests") },
  handler: async (ctx, { requestId }) => {
    const user = await requireUser(ctx);
    const req = await ctx.db.get(requestId);

    if (!req) throw new Error("NOT_FOUND");
    if (req.userId !== user._id) throw new Error("FORBIDDEN");

    const cancelableStatuses = ["submitted", "reviewing", "quoted"];
    if (!cancelableStatuses.includes(req.status))
      throw new Error("CANNOT_CANCEL: Work has already started.");

    await ctx.db.patch(requestId, {
      status: "cancelled",
      updatedAt: now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS — admin
// ─────────────────────────────────────────────────────────────────────────────

/** Move request to "reviewing". */
export const adminStartReview = mutation({
  args: { requestId: v.id("customizationRequests") },
  handler: async (ctx, { requestId }) => {
    const actor = await requireAdmin(ctx);

    await ctx.db.patch(requestId, { status: "reviewing", updatedAt: now() });

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "customization.startReview",
      targetType: "customizationRequest",
      targetId: requestId,
    });
  },
});

/** Send a quote to the buyer. */
export const adminSendQuote = mutation({
  args: {
    requestId: v.id("customizationRequests"),
    quotedPrice: v.number(),
    quotedTimeline: v.string(),
    quoteValidDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("NOT_FOUND");

    const expiresAt = args.quoteValidDays
      ? Date.now() + args.quoteValidDays * 24 * 60 * 60 * 1000
      : undefined;

    await ctx.db.patch(args.requestId, {
      status: "quoted",
      quotedPrice: args.quotedPrice,
      quotedTimeline: args.quotedTimeline,
      quoteExpiresAt: expiresAt,
      updatedAt: now(),
    });

    // Notify buyer
    const idea = await ctx.db.get(req.ideaId);
    await sendNotification(ctx, {
      userId: req.userId,
      type: "quote_received",
      title: "Your Customization Quote is Ready",
      body: `Review and accept your quote for "${idea?.title}". Valid for ${args.quoteValidDays ?? 7} days.`,
      actionUrl: `/dashboard/customizations/${args.requestId}`,
      relatedId: args.requestId,
    });

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "customization.sendQuote",
      targetType: "customizationRequest",
      targetId: args.requestId,
      metadata: { quotedPrice: args.quotedPrice, quotedTimeline: args.quotedTimeline },
    });
  },
});

/** Admin begins development work. */
export const adminStartWork = mutation({
  args: { requestId: v.id("customizationRequests") },
  handler: async (ctx, { requestId }) => {
    const actor = await requireAdmin(ctx);
    const req = await ctx.db.get(requestId);
    if (!req) throw new Error("NOT_FOUND");
    if (req.status !== "accepted") throw new Error("QUOTE_NOT_ACCEPTED");

    await ctx.db.patch(requestId, { status: "in_progress", updatedAt: now() });

    const idea = await ctx.db.get(req.ideaId);
    await sendNotification(ctx, {
      userId: req.userId,
      type: "customization_update",
      title: "Work Has Started",
      body: `The team has started working on your customization of "${idea?.title}".`,
      actionUrl: `/dashboard/customizations/${requestId}`,
      relatedId: requestId,
    });

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "customization.startWork",
      targetType: "customizationRequest",
      targetId: requestId,
    });
  },
});

/** Admin delivers the finished product for client review. */
export const adminMarkReadyForReview = mutation({
  args: {
    requestId: v.id("customizationRequests"),
    deliveredUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("NOT_FOUND");

    await ctx.db.patch(args.requestId, {
      status: "review_ready",
      deliveredUrl: args.deliveredUrl,
      deliveredAt: now(),
      updatedAt: now(),
    });

    const idea = await ctx.db.get(req.ideaId);
    await sendNotification(ctx, {
      userId: req.userId,
      type: "customization_update",
      title: "Your Build is Ready for Review 🚀",
      body: `"${idea?.title}" is ready! Visit ${args.deliveredUrl} to review and test it.`,
      actionUrl: `/dashboard/customizations/${args.requestId}`,
      relatedId: args.requestId,
    });

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "customization.readyForReview",
      targetType: "customizationRequest",
      targetId: args.requestId,
      metadata: { deliveredUrl: args.deliveredUrl },
    });
  },
});

/** Admin marks the project fully completed. */
export const adminCompleteRequest = mutation({
  args: { requestId: v.id("customizationRequests") },
  handler: async (ctx, { requestId }) => {
    const actor = await requireAdmin(ctx);
    await ctx.db.patch(requestId, { status: "completed", updatedAt: now() });

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "customization.complete",
      targetType: "customizationRequest",
      targetId: requestId,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS — messaging
// ─────────────────────────────────────────────────────────────────────────────

export const sendCustomizationMessage = mutation({
  args: {
    requestId: v.id("customizationRequests"),
    body: v.string(),
    attachmentIds: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("NOT_FOUND");

    const isAdmin = user.role === "admin";
    const isBuyer = req.userId === user._id;
    if (!isAdmin && !isBuyer) throw new Error("FORBIDDEN");

    const messageId = await ctx.db.insert("customizationMessages", {
      requestId: args.requestId,
      senderId: user._id,
      senderRole: isAdmin ? "admin" : "client",
      body: args.body,
      attachmentIds: args.attachmentIds ?? [],
      isRead: false,
      createdAt: now(),
    });

    // Notify the other party
    const recipientId = isAdmin ? req.userId : undefined;
    if (recipientId) {
      const idea = await ctx.db.get(req.ideaId);
      await sendNotification(ctx, {
        userId: recipientId,
        type: "customization_message",
        title: "New message from the team",
        body: `You have a new message regarding your "${idea?.title}" customization.`,
        actionUrl: `/dashboard/customizations/${args.requestId}`,
        relatedId: args.requestId,
      });
    }

    return messageId;
  },
});

export const markMessagesRead = mutation({
  args: { requestId: v.id("customizationRequests") },
  handler: async (ctx, { requestId }) => {
    const user = await requireUser(ctx);
    const req = await ctx.db.get(requestId);
    if (!req) throw new Error("NOT_FOUND");

    if (req.userId !== user._id && user.role !== "admin")
      throw new Error("FORBIDDEN");

    const unread = await ctx.db
      .query("customizationMessages")
      .withIndex("by_request_unread", (q) =>
        q.eq("requestId", requestId).eq("isRead", false)
      )
      .collect();

    await Promise.all(unread.map((m) => ctx.db.patch(m._id, { isRead: true })));
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export const getMyCustomizationRequests = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, { paginationOpts }) => {
    const user = await requireUser(ctx);

    const page = await ctx.db
      .query("customizationRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(paginationOpts);

    const enriched = await Promise.all(
      page.page.map(async (req) => {
        const idea = await ctx.db.get(req.ideaId);
        return { ...req, idea };
      })
    );

    return { ...page, page: enriched };
  },
});

export const getCustomizationRequestDetail = query({
  args: { requestId: v.id("customizationRequests") },
  handler: async (ctx, { requestId }) => {
    const user = await requireUser(ctx);
    const req = await ctx.db.get(requestId);

    if (!req) return null;
    if (req.userId !== user._id && user.role !== "admin")
      throw new Error("FORBIDDEN");

    const idea = await ctx.db.get(req.ideaId);
    const order = await ctx.db.get(req.orderId);
    const messages = await ctx.db
      .query("customizationMessages")
      .withIndex("by_request", (q) => q.eq("requestId", requestId))
      .order("asc")
      .collect();

    const requestUser = await ctx.db.get(req.userId);

    return { ...req, idea, order, messages, user: requestUser };
  },
});

export const adminListCustomizationRequests = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
    status: v.optional(
      v.union(
        v.literal("submitted"),
        v.literal("reviewing"),
        v.literal("quoted"),
        v.literal("accepted"),
        v.literal("in_progress"),
        v.literal("review_ready"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const base = args.status
      ? ctx.db
          .query("customizationRequests")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
      : ctx.db.query("customizationRequests");

    const page = await base.order("desc").paginate(args.paginationOpts);

    const enriched = await Promise.all(
      page.page.map(async (req) => {
        const user = await ctx.db.get(req.userId);
        const idea = await ctx.db.get(req.ideaId);
        const unreadCount = await ctx.db
          .query("customizationMessages")
          .withIndex("by_request_unread", (q) =>
            q.eq("requestId", req._id).eq("isRead", false)
          )
          .collect()
          .then((r) => r.length);
        return { ...req, user, idea, unreadCount };
      })
    );

    return { ...page, page: enriched };
  },
});

export const adminUpdateCustomizationStatus = mutation({
  args: {
    requestId: v.id("customizationRequests"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.requestId, { status: args.status as any, updatedAt: now() });
  },
});