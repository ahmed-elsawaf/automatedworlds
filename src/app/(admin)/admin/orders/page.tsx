"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag, ArrowRight, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { api } from "../../../../../convex/_generated/api";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  paid:     { label: "Paid",     className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" },
  pending:  { label: "Pending",  className: "bg-amber-500/15  text-amber-500 border-amber-500/20"  },
  refunded: { label: "Refunded", className: "bg-rose-500/15   text-rose-500 border-rose-500/20"   },
  disputed: { label: "Disputed", className: "bg-orange-500/15 text-orange-500 border-orange-500/20" },
  failed:   { label: "Failed",   className: "bg-slate-500/15  text-slate-400 border-slate-500/20"  },
};

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminOrdersPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [search, setSearch] = useState("");
  const orders = useQuery(api.orders.adminListOrders, isLoaded && isSignedIn ? {
    paginationOpts: { numItems: 50, cursor: null },
  } : "skip");

  if (orders === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="h-96 rounded-2xl bg-muted animate-pulse border border-border/60" />
      </div>
    );
  }

  // Basic client filtering
  const filtered = orders.page.filter((o: any) => {
    const s = search.toLowerCase();
    return o.polarCheckoutId?.toLowerCase().includes(s) || 
           o._id.toLowerCase().includes(s);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Manage Orders</h1>
          <p className="text-muted-foreground text-sm">
            View all transactions and manage refunds via Polar.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by checkout ID or order ID..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl bg-card"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/60 overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID / Date</th>
                <th className="px-6 py-4 font-semibold">Product</th>
                <th className="px-6 py-4 font-semibold">Customer</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((o: any) => {
                  const s = STATUS_MAP[o.status] ?? { label: o.status, className: "bg-slate-500/10 text-slate-400" };
                  const idea = (o as any).idea;
                  const user = (o as any).user;
                  return (
                    <tr key={o._id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <Link href={`/admin/orders/${o._id}`} className="font-semibold text-foreground hover:text-primary transition-colors mb-0.5 font-mono text-xs">
                            {o._id.slice(-8).toUpperCase()}
                          </Link>
                          <span className="text-xs text-muted-foreground">{format(o._creationTime, "MMM d, yyyy h:mm a")}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[200px]">{idea?.title ?? "Unknown"}</span>
                          <span className="text-xs text-muted-foreground capitalize">{o.type.replace(/_/g, " ")}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <Link href={`/admin/users/${user?._id}`} className="font-medium hover:underline truncate max-w-[150px]">
                            {user?.name || "Unknown"}
                          </Link>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">{user?.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">{fmt(o.amountTotal)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border", s.className)}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/orders/${o._id}`}><Eye className="w-4 h-4" /></Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          Showing {filtered.length} order{filtered.length !== 1 ? 's' : ''}
          {orders.isDone === false && (
            <Button variant="outline" size="sm" className="h-7 text-xs">Load More</Button>
          )}
        </div>
      </div>
    </div>
  );
}
