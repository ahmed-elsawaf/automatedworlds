/**
 * AutomatedWorlds — Ideas Procedures
 *
 * Covers:
 *  • Public browsing (list, filter, search, featured)
 *  • Single idea detail (with access control)
 *  • Admin CRUD + publish workflow
 *  • Idea sections (CMS blocks)
 *  • View tracking
 *  • Save / unsave
 */

import { v } from "convex/values";
import {
  mutation,
  query,
  internalMutation,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import {
  requireUser,
  requireAdmin,
  now,
  slugify,
  writeAuditLog,
  sendNotification,
  ideaIsAccessible,
  clampPageSize,
} from "./helpers";

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES — browsing (public)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Paginated idea listing with optional filters.
 * Enforces visibility rules based on the requesting user's plan.
 */
export const listIdeas = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
    categoryId: v.optional(v.id("categories")),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    roiPotential: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("very_high")
      )
    ),
    featuredOnly: v.optional(v.boolean()),
    sortBy: v.optional(
      v.union(
        v.literal("newest"),
        v.literal("popular"),
        v.literal("most_purchased"),
        v.literal("top_rated")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let currentUser = null;
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
    }

    // Choose index based on sort
    let baseQuery;
    if (args.featuredOnly) {
      baseQuery = ctx.db
        .query("ideas")
        .withIndex("by_featured", (q) => q.eq("isFeatured", true))
        .order("desc");
    } else if (args.sortBy === "popular") {
      baseQuery = ctx.db.query("ideas").withIndex("by_viewCount").order("desc");
    } else if (args.sortBy === "most_purchased") {
      baseQuery = ctx.db
        .query("ideas")
        .withIndex("by_purchaseCount")
        .order("desc");
    } else if (args.categoryId) {
      baseQuery = ctx.db
        .query("ideas")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId!))
        .order("desc");
    } else {
      baseQuery = ctx.db
        .query("ideas")
        .withIndex("by_publishedAt")
        .order("desc");
    }

    const page = await baseQuery
      .filter((q) => q.eq(q.field("status"), "published"))
      .paginate(args.paginationOpts);

    // Post-filter: difficulty / roi / visibility
    const filtered = page.page.filter((idea) => {
      if (!ideaIsAccessible(idea, currentUser)) return false;
      if (args.difficulty && idea.difficulty !== args.difficulty) return false;
      if (args.roiPotential && idea.roiPotential !== args.roiPotential)
        return false;
      return true;
    });

    // Resolve cover image URLs
    const ideasWithUrls = await Promise.all(
      filtered.map(async (idea) => {
        const url = idea.coverImageId ? await ctx.storage.getUrl(idea.coverImageId) : null;
        return {
          ...idea,
          coverImageUrl: url,
        };
      })
    );

    return { ...page, page: ideasWithUrls };
  },
});

/**
 * Full-text search across idea titles.
 */
export const searchIdeas = query({
  args: {
    query: v.string(),
    categoryId: v.optional(v.id("categories")),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    roiPotential: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("very_high")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let currentUser = null;
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
    }

    const limit = clampPageSize(args.limit);

    let q = ctx.db
      .query("ideas")
      .withSearchIndex("search_ideas", (q) => {
        let search = q.search("title", args.query);
        if (args.categoryId) search = search.eq("categoryId", args.categoryId);
        if (args.difficulty) search = search.eq("difficulty", args.difficulty);
        if (args.roiPotential)
          search = search.eq("roiPotential", args.roiPotential);
        return search.eq("status", "published");
      });

    const results = await q.take(limit);

    return results.filter((idea) => ideaIsAccessible(idea, currentUser));
  },
});

/**
 * Single idea by slug — enforces visibility, increments view count.
 */
