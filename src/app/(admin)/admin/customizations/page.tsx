"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Wrench, ArrowRight, Eye, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

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

export default function AdminCustomizationsPage() {
  const [search, setSearch] = useState("");
  const requests = useQuery(api.admin.listCustomizationRequests, {
    paginationOpts: { numItems: 50, cursor: null },
  });

  if (requests === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Customizations</h1>
        <div className="h-96 rounded-2xl bg-muted animate-pulse border border-border/60" />
      </div>
    );
  }

  // Basic client filtering
  const filtered = requests.page.filter((req) => {
    const s = search.toLowerCase();
    const idea = (req as any).idea;
    const user = (req as any).user;
    return (
      idea?.title?.toLowerCase().includes(s) ||
      user?.name?.toLowerCase().includes(s) ||
      req.brandName?.toLowerCase().includes(s) ||
      req.status.toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Customizations</h1>
          <p className="text-muted-foreground text-sm">
            Manage custom build requests and communicate with clients.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by idea, client, or brand name..." 
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
                <th className="px-6 py-4 font-semibold">Request</th>
                <th className="px-6 py-4 font-semibold">Client</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Updated</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Wrench className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No requests found matching "{search}"
                  </td>
                </tr>
              ) : (
                filtered.map((req) => {
                  const s = STATUS_MAP[req.status] ?? { label: req.status, className: "bg-slate-500/10 text-slate-400" };
                  const idea = (req as any).idea;
                  const user = (req as any).user;
                  return (
                    <tr key={req._id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <Link href={`/admin/customizations/${req._id}`} className="font-semibold text-foreground hover:text-primary transition-colors mb-0.5 truncate max-w-[200px]">
                            {idea?.title ?? "Unknown Product"}
                          </Link>
                          <span className="text-xs text-muted-foreground">Brand: {req.brandName || "Pending"}</span>
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
                        <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border", s.className)}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDistanceToNow(req.updatedAt, { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/admin/customizations/${req._id}`}><ArrowRight className="w-4 h-4" /></Link>
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
          Showing {filtered.length} request{filtered.length !== 1 ? 's' : ''}
          {requests.isDone === false && (
            <Button variant="outline" size="sm" className="h-7 text-xs">Load More</Button>
          )}
        </div>
      </div>
    </div>
  );
}
