/**
 * AutomatedWorlds — Users Procedures
 *
 * Covers:
 *  • Public profile queries
 *  • Self-update (profile, preferences, onboarding)
 *  • Admin user management
 *  • Polar subscription sync
 */

import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  internalQuery,
} from "./_generated/server";
import { requireUser, requireAdmin, now, writeAuditLog } from "./helpers";

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL / AUTH SYNC — Explicit User Sync
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Synchronize a user from Clerk session to Convex.
 * Called securely by the client on auth load.
 */
export const storeUser = mutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    const email = args.email ?? identity.email ?? "";
    const name = args.name ?? identity.name ?? "Anonymous";
    const avatarUrl = args.profileImageUrl ?? identity.pictureUrl;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (existing) {
      // Merge updates if name, picture, or email changed/was missing
      const shouldUpdate = 
        existing.name !== name ||
        existing.avatarUrl !== avatarUrl ||
        (email && existing.email !== email);

      if (shouldUpdate) {
        await ctx.db.patch(existing._id, {
          name: name ?? existing.name,
          avatarUrl: avatarUrl ?? existing.avatarUrl,
          email: email || existing.email,
          updatedAt: now(),
        });
      }
      return existing._id;
    }

    // New user signup via client sync
    return await ctx.db.insert("users", {
      clerkId: identity.subject,
      email: email,
      name: name,
      avatarUrl: avatarUrl,
      role: "member",
      plan: "free",
      totalPurchases: 0,
      totalSpent: 0,
      savedIdeas: [],
      onboardingComplete: false,
      createdAt: now(),
      updatedAt: now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — Polar sync
// ─────────────────────────────────────────────────────────────────────────────

export const syncPolarSubscription = internalMutation({
  args: {
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
    polarSubscriptionStatus: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("unpaid")
    ),
    plan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
    planExpiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_polarCustomerId", (q) =>
        q.eq("polarCustomerId", args.polarCustomerId)
      )
      .unique();

    if (!user) throw new Error("USER_NOT_FOUND: No user with that Polar customer ID.");

    await ctx.db.patch(user._id, {
      polarSubscriptionId: args.polarSubscriptionId,
      polarSubscriptionStatus: args.polarSubscriptionStatus,
      plan: args.plan,
      planExpiresAt: args.planExpiresAt,
      updatedAt: now(),
    });
  },
});

/** Store the Polar customer ID the first time it arrives (checkout.created). */
export const setPolarCustomerId = internalMutation({
  args: { clerkId: v.string(), polarCustomerId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) throw new Error("USER_NOT_FOUND");

    await ctx.db.patch(user._id, {
      polarCustomerId: args.polarCustomerId,
      updatedAt: now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES — public / self
// ─────────────────────────────────────────────────────────────────────────────

/** Get the currently authenticated user's full record. */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});

/** Public-safe profile for a user (strips billing/private fields). */
export const getPublicProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;

    return {
      _id: user._id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      website: user.website,
      company: user.company,
      totalPurchases: user.totalPurchases,
      createdAt: user.createdAt,
    };
  },
});

/** Resolve a user from their Clerk ID (used internally by auth-gated queries). */
export const getByClerkId = internalQuery({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    return ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS — self
// ─────────────────────────────────────────────────────────────────────────────

/** Update the current user's profile information. */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    company: v.optional(v.string()),
    country: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    await ctx.db.patch(user._id, {
      ...args,
      updatedAt: now(),
    });

    return user._id;
  },
});

/** Mark onboarding as complete for the current user. */
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    await ctx.db.patch(user._id, {
      onboardingComplete: true,
      updatedAt: now(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS — admin
// ─────────────────────────────────────────────────────────────────────────────

/** Admin: list all users with pagination. */
export const adminListUsers = query({
  args: {
    paginationOpts: v.optional(
      v.object({ numItems: v.number(), cursor: v.union(v.string(), v.null()) })
    ),
    plan: v.optional(
      v.union(
        v.literal("free"),
        v.literal("starter"),
        v.literal("pro"),
        v.literal("enterprise")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let q = ctx.db.query("users").order("desc");

    if (args.plan) {
      q = ctx.db
        .query("users")
        .withIndex("by_plan", (qi) => qi.eq("plan", args.plan!))
        .order("desc") as typeof q;
    }

    return q.paginate(args.paginationOpts ?? { numItems: 20, cursor: null });
  },
});

/** Admin: change a user's role. */
export const adminSetRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { role: args.role, updatedAt: now() });
    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "user.setRole",
      targetType: "user",
      targetId: args.userId,
      metadata: { role: args.role },
    });
  },
});

/** Admin: manually override a user's plan (e.g. for comp accounts). */
export const adminSetPlan = mutation({
  args: {
    userId: v.id("users"),
    plan: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    await ctx.db.patch(args.userId, { plan: args.plan, updatedAt: now() });
    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "user.setPlan",
      targetType: "user",
      targetId: args.userId,
      metadata: { plan: args.plan },
    });
  },
});