export const getIdeaBySlug = query({
  args: {
    slug: v.string(),
    sessionId: v.string(),
    referrer: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    country: v.optional(v.string()),
    device: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const idea = await ctx.db
      .query("ideas")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (!idea) return null;

    const identity = await ctx.auth.getUserIdentity();
    let currentUser = null;
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
    }

    // Admin sees everything
    if (currentUser?.role !== "admin") {
      if (!ideaIsAccessible(idea, currentUser)) return null;
    }

    // Enrich with category and tags
    const category = await ctx.db.get(idea.categoryId);
    const tagDocs = await Promise.all(idea.tagIds.map((id) => ctx.db.get(id)));

    // Sections (CMS blocks)
    const sections = await ctx.db
      .query("ideaSections")
      .withIndex("by_idea_order", (q) => q.eq("ideaId", idea._id))
      .filter((q) => q.eq(q.field("isVisible"), true))
      .order("asc")
      .collect();

    // Has the current user purchased this?
    let hasPurchased = false;
    if (currentUser) {
      const order = await ctx.db
        .query("orders")
        .withIndex("by_user_idea", (q) =>
          q.eq("userId", currentUser!._id).eq("ideaId", idea._id)
        )
        .filter((q) => q.eq(q.field("status"), "paid"))
        .first();
      hasPurchased = !!order;
    }

    // Has the current user saved this?
    let hasSaved = false;
    if (currentUser) {
      const save = await ctx.db
        .query("saves")
        .withIndex("by_user_idea", (q) =>
          q.eq("userId", currentUser!._id).eq("ideaId", idea._id)
        )
        .unique();
      hasSaved = !!save;
    }

    const coverImageUrl = idea.coverImageId ? await ctx.storage.getUrl(idea.coverImageId) : null;
    const screenshotUrls = await Promise.all(
      (idea.screenshotIds ?? []).map((id) => ctx.storage.getUrl(id))
    );

    return {
      ...idea,
      category,
      tags: tagDocs.filter(Boolean),
      sections,
      hasPurchased,
      hasSaved,
      coverImageUrl,
      screenshotUrls,
    };
  },
});

/** Get a list of featured ideas for the homepage hero. */
export const getFeaturedIdeas = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 6 }) => {
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .filter((q) => q.eq(q.field("status"), "published"))
      .order("desc")
      .take(limit);

    return Promise.all(
      ideas.map(async (idea) => {
        const url = idea.coverImageId ? await ctx.storage.getUrl(idea.coverImageId) : null;
        return {
          ...idea,
          coverImageUrl: url,
        };
      })
    );
  },
});

/** Get ideas related by category (for "You might also like" widgets). */
export const getRelatedIdeas = query({
  args: { ideaId: v.id("ideas"), limit: v.optional(v.number()) },
  handler: async (ctx, { ideaId, limit = 4 }) => {
    const idea = await ctx.db.get(ideaId);
    if (!idea) return [];

    const related = await ctx.db
      .query("ideas")
      .withIndex("by_category", (q) => q.eq("categoryId", idea.categoryId))
      .filter((q) =>
        q.and(
          q.neq(q.field("_id"), ideaId),
          q.eq(q.field("status"), "published")
        )
      )
      .take(limit);

    return Promise.all(
      related.map(async (idea) => ({
        ...idea,
        coverImageUrl: idea.coverImageId ? await ctx.storage.getUrl(idea.coverImageId) : null,
      }))
    );
  },
});

/** Admin: get a single idea by ID regardless of status. */
export const adminGetIdea = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }) => {
    await requireAdmin(ctx);
    const idea = await ctx.db.get(ideaId);
    if (!idea) return null;

    const sections = await ctx.db
      .query("ideaSections")
      .withIndex("by_idea_order", (q) => q.eq("ideaId", ideaId))
      .order("asc")
      .collect();

    const coverImageUrl = idea.coverImageId ? await ctx.storage.getUrl(idea.coverImageId) : null;
    const screenshotUrls = await Promise.all(
      (idea.screenshotIds ?? []).map((id) => ctx.storage.getUrl(id))
    );
    return { ...idea, sections, coverImageUrl, screenshotUrls };
  },
});

/** Admin: paginated list of all ideas across all statuses. */
export const adminListIdeas = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("review"),
        v.literal("published"),
        v.literal("archived"),
        v.literal("sold_out")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.status) {
      return ctx.db
        .query("ideas")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return ctx.db.query("ideas").order("desc").paginate(args.paginationOpts);
  },
});

