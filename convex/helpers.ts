/**
 * AutomatedWorlds — Internal Helpers
 * Shared utilities for all Convex procedures.
 */

import { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Resolve the currently-authenticated user or throw a 401. */
export async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("UNAUTHENTICATED: You must be signed in.");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) throw new Error("USER_NOT_FOUND: User record does not exist.");
  return user;
}

/** Require an admin user or throw 403. */
export async function requireAdmin(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  if (user.role !== "admin") throw new Error("FORBIDDEN: Admin access required.");
  return user;
}

// ─── Pagination helpers ───────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function clampPageSize(size?: number) {
  return Math.min(size ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Time ─────────────────────────────────────────────────────────────────────

export const now = () => Date.now();

// ─── Audit helper ─────────────────────────────────────────────────────────────

export async function writeAuditLog(
  ctx: MutationCtx,
  args: {
    actorId: Id<"users">;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }
) {
  await ctx.db.insert("auditLog", {
    actorId: args.actorId,
    action: args.action,
    targetType: args.targetType,
    targetId: args.targetId,
    metadata: args.metadata ? JSON.stringify(args.metadata) : undefined,
    ipAddress: args.ipAddress,
    createdAt: now(),
  });
}

// ─── Notification helper ──────────────────────────────────────────────────────

export async function sendNotification(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    type: Parameters<typeof ctx.db.insert<"notifications">>[1]["type"];
    title: string;
    body: string;
    actionUrl?: string;
    relatedId?: string;
  }
) {
  await ctx.db.insert("notifications", {
    userId: args.userId,
    type: args.type,
    title: args.title,
    body: args.body,
    actionUrl: args.actionUrl,
    relatedId: args.relatedId,
    isRead: false,
    createdAt: now(),
  });
}

// ─── Discount computation ─────────────────────────────────────────────────────

export function computeDiscount(
  originalCents: number,
  code: { discountType: "percent" | "fixed"; discountValue: number }
): number {
  if (code.discountType === "percent") {
    return Math.round(originalCents * (code.discountValue / 100));
  }
  return Math.min(code.discountValue, originalCents);
}

// ─── Visibility guard ─────────────────────────────────────────────────────────

export function ideaIsAccessible(
  idea: { visibility: string; status: string },
  user?: { plan: string } | null
): boolean {
  if (idea.status !== "published") return false;
  if (idea.visibility === "public") return true;
  if (idea.visibility === "members_only") return !!user;
  if (idea.visibility === "paid_only") {
    return !!user && user.plan !== "free";
  }
  return false;
}