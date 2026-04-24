"use client";

import { useQuery, useMutation } from "convex/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Download, CreditCard, Box, Calendar, Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { api } from "../../../../../convex/_generated/api";

/* ─── Status colors ──────────────────────────────────────────────────────── */
const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  paid:     { label: "Paid",     className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" },
  pending:  { label: "Pending",  className: "bg-amber-500/15  text-amber-500 border-amber-500/20"  },
  refunded: { label: "Refunded", className: "bg-rose-500/15   text-rose-500 border-rose-500/20"   },
  disputed: { label: "Disputed", className: "bg-orange-500/15 text-orange-500 border-orange-500/20" },
  failed:   { label: "Failed",   className: "bg-slate-500/15  text-slate-400 border-slate-500/20"  },
};

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrdersPage() {
  const orders = useQuery(api.orders.getMyOrders, {
    paginationOpts: { numItems: 20, cursor: null },
  });

  if (orders === undefined) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Order History</h1>
          <p className="text-muted-foreground text-sm">Loading your purchases...</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse border border-border/60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Order History</h1>
        <p className="text-muted-foreground text-sm">
          Access your purchased code, customization requests, and receipts.
        </p>
      </div>

      {orders.page.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border/60 bg-card/50">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Box className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No orders found</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            You haven&apos;t purchased any ideas yet. Start browsing to find your next project.
          </p>
          <Button asChild className="rounded-xl gap-2">
            <Link href="/browse">
              Browse Ideas <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.page.map((order) => {
            const idea = (order as any).idea;
            const s = ORDER_STATUS[order.status] ?? { label: order.status, className: "bg-slate-500/15 text-slate-400 border-slate-500/20" };
            
            return (
              <div 
                key={order._id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/30 transition-colors"
              >
                {/* Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border", s.className)}>
                      {s.label}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(order._creationTime, "MMM d, yyyy")}
                    </span>
                  </div>
                  
                  <Link href={`/dashboard/orders/${order._id}`} className="block group">
                    <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                      {idea?.title ?? "Unknown Product"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 capitalize">
                      {order.type.replace(/_/g, " ")} Plan • {fmt(order.amountTotal)}
                    </p>
                  </Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {order.status === "paid" && (
                    <Button 
                      asChild
                      variant="outline" 
                      className="flex-1 sm:flex-none rounded-xl gap-2"
                    >
                      <Link href={`/dashboard/orders/${order._id}`}>
                        View Details
                      </Link>
                    </Button>
                  )}
                  {order.status !== "paid" && (
                    <Button 
                      disabled
                      variant="outline" 
                      className="flex-1 sm:flex-none rounded-xl gap-2 opacity-50"
                    >
                      <Ban className="w-4 h-4" /> Unavailable
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
