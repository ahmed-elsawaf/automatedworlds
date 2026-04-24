"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wrench, ArrowRight, Clock, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  submitted:    { label: "Submitted",   className: "bg-blue-500/15   text-blue-400 border-blue-500/20"   },
  reviewing:    { label: "Reviewing",   className: "bg-violet-500/15 text-violet-400 border-violet-500/20" },
  quoted:       { label: "Quoted",      className: "bg-amber-500/15  text-amber-500 border-amber-500/20"  },
  accepted:     { label: "Accepted",    className: "bg-cyan-500/15   text-cyan-400 border-cyan-500/20"   },
  in_progress:  { label: "In Progress", className: "bg-primary/15    text-primary border-primary/20"    },
  review_ready: { label: "Review Ready","className": "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" },
  completed:    { label: "Completed",   className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" },
  cancelled:    { label: "Cancelled",   className: "bg-slate-500/15  text-slate-400 border-slate-500/20"  },
};

export default function CustomizationsPage() {
  const requests = useQuery(api.customizations.getMyCustomizationRequests, {
    paginationOpts: { numItems: 20, cursor: null },
  });

  if (requests === undefined) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Customizations</h1>
          <p className="text-muted-foreground text-sm">Loading your requests...</p>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse border border-border/60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Customizations</h1>
        <p className="text-muted-foreground text-sm">
          Track and manage your custom build requests.
        </p>
      </div>

      {requests.page.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border/60 bg-card/50">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No customization requests</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Purchase the "Custom Build" package on any idea to have our team brand and deploy it for you.
          </p>
          <Button asChild className="rounded-xl gap-2">
            <Link href="/browse">
              Browse Ideas <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.page.map((req) => {
            const idea = (req as any).idea;
            const s = STATUS_MAP[req.status] ?? { label: req.status, className: "bg-slate-500/15 text-slate-400 border-slate-500/20" };
            
            return (
              <div 
                key={req._id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl border border-border/60 bg-card hover:border-primary/30 transition-colors"
              >
                {/* Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border", s.className)}>
                      {s.label}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Updated {format(req._creationTime, "MMM d, yyyy")}
                    </span>
                  </div>
                  
                  <Link href={`/dashboard/customizations/${req._id}`} className="block group mt-2">
                    <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                      {idea?.title ?? "Unknown Product"} Customization
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {req.brandName ? `Brand: ${req.brandName}` : "Brand details pending"}
                    </p>
                  </Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button 
                    asChild
                    variant="outline" 
                    className="flex-1 sm:flex-none rounded-xl gap-2"
                  >
                    <Link href={`/dashboard/customizations/${req._id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
