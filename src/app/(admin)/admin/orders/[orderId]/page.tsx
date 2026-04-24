"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Mail, User, Box, CreditCard, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Id } from "../../../../../../convex/_generated/dataModel";

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

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: Id<"orders"> }>();
  const router = useRouter();

  const order = useQuery(api.orders.getOrder, { orderId });

  if (order === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Button variant="ghost" className="gap-2 -ml-4" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Button>
        <div className="h-64 rounded-2xl bg-muted animate-pulse border border-border/60" />
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold mb-2">Order not found</h1>
        <p className="text-muted-foreground mb-6">This order does not exist.</p>
        <Button asChild className="rounded-xl"><Link href="/admin/orders">Go Back</Link></Button>
      </div>
    );
  }

  const idea = order.idea as any;
  const user = order.user as any;
  const s = STATUS_MAP[order.status] ?? { label: order.status, className: "bg-slate-500/15 text-slate-400 border-slate-500/20" };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="gap-2 -ml-3 mb-4 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Order Details</h1>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-muted-foreground">{order._id}</span>
              <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border", s.className)}>
                {s.label}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-xl gap-2 text-xs h-9">
              <a href="https://polar.sh" target="_blank" rel="noopener noreferrer">
                View in Polar <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-muted/20">
              <h2 className="font-semibold text-sm flex items-center gap-2"><Box className="w-4 h-4" /> Product Details</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{idea?.title ?? "Unknown"}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Type: <span className="capitalize">{order.type.replace(/_/g, " ")}</span></p>
                  <Button asChild variant="secondary" size="sm" className="rounded-lg">
                    <Link href={`/admin/ideas/${idea?._id}`}>Edit Idea</Link>
                  </Button>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold block">{fmt(order.amountTotal)}</span>
                  <span className="text-xs text-muted-foreground">Paid on {format(order._creationTime, "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2"><CreditCard className="w-4 h-4" /> Transaction Data</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Subtotal</p>
                  <p className="font-medium">{fmt(order.amountSubtotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Discount</p>
                  <p className="font-medium text-emerald-500">-{fmt(order.amountDiscount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tax</p>
                  <p className="font-medium">{fmt(order.amountTax)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total</p>
                  <p className="font-bold">{fmt(order.amountTotal)}</p>
                </div>
                {order.polarCheckoutId && (
                  <div className="col-span-2 pt-4 mt-2 border-t border-border/60">
                    <p className="text-xs text-muted-foreground mb-1">Polar Checkout ID</p>
                    <p className="font-mono text-xs">{order.polarCheckoutId}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-muted/20">
              <h2 className="font-semibold text-sm flex items-center gap-2"><User className="w-4 h-4" /> Customer</h2>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{user?.name || "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <a href={`mailto:${user?.email}`} className="font-medium text-primary hover:underline flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {user?.email || "Unknown"}
                </a>
              </div>
              <div className="pt-4 border-t border-border/60">
                <Button asChild variant="outline" className="w-full rounded-xl">
                  <Link href={`/admin/users/${user?._id}`}>View Profile</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-500 mb-1">Fulfillment Active</p>
                <p className="text-xs text-emerald-500/80 leading-relaxed">
                  {order.type === "customization" 
                    ? "This order initiated a customization request. Admins must process the request manually." 
                    : "The customer has been granted access to download the source code."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