// Admin CRUD mutations
export const createIdea = mutation({
  args: {
    title: v.string(),
    categoryId: v.id("categories"),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    roiPotential: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("very_high")
    ),
    // Fields that should be optional for a draft
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    tagIds: v.optional(v.array(v.id("tags"))),
    targetAudience: v.optional(v.string()),
    problemStatement: v.optional(v.string()),
    solutionOverview: v.optional(v.string()),
    uniqueValueProp: v.optional(v.string()),
    revenueModel: v.optional(v.string()),
    revenueStreams: v.optional(v.array(v.string())),
    competitors: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.optional(v.string()),
          weakness: v.string(),
        })
      )
    ),
    techStack: v.optional(
      v.array(
        v.object({
          name: v.string(),
          role: v.string(),
          url: v.optional(v.string()),
        })
      )
    ),
    // Optional fields
    marketSize: v.optional(v.string()),
    goToMarket: v.optional(v.string()),
    growthStrategy: v.optional(v.string()),
    timeToLaunch: v.optional(v.string()),
    demoUrl: v.optional(v.string()),
    demoUsername: v.optional(v.string()),
    demoPassword: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    screenshotIds: v.optional(v.array(v.id("_storage"))),
    coverImageId: v.optional(v.id("_storage")),
    priceCodeBase: v.optional(v.number()),
    priceCustomization: v.optional(v.number()),
    polarProductId: v.optional(v.string()),
    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("members_only"),
        v.literal("paid_only")
      )
    ),
    isFeatured: v.optional(v.boolean()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    ogImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    const slug = slugify(args.title);

    const existing = await ctx.db
      .query("ideas")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existing) throw new Error("CONFLICT: Idea slug already exists.");

    const ideaId = await ctx.db.insert("ideas", {
      title: args.title,
      slug,
      tagline: args.tagline ?? "",
      description: args.description ?? "",
      categoryId: args.categoryId,
      tagIds: args.tagIds ?? [],
      targetAudience: args.targetAudience ?? "",
      problemStatement: args.problemStatement ?? "",
      solutionOverview: args.solutionOverview ?? "",
      uniqueValueProp: args.uniqueValueProp ?? "",
      revenueModel: args.revenueModel ?? "",
      revenueStreams: args.revenueStreams ?? [],
      competitors: args.competitors ?? [],
      techStack: args.techStack ?? [],
      difficulty: args.difficulty,
      roiPotential: args.roiPotential,
      marketSize: args.marketSize,
      goToMarket: args.goToMarket,
      growthStrategy: args.growthStrategy,
      timeToLaunch: args.timeToLaunch,
      demoUrl: args.demoUrl,
      demoUsername: args.demoUsername,
      demoPassword: args.demoPassword,
      videoUrl: args.videoUrl,
      screenshotIds: args.screenshotIds ?? [],
      coverImageId: args.coverImageId,
      priceCodeBase: args.priceCodeBase,
      priceCustomization: args.priceCustomization,
      polarProductId: args.polarProductId,
      visibility: args.visibility ?? "public",
      status: "draft",
      isFeatured: args.isFeatured ?? false,
      isNew: true,
      viewCount: 0,
      saveCount: 0,
      purchaseCount: 0,
      demoClickCount: 0,
      reviewCount: 0,
      metaTitle: args.metaTitle,
      metaDescription: args.metaDescription,
      ogImageId: args.ogImageId,
      authorId: actor._id,
      createdAt: now(),
      updatedAt: now(),
    });

    // Sync ideaTags join table
    await Promise.all(
      (args.tagIds ?? []).map((tagId) =>
        ctx.db.insert("ideaTags", { ideaId, tagId })
      )
    );

    // Increment tag usage counts
    await Promise.all(
      (args.tagIds ?? []).map(async (tagId) => {
        const tag = await ctx.db.get(tagId);
        if (tag) await ctx.db.patch(tagId, { usageCount: tag.usageCount + 1 });
      })
    );

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "idea.create",
      targetType: "idea",
      targetId: ideaId,
    });

    return ideaId;
  },
});

