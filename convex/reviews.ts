/**
 * AutomatedWorlds — Reviews Procedures
 *
 * Covers:
 *  • Create / update review (buyers only, one per order)
 *  • Moderation (admin approve / reject)
 *  • Helpful / not-helpful votes
 *  • Public listing with pagination
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

export const createReview = mutation({
  args: {
    ideaId: v.id("ideas"),
    orderId: v.id("orders"),
    rating: v.number(),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    pros: v.array(v.string()),
    cons: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.rating < 1 || args.rating > 5)
      throw new Error("VALIDATION: Rating must be between 1 and 5.");

    // Verify the order belongs to this user and is paid
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("NOT_FOUND: Order not found.");
    if (order.userId !== user._id) throw new Error("FORBIDDEN");
    if (order.status !== "paid") throw new Error("ORDER_NOT_PAID");

    // One review per order
    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("orderId"), args.orderId))
      .first();
    if (existing) throw new Error("CONFLICT: You have already reviewed this purchase.");

    const reviewId = await ctx.db.insert("reviews", {
      ideaId: args.ideaId,
      userId: user._id,
      orderId: args.orderId,
      rating: args.rating,
      title: args.title,
      body: args.body,
      pros: args.pros,
      cons: args.cons,
      status: "pending",
      helpfulCount: 0,
      notHelpfulCount: 0,
      createdAt: now(),
      updatedAt: now(),
    });

    // Notify admins to moderate
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .take(3);

    const idea = await ctx.db.get(args.ideaId);
    for (const admin of admins) {
      await sendNotification(ctx, {
        userId: admin._id,
        type: "review_approved",
        title: "New Review Pending",
        body: `${user.name ?? user.email} left a ${args.rating}★ review on "${idea?.title}".`,
        actionUrl: `/admin/reviews/${reviewId}`,
        relatedId: reviewId,
      });
    }

    return reviewId;
  },
});

export const updateReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    rating: v.optional(v.number()),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    pros: v.optional(v.array(v.string())),
    cons: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { reviewId, ...patch } = args;

    const review = await ctx.db.get(reviewId);
    if (!review) throw new Error("NOT_FOUND");
    if (review.userId !== user._id) throw new Error("FORBIDDEN");
    if (review.status === "approved")
      throw new Error("LOCKED: Approved reviews cannot be edited.");

    if (patch.rating && (patch.rating < 1 || patch.rating > 5))
      throw new Error("VALIDATION: Rating must be 1–5.");

    await ctx.db.patch(reviewId, { ...patch, status: "pending", updatedAt: now() });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS — admin moderation
// ─────────────────────────────────────────────────────────────────────────────

export const moderateReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("NOT_FOUND");

    await ctx.db.patch(args.reviewId, {
      status: args.status,
      adminNotes: args.adminNotes,
      updatedAt: now(),
    });

    if (args.status === "approved") {
      // Re-compute idea's average rating
      const allApproved = await ctx.db
        .query("reviews")
        .withIndex("by_idea_status", (q) =>
          q.eq("ideaId", review.ideaId).eq("status", "approved")
        )
        .collect();

      const avg =
        allApproved.reduce((s, r) => s + r.rating, 0) / allApproved.length;

      await ctx.db.patch(review.ideaId, {
        rating: Math.round(avg * 10) / 10,
        reviewCount: allApproved.length,
        updatedAt: now(),
      });

      // Notify reviewer
      const idea = await ctx.db.get(review.ideaId);
      await sendNotification(ctx, {
        userId: review.userId,
        type: "review_approved",
        title: "Your Review is Published",
        body: `Your review of "${idea?.title}" has been approved and is now live.`,
        actionUrl: `/ideas/${idea?.slug}#reviews`,
        relatedId: review.ideaId,
      });
    }

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: `review.${args.status}`,
      targetType: "review",
      targetId: args.reviewId,
      metadata: { adminNotes: args.adminNotes },
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS — helpful votes
// ─────────────────────────────────────────────────────────────────────────────

export const voteOnReview = mutation({
  args: {
    reviewId: v.id("reviews"),
    vote: v.union(v.literal("helpful"), v.literal("not_helpful")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Upsert vote
    const existing = await ctx.db
      .query("reviewVotes")
      .withIndex("by_user_review", (q) =>
        q.eq("userId", user._id).eq("reviewId", args.reviewId)
      )
      .unique();

    if (existing) {
      if (existing.vote === args.vote) {
        // Unvote
        await ctx.db.delete(existing._id);
        const review = await ctx.db.get(args.reviewId);
        if (review) {
          await ctx.db.patch(args.reviewId, {
            helpfulCount:
              args.vote === "helpful"
                ? Math.max(0, review.helpfulCount - 1)
                : review.helpfulCount,
            notHelpfulCount:
              args.vote === "not_helpful"
                ? Math.max(0, review.notHelpfulCount - 1)
                : review.notHelpfulCount,
          });
        }
      } else {
        // Change vote
        await ctx.db.patch(existing._id, { vote: args.vote, createdAt: now() });
        const review = await ctx.db.get(args.reviewId);
        if (review) {
          await ctx.db.patch(args.reviewId, {
            helpfulCount:
              args.vote === "helpful"
                ? review.helpfulCount + 1
                : Math.max(0, review.helpfulCount - 1),
            notHelpfulCount:
              args.vote === "not_helpful"
                ? review.notHelpfulCount + 1
                : Math.max(0, review.notHelpfulCount - 1),
          });
        }
      }
    } else {
      await ctx.db.insert("reviewVotes", {
        reviewId: args.reviewId,
        userId: user._id,
        vote: args.vote,
        createdAt: now(),
      });
      const review = await ctx.db.get(args.reviewId);
      if (review) {
        await ctx.db.patch(args.reviewId, {
          helpfulCount:
            args.vote === "helpful"
              ? review.helpfulCount + 1
              : review.helpfulCount,
          notHelpfulCount:
            args.vote === "not_helpful"
              ? review.notHelpfulCount + 1
              : review.notHelpfulCount,
        });
      }
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

export const getIdeaReviews = query({
  args: {
    ideaId: v.id("ideas"),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, { ideaId, paginationOpts }) => {
    const page = await ctx.db
      .query("reviews")
      .withIndex("by_idea_status", (q) =>
        q.eq("ideaId", ideaId).eq("status", "approved")
      )
      .order("desc")
      .paginate(paginationOpts);

    const identity = await ctx.auth.getUserIdentity();
    let currentUserId: string | null = null;
    if (identity) {
      const u = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
      currentUserId = u?._id ?? null;
    }

    const enriched = await Promise.all(
      page.page.map(async (review) => {
        const author = await ctx.db.get(review.userId);
        let myVote: string | null = null;
        if (currentUserId) {
          const vote = await ctx.db
            .query("reviewVotes")
            .withIndex("by_user_review", (q) =>
              q.eq("userId", currentUserId as any).eq("reviewId", review._id)
            )
            .unique();
          myVote = vote?.vote ?? null;
        }
        return {
          ...review,
          author: author
            ? { name: author.name, avatarUrl: author.avatarUrl }
            : null,
          myVote,
        };
      })
    );

    return { ...page, page: enriched };
  },
});

export const adminListPendingReviews = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx);

    const page = await ctx.db
      .query("reviews")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("asc")
      .paginate(paginationOpts);

    const enriched = await Promise.all(
      page.page.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        const idea = await ctx.db.get(review.ideaId);
        return { ...review, user, idea };
      })
    );

    return { ...page, page: enriched };
  },
});