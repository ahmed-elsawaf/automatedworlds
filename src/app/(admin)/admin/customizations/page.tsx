"use client";

import { useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Wrench, 
  Clock, 
  MessageSquare, 
  ArrowRight, 
  Search, 
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Rocket,
  User,
  Lightbulb,
  MoreVertical,
  ChevronRight,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
  submitted:    { label: "Submitted",   className: "bg-blue-500/15   text-blue-400 border-blue-500/20",   icon: Clock3 },
  reviewing:    { label: "Reviewing",   className: "bg-violet-500/15 text-violet-400 border-violet-500/20", icon: Search },
  quoted:       { label: "Quoted",      className: "bg-amber-500/15  text-amber-500 border-amber-500/20",  icon: AlertCircle },
  accepted:     { label: "Accepted",    className: "bg-cyan-500/15   text-cyan-400 border-cyan-500/20",   icon: CheckCircle2 },
  in_progress:  { label: "In Progress", className: "bg-primary/15    text-primary border-primary/20",    icon: Wrench },
  review_ready: { label: "Review Ready",className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20", icon: Rocket },
  completed:    { label: "Completed",   className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
  cancelled:    { label: "Cancelled",   className: "bg-slate-500/15  text-slate-400 border-slate-500/20",  icon: AlertCircle },
};

export default function AdminCustomizationsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  const { isAuthenticated } = useConvexAuth();
  const requests = useQuery(api.customizations.adminListCustomizationRequests, isAuthenticated ? {
    paginationOpts: { numItems: 50, cursor: null },
    status: statusFilter as any
  } : "skip");

  const updateStatus = useMutation(api.customizations.adminUpdateCustomizationStatus);

  async function handleStatusChange(requestId: any, newStatus: string) {
    try {
      await updateStatus({ requestId, status: newStatus });
    } catch (err) {
      console.error(err);
    }
  }

  if (requests === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredRequests = requests.page.filter(r => 
    r.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.idea?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.brandName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customizations</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage client build requests and customization projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl gap-2 shadow-sm">
            <Filter className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "New Requests", value: requests.page.filter(r => r.status === "submitted").length, color: "text-blue-500" },
          { label: "In Progress", value: requests.page.filter(r => r.status === "in_progress").length, color: "text-primary" },
          { label: "Quoted", value: requests.page.filter(r => r.status === "quoted").length, color: "text-amber-500" },
          { label: "Completed", value: requests.page.filter(r => r.status === "completed").length, color: "text-emerald-500" },
        ].map(s => (
          <Card key={s.label} className="p-4 rounded-2xl border-border/60 bg-card/50 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-card/50 p-3 rounded-2xl border border-border/60">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by client email, idea, or brand name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-transparent border-none focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select 
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="h-10 px-3 rounded-xl bg-background border border-border/60 text-sm focus:ring-1 ring-primary/20 outline-none"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-card/30 rounded-4xl border border-dashed border-border/60">
            <Wrench className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No requests found</h3>
            <p className="text-muted-foreground text-sm">Adjust your filters or search query.</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const config = STATUS_CONFIG[req.status] || STATUS_CONFIG.submitted;
            return (
              <Card 
                key={req._id}
                className="group p-5 rounded-3xl border-border/60 bg-card hover:border-primary/30 transition-all duration-300 shadow-sm"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Status Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border transition-colors",
                    config.className
                  )}>
                    <config.icon className="w-6 h-6" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", config.className)}>
                        {config.label}
                      </span>
                      {req.unreadCount > 0 && (
                        <span className="bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> {req.unreadCount} New
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {format(req.createdAt, "MMM d, yyyy")}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors mb-1">
                      {req.brandName || "Untitled Build"} — {req.idea?.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> {req.user?.name || req.user?.email}
                      </span>
                      {req.quotedPrice && (
                        <span className="flex items-center gap-1.5 text-foreground font-bold">
                          ${(req.quotedPrice / 100).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-48">
                        <DropdownMenuItem onClick={() => handleStatusChange(req._id, "reviewing")}>
                          Mark Reviewing
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(req._id, "in_progress")}>
                          Mark In Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(req._id, "completed")} className="text-emerald-500">
                          Mark Completed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button asChild className="rounded-xl gap-2 font-bold group/btn pr-4">
                      <Link href={`/admin/customizations/${req._id}`}>
                        View Details <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
