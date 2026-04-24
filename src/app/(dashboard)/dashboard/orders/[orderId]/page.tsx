"use client";

import { useState } from "react";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Download, Box, ExternalLink, Code2, Paintbrush, Crown, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Id } from "../../../../../../convex/_generated/dataModel";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  paid:     { label: "Paid",     className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" },
  pending:  { label: "Pending",  className: "bg-amber-500/15  text-amber-500 border-amber-500/20"  },
  refunded: { label: "Refunded", className: "bg-rose-500/15   text-rose-500 border-rose-500/20"   },
};

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: Id<"orders"> }>();
  const router = useRouter();

  const order = useQuery(api.orders.getOrderById, { orderId });
  const generateDownloadUrl = useMutation(api.orders.generateDownloadUrl);
  const [downloading, setDownloading] = useState(false);

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
        <p className="text-muted-foreground mb-6">This order doesn't exist or you don't have access.</p>
        <Button asChild className="rounded-xl"><Link href="/dashboard/orders">Go Back</Link></Button>
      </div>
    );
  }

  const idea = order.idea as any;
  const s = STATUS_MAP[order.status] ?? { label: order.status, className: "bg-slate-500/15 text-slate-400 border-slate-500/20" };
  const isPaid = order.status === "paid";
  
  // Icon based on type
  const TypeIcon = order.type === "code_purchase" ? Code2 : order.type === "customization_deposit" ? Paintbrush : Crown;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="gap-2 -ml-3 mb-4 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Order #{order._id.slice(-6).toUpperCase()}</h1>
            <div className="flex items-center gap-3">
              <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border", s.className)}>
                {s.label}
              </span>
              <span className="text-sm text-muted-foreground">
                Placed on {format(order._creationTime, "MMMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Details */}
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-muted/20">
              <h2 className="font-semibold text-sm">Product Summary</h2>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Box className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold mb-1 truncate">{idea?.title ?? "Unknown Product"}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                    {idea?.tagline ?? "No description available"}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/60 bg-muted/30 text-xs font-medium">
                      <TypeIcon className="w-3.5 h-3.5" />
                      {order.type.replace(/_/g, " ")} Package
                    </span>
                    {idea?.category && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/60 bg-muted/30 text-xs font-medium">
                        {idea.category.icon} {idea.category.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fulfillment Section */}
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <h2 className="font-semibold text-sm">Fulfillment</h2>
              {order.downloadCount !== undefined && order.type !== "customization_deposit" && (
                <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
                  {order.downloadCount}/10 downloads used
                </span>
              )}
            </div>
            <div className="p-6">
              {!isPaid ? (
                <div className="flex items-center gap-3 text-amber-500 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                  <Lock className="w-5 h-5 shrink-0" />
                  <p className="text-sm">Payment must be completed before accessing this product.</p>
                </div>
              ) : order.type === "customization_deposit" ? (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    You purchased a custom build package. Our team will manually brand and deploy this idea based on your requirements.
                  </p>
                  <Button asChild className="rounded-xl gap-2 brand-gradient border-0 hover:opacity-90 w-full sm:w-auto">
                    <Link href="/dashboard/customizations">
                      Manage Customization Request <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Your source code is ready to download. You are licensed to use this code for a single project.
                  </p>
                  <Button 
                    onClick={async () => {
                      if (downloading) return;
                      setDownloading(true);
                      try {
                        const { url } = await generateDownloadUrl({ orderId });
                        if (url) window.open(url, "_blank");
                        toast.success("Download started");
                      } catch (err: any) {
                        toast.error(err.message || "Failed to generate download link");
                      } finally {
                        setDownloading(false);
                      }
                    }}
                    className="rounded-xl gap-2 brand-gradient border-0 hover:opacity-90 w-full sm:w-auto"
                    disabled={downloading}
                  >
                    <Download className="w-4 h-4" /> {downloading ? "Generating link..." : "Download Source Code"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
            <div className="p-5 border-b border-border/60 bg-muted/20">
              <h2 className="font-semibold text-sm">Payment Details</h2>
            </div>
            <div className="p-5 space-y-4 text-sm">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal</span>
                <span>{fmt(order.amountTotal - (order.amountTax ?? 0))}</span>
              </div>
              {order.amountTax > 0 && (
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Tax</span>
                  <span>{fmt(order.amountTax)}</span>
                </div>
              )}
              <div className="pt-4 border-t border-border/60 flex justify-between items-center font-bold text-base">
                <span>Total</span>
                <span>{fmt(order.amountTotal)}</span>
              </div>

              {order.polarCheckoutId && (
                <div className="pt-4 mt-2 border-t border-border/60">
                  <Button asChild variant="outline" size="sm" className="w-full rounded-lg gap-2 text-xs">
                    {/* Placeholder for receipt link */}
                    <a href="https://polar.sh" target="_blank" rel="noopener noreferrer">
                      View Receipt <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
