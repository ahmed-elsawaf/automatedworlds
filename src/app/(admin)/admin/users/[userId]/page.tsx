"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Mail, Shield, Building2, Globe, Clock, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import type { Id } from "../../../../../../convex/_generated/dataModel";

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: Id<"users"> }>();
  const router = useRouter();

  // We reuse listUsers for simplicity in this example or we'd ideally have getUserById in admin.ts
  const users = useQuery(api.admin.listUsers, {
    paginationOpts: { numItems: 100, cursor: null },
  });

  if (users === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Button variant="ghost" className="gap-2 -ml-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Button>
        <div className="h-64 rounded-2xl bg-muted animate-pulse border border-border/60" />
      </div>
    );
  }

  const user = users.page.find(u => u._id === userId);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold mb-2">User not found</h1>
        <Button asChild className="rounded-xl"><Link href="/admin/users">Go Back</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="gap-2 -ml-3 mb-4 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                {user.name || "Unknown User"}
                {user.role === "admin" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-violet-500/10 text-violet-500">
                    <Shield className="w-3 h-3" /> Admin
                  </span>
                )}
              </h1>
              <a href={`mailto:${user.email}`} className="text-sm text-primary hover:underline flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-muted/20">
              <h2 className="font-semibold text-sm">Profile Data</h2>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Company / Organization</p>
                <p className="font-medium">{user.company || <span className="italic text-muted-foreground">Not provided</span>}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Website</p>
                {user.website ? (
                  <a href={user.website.startsWith("http") ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {user.website}
                  </a>
                ) : (
                  <span className="italic text-muted-foreground">Not provided</span>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Bio</p>
                <p className="leading-relaxed whitespace-pre-wrap">{user.bio || <span className="italic text-muted-foreground">Not provided</span>}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-muted/20">
              <h2 className="font-semibold text-sm">System Metadata</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Clerk ID</p>
                <p className="font-mono text-xs">{user.clerkId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Joined Date</p>
                <p>{format(user.createdAt, "MMM d, yyyy")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Onboarding Status</p>
                <p>{user.onboardingComplete ? "Completed" : "Pending"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-muted/20">
              <h2 className="font-semibold text-sm flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Purchasing Activity</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                  <p className="text-xs text-muted-foreground mb-1">Total Purchases</p>
                  <p className="text-3xl font-bold">{user.totalPurchases || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border/60">
                  <p className="text-xs text-muted-foreground mb-1">Lifetime Spend</p>
                  <p className="text-3xl font-bold text-emerald-500">{fmt(user.totalSpent || 0)}</p>
                </div>
              </div>
              
              <Button asChild variant="outline" className="w-full rounded-xl gap-2">
                <Link href={`/admin/orders?userId=${user._id}`}>
                  View Orders for this User <ArrowLeft className="w-4 h-4 rotate-180" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-6">
            <h3 className="font-semibold text-sm mb-2">Saved Ideas</h3>
            <p className="text-2xl font-bold mb-4">{user.savedIdeas?.length || 0}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This metric indicates user engagement. Users with high save counts but zero purchases might benefit from discount codes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
