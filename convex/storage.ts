/**
 * AutomatedWorlds — File Storage Procedures
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser, requireAdmin } from "./helpers";

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD URLs
// ─────────────────────────────────────────────────────────────────────────────

/** Generate an upload URL for idea media (admin only). */
export const generateIdeaMediaUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

/** Generate an upload URL for a user's brand logo (customization flow). */
export const generateBrandLogoUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

/** Generate an upload URL for message attachments (buyer or admin). */
export const generateAttachmentUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return ctx.storage.generateUploadUrl();
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SERVE URLs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a public URL for a storage file.
 */
export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, { fileId }) => {
    return ctx.storage.getUrl(fileId);
  },
});

/**
 * Batch-resolve multiple file IDs to URLs.
 */
export const getFileUrls = query({
  args: { fileIds: v.array(v.id("_storage")) },
  handler: async (ctx, { fileIds }) => {
    return Promise.all(
      fileIds.map(async (id) => ({
        fileId: id,
        url: await ctx.storage.getUrl(id),
      }))
    );
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — delete
// ─────────────────────────────────────────────────────────────────────────────

/** Delete a file from Convex storage (admin). */
export const deleteFile = mutation({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, { fileId }) => {
    await requireAdmin(ctx);
    await ctx.storage.delete(fileId);
  },
});