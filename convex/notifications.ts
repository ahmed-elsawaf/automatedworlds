/**
 * AutomatedWorlds — Notifications, Waitlist, Site Settings & Audit Log
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, requireAdmin, now, writeAuditLog } from "./helpers";

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getMyNotifications = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { paginationOpts, unreadOnly }) => {
    const user = await requireUser(ctx);

    if (unreadOnly) {
      return ctx.db
        .query("notifications")
        .withIndex("by_user_unread", (q) =>
          q.eq("userId", user._id).eq("isRead", false)
        )
        .order("desc")
        .paginate(paginationOpts);
    }

    return ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(paginationOpts);
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) return 0;

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});

export const markNotificationRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const user = await requireUser(ctx);
    const notif = await ctx.db.get(notificationId);

    if (!notif) throw new Error("NOT_FOUND");
    if (notif.userId !== user._id) throw new Error("FORBIDDEN");

    await ctx.db.patch(notificationId, { isRead: true });
  },
});

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_unread", (q) =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect();

    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { isRead: true }))
    );

    return unread.length;
  },
});

export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const user = await requireUser(ctx);
    const notif = await ctx.db.get(notificationId);

    if (!notif) throw new Error("NOT_FOUND");
    if (notif.userId !== user._id) throw new Error("FORBIDDEN");

    await ctx.db.delete(notificationId);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// WAITLIST
// ─────────────────────────────────────────────────────────────────────────────

export const joinWaitlist = mutation({
  args: {
    ideaId: v.id("ideas"),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let userId = undefined;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
      userId = user?._id;
    }

    // Idempotent by email per idea
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existing) return existing._id;

    return ctx.db.insert("waitlist", {
      ideaId: args.ideaId,
      userId,
      email: args.email,
      notified: false,
      createdAt: now(),
    });
  },
});

export const adminGetWaitlist = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("waitlist")
      .withIndex("by_idea", (q) => q.eq("ideaId", ideaId))
      .order("asc")
      .collect();
  },
});

/** Mark waitlist entries as notified after sending emails. */
export const adminMarkWaitlistNotified = mutation({
  args: { waitlistIds: v.array(v.id("waitlist")) },
  handler: async (ctx, { waitlistIds }) => {
    await requireAdmin(ctx);
    await Promise.all(
      waitlistIds.map((id) => ctx.db.patch(id, { notified: true }))
    );
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SITE SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

export const getSiteSetting = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const setting = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    return setting ? JSON.parse(setting.value) : null;
  },
});

export const getAllSiteSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const settings = await ctx.db.query("siteSettings").collect();
    return Object.fromEntries(
      settings.map((s) => [s.key, JSON.parse(s.value)])
    );
  },
});

export const setSiteSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    label: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);

    const existing = await ctx.db
      .query("siteSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    const serialized = JSON.stringify(args.value);

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: serialized,
        label: args.label,
        updatedBy: actor._id,
        updatedAt: now(),
      });
    } else {
      await ctx.db.insert("siteSettings", {
        key: args.key,
        value: serialized,
        label: args.label,
        updatedBy: actor._id,
        updatedAt: now(),
      });
    }

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "settings.set",
      targetType: "siteSettings",
      targetId: args.key,
      metadata: { value: args.value },
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────────────────

export const getAuditLog = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    actorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let q;
    if (args.targetType && args.targetId) {
      q = ctx.db
        .query("auditLog")
        .withIndex("by_target", (qi) =>
          qi.eq("targetType", args.targetType!).eq("targetId", args.targetId!)
        )
        .order("desc");
    } else if (args.actorId) {
      q = ctx.db
        .query("auditLog")
        .withIndex("by_actor", (qi) => qi.eq("actorId", args.actorId!))
        .order("desc");
    } else {
      q = ctx.db.query("auditLog").withIndex("by_created").order("desc");
    }

    const page = await q.paginate(args.paginationOpts);

    const enriched = await Promise.all(
      page.page.map(async (entry) => {
        const actor = await ctx.db.get(entry.actorId);
        return {
          ...entry,
          actor: actor ? { name: actor.name, email: actor.email } : null,
          metadata: entry.metadata ? JSON.parse(entry.metadata) : null,
        };
      })
    );

    return { ...page, page: enriched };
  },
});