export const updateIdea = mutation({
  args: {
    ideaId: v.id("ideas"),
    title: v.optional(v.string()),
    tagline: v.optional(v.string()),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    tagIds: v.optional(v.array(v.id("tags"))),
    targetAudience: v.optional(v.string()),
    problemStatement: v.optional(v.string()),
    solutionOverview: v.optional(v.string()),
    uniqueValueProp: v.optional(v.string()),
    revenueModel: v.optional(v.string()),
    revenueStreams: v.optional(v.array(v.string())),
    competitors: v.optional(
      v.array(
        v.object({
          name: v.string(),
          url: v.optional(v.string()),
          weakness: v.string(),
        })
      )
    ),
    techStack: v.optional(
      v.array(
        v.object({
          name: v.string(),
          role: v.string(),
          url: v.optional(v.string()),
        })
      )
    ),
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    roiPotential: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("very_high")
      )
    ),
    marketSize: v.optional(v.string()),
    goToMarket: v.optional(v.string()),
    growthStrategy: v.optional(v.string()),
    timeToLaunch: v.optional(v.string()),
    demoUrl: v.optional(v.string()),
    demoUsername: v.optional(v.string()),
    demoPassword: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    screenshotIds: v.optional(v.array(v.id("_storage"))),
    coverImageId: v.optional(v.id("_storage")),
    priceCodeBase: v.optional(v.number()),
    priceCustomization: v.optional(v.number()),
    polarProductId: v.optional(v.string()),
    visibility: v.optional(
      v.union(
        v.literal("public"),
        v.literal("members_only"),
        v.literal("paid_only")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("review"),
        v.literal("published"),
        v.literal("archived"),
        v.literal("sold_out")
      )
    ),
    isFeatured: v.optional(v.boolean()),
    isNew: v.optional(v.boolean()),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    ogImageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    const { ideaId, tagIds, title, ...rest } = args;

    const idea = await ctx.db.get(ideaId);
    if (!idea) throw new Error("NOT_FOUND: Idea does not exist.");

    const patch: Record<string, unknown> = { ...rest, updatedAt: now() };
    if (title) {
      patch.title = title;
      patch.slug = slugify(title);
    }
    if (tagIds) patch.tagIds = tagIds;

    await ctx.db.patch(ideaId, patch);

    // Re-sync ideaTags if tagIds changed
    if (tagIds) {
      const existing = await ctx.db
        .query("ideaTags")
        .withIndex("by_idea", (q) => q.eq("ideaId", ideaId))
        .collect();
      await Promise.all(existing.map((j) => ctx.db.delete(j._id)));
      await Promise.all(
        tagIds.map((tagId) => ctx.db.insert("ideaTags", { ideaId, tagId }))
      );
    }

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "idea.update",
      targetType: "idea",
      targetId: ideaId,
      metadata: { updatedFields: Object.keys(args) },
    });
  },
});

export const publishIdea = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }) => {
    const actor = await requireAdmin(ctx);

    await ctx.db.patch(ideaId, {
      status: "published",
      publishedAt: now(),
      updatedAt: now(),
    });

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "idea.publish",
      targetType: "idea",
      targetId: ideaId,
    });
  },
});

export const archiveIdea = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }) => {
    const actor = await requireAdmin(ctx);

    await ctx.db.patch(ideaId, { status: "archived", updatedAt: now() });

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "idea.archive",
      targetType: "idea",
      targetId: ideaId,
    });
  },
});

export const markIdeaSoldOut = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }) => {
    const actor = await requireAdmin(ctx);
    await ctx.db.patch(ideaId, { status: "sold_out", updatedAt: now() });
    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "idea.sold_out",
      targetType: "idea",
      targetId: ideaId,
    });
  },
});

