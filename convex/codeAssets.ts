/**
 * AutomatedWorlds — Code Assets Procedures
 *
 * Covers:
 *  • Admin upload (generate upload URL, confirm upload)
 *  • Version history
 *  • Deprecate / delete old versions
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, now, writeAuditLog, sendNotification } from "./helpers";

// ─────────────────────────────────────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Step 1: Generate a short-lived upload URL for Convex file storage.
 * The client uploads directly; step 2 commits the metadata.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

/**
 * Step 2: Record the uploaded file as a new code asset version.
 * Automatically promotes to "latest" and demotes any previous latest.
 */
export const commitCodeAsset = mutation({
  args: {
    ideaId: v.id("ideas"),
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    version: v.string(),
    changelog: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requireAdmin(ctx);

    // Demote previous latest
    const previousLatest = await ctx.db
      .query("codeAssets")
      .withIndex("by_idea_latest", (q) =>
        q.eq("ideaId", args.ideaId).eq("isLatest", true)
      )
      .unique();

    if (previousLatest) {
      await ctx.db.patch(previousLatest._id, { isLatest: false });
    }

    const assetId = await ctx.db.insert("codeAssets", {
      ideaId: args.ideaId,
      fileId: args.fileId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      mimeType: args.mimeType,
      version: args.version,
      changelog: args.changelog,
      isLatest: true,
      uploadedBy: actor._id,
      createdAt: now(),
    });

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "codeAsset.commit",
      targetType: "codeAsset",
      targetId: assetId,
      metadata: { ideaId: args.ideaId, version: args.version },
    });

    // Notify buyers of the idea about the new version
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .filter((q) => q.eq(q.field("status"), "paid"))
      .collect();

    const notified = new Set<string>();
    for (const order of orders) {
      const key = order.userId.toString();
      if (notified.has(key)) continue;
      notified.add(key);

      const idea = await ctx.db.get(args.ideaId);
      await sendNotification(ctx, {
        userId: order.userId,
        type: "code_ready",
        title: "Code Update Available",
        body: `A new version (${args.version}) of "${idea?.title}" is ready to download.`,
        actionUrl: `/dashboard/orders/${order._id}`,
        relatedId: order._id,
      });
    }

    return assetId;
  },
});

/** Roll back latest to a specific older asset version. */
export const promoteCodeAssetVersion = mutation({
  args: { assetId: v.id("codeAssets") },
  handler: async (ctx, { assetId }) => {
    const actor = await requireAdmin(ctx);
    const asset = await ctx.db.get(assetId);
    if (!asset) throw new Error("NOT_FOUND");

    // Demote current latest
    const currentLatest = await ctx.db
      .query("codeAssets")
      .withIndex("by_idea_latest", (q) =>
        q.eq("ideaId", asset.ideaId).eq("isLatest", true)
      )
      .unique();

    if (currentLatest && currentLatest._id !== assetId) {
      await ctx.db.patch(currentLatest._id, { isLatest: false });
    }

    await ctx.db.patch(assetId, { isLatest: true });

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "codeAsset.promote",
      targetType: "codeAsset",
      targetId: assetId,
      metadata: { version: asset.version },
    });
  },
});

/** Permanently delete a code asset file (admin only). */
export const deleteCodeAsset = mutation({
  args: { assetId: v.id("codeAssets") },
  handler: async (ctx, { assetId }) => {
    const actor = await requireAdmin(ctx);
    const asset = await ctx.db.get(assetId);
    if (!asset) throw new Error("NOT_FOUND");
    if (asset.isLatest) throw new Error("CONFLICT: Cannot delete the latest version. Promote another first.");

    await ctx.storage.delete(asset.fileId);
    await ctx.db.delete(assetId);

    await writeAuditLog(ctx, {
      actorId: actor._id,
      action: "codeAsset.delete",
      targetType: "codeAsset",
      targetId: assetId,
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/** All versions for an idea (admin view). */
export const listCodeAssets = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("codeAssets")
      .withIndex("by_idea", (q) => q.eq("ideaId", ideaId))
      .order("desc")
      .collect();
  },
});

/** Get the latest code asset for an idea (used by download flow). */
export const getLatestCodeAsset = query({
  args: { ideaId: v.id("ideas") },
  handler: async (ctx, { ideaId }) => {
    await requireAdmin(ctx);
    return ctx.db
      .query("codeAssets")
      .withIndex("by_idea_latest", (q) =>
        q.eq("ideaId", ideaId).eq("isLatest", true)
      )
      .unique();
  },
});