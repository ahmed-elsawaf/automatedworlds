"use client";

import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag, Wrench, Bookmark, ArrowRight,
  CheckCircle2, Clock, Package, Zap, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "../../../../convex/_generated/api";

/* ─── Status colors ──────────────────────────────────────────────────────── */
const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  paid:     { label: "Paid",     className: "bg-emerald-500/15 text-emerald-500" },
  pending:  { label: "Pending",  className: "bg-amber-500/15  text-amber-500"  },
  refunded: { label: "Refunded", className: "bg-rose-500/15   text-rose-500"   },
  disputed: { label: "Disputed", className: "bg-orange-500/15 text-orange-500" },
  failed:   { label: "Failed",   className: "bg-slate-500/15  text-slate-400"  },
};

const CUSTOM_STATUS: Record<string, { label: string; className: string }> = {
  submitted:    { label: "Submitted",   className: "bg-blue-500/15   text-blue-400"   },
  reviewing:    { label: "Reviewing",   className: "bg-violet-500/15 text-violet-400" },
  quoted:       { label: "Quoted",      className: "bg-amber-500/15  text-amber-500"  },
  accepted:     { label: "Accepted",    className: "bg-cyan-500/15   text-cyan-400"   },
  in_progress:  { label: "In Progress", className: "bg-primary/15    text-primary"    },
  review_ready: { label: "Review Ready","className": "bg-emerald-500/15 text-emerald-500" },
  completed:    { label: "Completed",   className: "bg-emerald-500/15 text-emerald-500" },
  cancelled:    { label: "Cancelled",   className: "bg-slate-500/15  text-slate-400"  },
};

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
function StatCard({
  label, value, icon: Icon, sub,
}: {
  label: string; value: string | number; icon: React.ElementType; sub?: string;
}) {
  return (
    <div className="p-5 rounded-2xl border border-border/60 bg-card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-3xl font-extrabold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function DashboardHome() {
  const { user } = useUser();

  const me = useQuery(api.users.getMe);
  const orders = useQuery(api.orders.getMyOrders, {
    paginationOpts: { numItems: 5, cursor: null },
  });
  const customizations = useQuery(api.customizations.getMyCustomizationRequests, {
    paginationOpts: { numItems: 3, cursor: null },
  });
  const featured = useQuery(api.ideas.getFeaturedIdeas, { limit: 3 });

  const firstName = user?.firstName ?? me?.name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">

      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Welcome back, {firstName} 👋</h1>
          <p className="text-muted-foreground text-sm">
            Here&apos;s a snapshot of your activity on AutomatedWorlds.
          </p>
        </div>
        {me?.role === "admin" && (
          <Button asChild variant="outline" className="rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary gap-2">
            <Link href="/admin">
              <Zap className="w-4 h-4" /> Admin Panel
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Purchases"
          value={me?.totalPurchases ?? 0}
          icon={ShoppingBag}
          sub="Ideas bought"
        />
        <StatCard
          label="Total Spent"
          value={me ? fmt(me.totalSpent) : "$0.00"}
          icon={DollarSign}
          sub="Across all orders"
        />
        <StatCard
          label="Saved Ideas"
          value={me?.savedIdeas.length ?? 0}
          icon={Bookmark}
          sub="In your wishlist"
        />
        <StatCard
          label="Custom Builds"
          value={customizations?.page.length ?? 0}
          icon={Wrench}
          sub="Active requests"
        />
      </div>

      {/* Recent Orders */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
            <Link href="/dashboard/orders">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </Button>
        </div>

        {orders === undefined ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : orders.page.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border/60 text-center">
            <Package className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">No orders yet.</p>
            <Button asChild size="sm" className="rounded-xl gap-2">
              <Link href="/browse">Browse Ideas <ArrowRight className="w-3.5 h-3.5" /></Link>
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/60">
            {orders.page.map((order) => {
              const s = ORDER_STATUS[order.status] ?? { label: order.status, className: "" };
              return (
                <Link
                  key={order._id}
                  href={`/dashboard/orders/${order._id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {(order as any).idea?.title ?? "Unknown idea"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                      {order.type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{fmt(order.amountTotal)}</span>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 shrink-0", s.className)}>
                    {s.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Active Customizations */}
      {customizations && customizations.page.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Active Customizations</h2>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
              <Link href="/dashboard/customizations">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </Button>
          </div>
          <div className="space-y-3">
            {customizations.page.map((req) => {
              const s = CUSTOM_STATUS[req.status] ?? { label: req.status, className: "" };
              return (
                <Link
                  key={req._id}
                  href={`/dashboard/customizations/${req._id}`}
                  className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/30 transition-colors"
                >
                  <Wrench className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {(req as any).idea?.title ?? "Custom build"}
                    </p>
                    {req.brandName && (
                      <p className="text-xs text-muted-foreground mt-0.5">{req.brandName}</p>
                    )}
                  </div>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 shrink-0", s.className)}>
                    {s.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recommended Ideas */}
      {featured && featured.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recommended for You</h2>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-primary">
              <Link href="/browse">Browse all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((idea) => (
              <Link
                key={idea._id}
                href={`/ideas/${idea.slug}`}
                className="flex flex-col gap-2 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/30 card-hover"
              >
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="font-medium text-sm leading-snug line-clamp-2">{idea.title}</p>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{idea.tagline}</p>
                <div className="flex items-center justify-between mt-1">
                  {idea.priceCodeBase && (
                    <span className="text-xs font-semibold text-primary">
                      from ${(idea.priceCodeBase / 100).toFixed(0)}
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