/** Set the cover image for an idea (admin). */
export const setCoverImage = mutation({
  args: { ideaId: v.id("ideas"), storageId: v.id("_storage") },
  handler: async (ctx, { ideaId, storageId }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(ideaId, { coverImageId: storageId, updatedAt: now() });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS — idea sections (CMS)
// ─────────────────────────────────────────────────────────────────────────────

export const upsertIdeaSection = mutation({
  args: {
    ideaId: v.id("ideas"),
    sectionId: v.optional(v.id("ideaSections")),
    type: v.union(
      v.literal("markdown"),
      v.literal("feature_list"),
      v.literal("screenshot_gallery"),
      v.literal("metrics_grid"),
      v.literal("competitor_table"),
      v.literal("revenue_breakdown"),
      v.literal("faq"),
      v.literal("testimonial"),
      v.literal("cta_block"),
      v.literal("video_embed"),
      v.literal("tech_stack_grid"),
      v.literal("roadmap"),
      v.literal("checklist")
    ),
    title: v.optional(v.string()),
    content: v.string(),
    sortOrder: v.number(),
    isVisible: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { sectionId, ideaId, ...rest } = args;
    const ts = now();

    if (sectionId) {
      await ctx.db.patch(sectionId, { ...rest, updatedAt: ts });
      return sectionId;
    }

    return ctx.db.insert("ideaSections", {
      ideaId,
      ...rest,
      createdAt: ts,
      updatedAt: ts,
    });
  },
});

export const deleteIdeaSection = mutation({
  args: { sectionId: v.id("ideaSections") },
  handler: async (ctx, { sectionId }) => {
    await requireAdmin(ctx);
    await ctx.db.delete(sectionId);
  },
});

export const reorderIdeaSections = mutation({
  args: {
    updates: v.array(
      v.object({ sectionId: v.id("ideaSections"), sortOrder: v.number() })
    ),
  },
  handler: async (ctx, { updates }) => {
    await requireAdmin(ctx);
    await Promise.all(
      updates.map(({ sectionId, sortOrder }) =>
        ctx.db.patch(sectionId, { sortOrder, updatedAt: now() })
      )
    );
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS — view tracking (internal so it can be called from server action)
// ─────────────────────────────────────────────────────────────────────────────

export const recordIdeaView = mutation({
  args: {
    ideaId: v.id("ideas"),
    sessionId: v.string(),
    referrer: v.optional(v.string()),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    country: v.optional(v.string()),
    device: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Deduplicate: one view per session per idea in the last 30 mins
    const existing = await ctx.db
      .query("ideaViews")
      .withIndex("by_idea_created", (q) =>
        q.eq("ideaId", args.ideaId).gte("createdAt", Date.now() - 30 * 60_000)
      )
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();

    if (existing) return;

    const identity = await ctx.auth.getUserIdentity();
    let userId: Id<"users"> | undefined;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (user) userId = user._id;
    }

    await ctx.db.insert("ideaViews", {
      ...args,
      userId,
      createdAt: now(),
    });

    // Increment denormalized counter
    const idea = await ctx.db.get(args.ideaId);
    if (idea) {
      await ctx.db.patch(args.ideaId, { viewCount: idea.viewCount + 1 });
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS — save / unsave
// ─────────────────────────────────────────────────────────────────────────────

export const saveIdea = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("saves")
      .withIndex("by_user_idea", (q) =>
        q.eq("userId", user._id).eq("ideaId", ideaId)
      )
      .unique();

    if (existing) return; // idempotent

    await ctx.db.insert("saves", {
      userId: user._id,
      ideaId,
      createdAt: now(),
    });

    // Update denormalized counts
    const idea = await ctx.db.get(ideaId);
    if (idea) await ctx.db.patch(ideaId, { saveCount: idea.saveCount + 1 });

    await ctx.db.patch(user._id, {
      savedIdeas: [...user.savedIdeas, ideaId],
      updatedAt: now(),
    });
  },
});

export const unsaveIdea = mutation({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }) => {
    const user = await requireUser(ctx);

    const existing = await ctx.db
      .query("saves")
      .withIndex("by_user_idea", (q) =>
        q.eq("userId", user._id).eq("ideaId", ideaId)
      )
      .unique();

    if (!existing) return;

    await ctx.db.delete(existing._id);

    const idea = await ctx.db.get(ideaId);
    if (idea) {
      await ctx.db.patch(ideaId, {
        saveCount: Math.max(0, idea.saveCount - 1),
      });
    }

    await ctx.db.patch(user._id, {
      savedIdeas: user.savedIdeas.filter((id) => id !== ideaId),
      updatedAt: now(),
    });
  },
});


export const getSavedIdeas = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, { paginationOpts }) => {
    const user = await requireUser(ctx);

    const page = await ctx.db
      .query("saves")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(paginationOpts);

    const ideas = await Promise.all(
      page.page.map((save) => ctx.db.get(save.ideaId))
    );

    return { ...page, page: ideas.filter(Boolean) };
  },
});

export const recordDemoClick = mutation({
  args: {
    ideaId: v.id("ideas"),
  },
  handler: async (ctx, { ideaId }) => {
    const idea = await ctx.db.get(ideaId);
    if (!idea) throw new Error("Idea not found");
    
    await ctx.db.patch(ideaId, {
      demoClickCount: (idea.demoClickCount ?? 0) + 1,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES — analytics
// ─────────────────────────────────────────────────────────────────────────────

export const getIdeaAnalytics = query({
  args: {
    ideaId: v.id("ideas"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, { ideaId, days = 30 }) => {
    await requireAdmin(ctx);

    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const views = await ctx.db
      .query("ideaViews")
      .withIndex("by_idea_created", (q) =>
        q.eq("ideaId", ideaId).gte("createdAt", since)
      )
      .collect();

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_idea", (q) => q.eq("ideaId", ideaId))
      .filter((q) => q.eq(q.field("status"), "paid"))
      .collect();

    // Aggregate views by day
    const viewsByDay: Record<string, number> = {};
    for (const v of views) {
      const day = new Date(v.createdAt).toISOString().split("T")[0];
      viewsByDay[day] = (viewsByDay[day] ?? 0) + 1;
    }

    const revenueByType: Record<string, number> = {};
    for (const o of orders) {
      revenueByType[o.type] = (revenueByType[o.type] ?? 0) + o.amountTotal;
    }

    return {
      totalViews: views.length,
      uniqueSessionViews: new Set(views.map((v) => v.sessionId)).size,
      viewsByDay,
      totalOrders: orders.length,
      totalRevenueCents: orders.reduce((s, o) => s + o.amountTotal, 0),
      revenueByType,
      deviceBreakdown: views.reduce(
        (acc, v) => {
          if (v.device) acc[v.device] = (acc[v.device] ?? 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  },
});