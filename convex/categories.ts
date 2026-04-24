/**
 * AutomatedWorlds — Categories & Tags Procedures
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, now, slugify, writeAuditLog } from "./helpers";

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES — queries
// ─────────────────────────────────────────────────────────────────────────────

export const listCategories = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, { activeOnly = true }) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_sortOrder")
      .order("asc")
      .collect();

    return activeOnly ? categories.filter((c) => c.isActive) : categories;
  },
});

export const getCategoryBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES — mutations (admin)
// ─────────────────────────────────────────────────────────────────────────────

export const createCategory = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    const slug = slugify(args.name);

    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existing) throw new Error("CONFLICT: Category slug already exists.");

    const id = await ctx.db.insert("categories", {
      ...args,
      slug,
      isActive: true,
      createdAt: now(),
    });

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "category.create",
      targetType: "category",
      targetId: id,
    });

    return id;
  },
});

export const updateCategory = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);
    const { categoryId, ...patch } = args;

    const updates: Record<string, unknown> = { ...patch };
    if (patch.name) updates.slug = slugify(patch.name);

    await ctx.db.patch(categoryId, updates);

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "category.update",
      targetType: "category",
      targetId: categoryId,
      metadata: patch,
    });
  },
});

export const deleteCategory = mutation({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, { categoryId }) => {
    const actor = await requireAdmin(ctx);

    // Guard: don't delete if ideas are attached
    const idea = await ctx.db
      .query("ideas")
      .withIndex("by_category", (q) => q.eq("categoryId", categoryId))
      .first();
    if (idea) throw new Error("CONFLICT: Category still has associated ideas.");

    await ctx.db.delete(categoryId);
    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "category.delete",
      targetType: "category",
      targetId: categoryId,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// TAGS — queries
// ─────────────────────────────────────────────────────────────────────────────

export const listTags = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 50 }) => {
    return ctx.db
      .query("tags")
      .withIndex("by_usageCount")
      .order("desc")
      .take(limit);
  },
});

export const getTagBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query("tags")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// TAGS — mutations (admin)
// ─────────────────────────────────────────────────────────────────────────────

export const createTag = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const slug = slugify(args.name);

    const existing = await ctx.db
      .query("tags")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existing) throw new Error("CONFLICT: Tag slug already exists.");

    return ctx.db.insert("tags", {
      name: args.name,
      slug,
      color: args.color,
      usageCount: 0,
      createdAt: now(),
    });
  },
});

export const deleteTag = mutation({
  args: { tagId: v.id("tags") },
  handler: async (ctx, { tagId }) => {
    await requireAdmin(ctx);

    // Remove all ideaTag joins
    const joins = await ctx.db
      .query("ideaTags")
      .withIndex("by_tag", (q) => q.eq("tagId", tagId))
      .collect();
    await Promise.all(joins.map((j) => ctx.db.delete(j._id)));

    await ctx.db.delete(tagId);
  },
});