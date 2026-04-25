"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wrench, ArrowRight, Clock, Box, MessageSquare, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STATUS_MAP: Record<string, { label: string; className: string; icon: any }> = {
  submitted:    { label: "Brief Submitted", className: "bg-blue-500/15   text-blue-400 border-blue-500/20", icon: Clock },
  reviewing:    { label: "Reviewing",       className: "bg-violet-500/15 text-violet-400 border-violet-500/20", icon: Clock },
  quoted:       { label: "Quote Ready",     className: "bg-amber-500/15  text-amber-500 border-amber-500/20",  icon: MessageSquare },
  accepted:     { label: "Build Commencing",className: "bg-cyan-500/15   text-cyan-400 border-cyan-500/20",   icon: Box },
  in_progress:  { label: "In Progress",     className: "bg-primary/15    text-primary border-primary/20",    icon: Wrench },
  review_ready: { label: "Ready for Review", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20", icon: Sparkles },
  completed:    { label: "Completed",       className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
  cancelled:    { label: "Cancelled",       className: "bg-slate-500/15  text-slate-400 border-slate-500/20",  icon: Clock },
};

export default function CustomizationsPage() {
  const requests = useQuery(api.customizations.getMyCustomizationRequests, {
    paginationOpts: { numItems: 20, cursor: null },
  });

  if (requests === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight italic">Your Custom Builds</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Track and manage your bespoke SaaS projects.
          </p>
        </div>
        <Button asChild className="rounded-xl gap-2 brand-gradient border-0 font-bold px-6">
          <Link href="/custom-build">
            Learn About Custom Builds <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {requests.page.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-4xl border border-dashed border-border/60 bg-card/50 backdrop-blur-sm">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
            <Wrench className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-3 italic">No projects yet.</h3>
          <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">
            Ready to skip the technical setup? Buy the "Custom Build" package on any idea and we'll handle everything.
          </p>
          <Button asChild className="rounded-xl h-12 px-8 font-bold" variant="outline">
            <Link href="/browse">
              Browse Ideas to Customize <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.page.map((req: any) => {
            const idea = req.idea;
            const s = STATUS_MAP[req.status] ?? STATUS_MAP.submitted;
            
            return (
              <Link 
                key={req._id}
                href={`/dashboard/customizations/${req._id}`}
                className="group relative flex flex-col md:flex-row items-center gap-6 p-6 rounded-4xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                {/* Visual Status Indicator */}
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110",
                  s.className
                )}>
                  <s.icon className="w-7 h-7" />
                </div>

                <div className="flex-1 min-w-0 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                    <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border", s.className)}>
                      {s.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Updated {format(req.updatedAt || req._creationTime, "MMM d, yyyy")}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold truncate mb-1">
                    {req.brandName || idea?.title || "Custom Build"}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Based on: <span className="text-foreground font-semibold">{idea?.title || "Unknown Concept"}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:flex flex-col items-end mr-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Project ID</p>
                    <p className="font-mono text-[10px] opacity-40">{req._id.substring(0, 12)}...</p>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-border/60 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
