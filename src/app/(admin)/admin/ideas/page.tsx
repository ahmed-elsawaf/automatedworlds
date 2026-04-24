"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Lightbulb, ArrowRight, Eye, ShoppingBag, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { format } from "date-fns";
import { api } from "../../../../../convex/_generated/api";

export default function AdminIdeasPage() {
  const [search, setSearch] = useState("");
  const stats = useQuery(api.admin.getDashboardStats);
  const ideas = useQuery(api.ideas.adminListIdeas, {
    paginationOpts: { numItems: 50, cursor: null },
  });

  if (ideas === undefined || stats === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Ideas</h1>
          <Button disabled className="gap-2"><Plus className="w-4 h-4" /> New Idea</Button>
        </div>
        <div className="h-96 rounded-2xl bg-muted animate-pulse border border-border/60" />
      </div>
    );
  }

  const filtered = ideas.page.filter((i: any) => 
    i.title.toLowerCase().includes(search.toLowerCase()) || 
    i.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">Manage Ideas</h1>
          <p className="text-muted-foreground text-sm">
            {stats.ideas.total} total • {stats.ideas.published} published • {stats.ideas.drafts} drafts
          </p>
        </div>
        <Button asChild className="gap-2 rounded-xl">
          <Link href="/admin/ideas/new">
            <Plus className="w-4 h-4" /> Create Idea
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search ideas..." 
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
                <th className="px-6 py-4 font-semibold">Idea</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold text-right">Stats</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Lightbulb className="w-8 h-8 mx-auto mb-3 opacity-20" />
                    No ideas found matching "{search}"
                  </td>
                </tr>
              ) : (
                filtered.map((idea: any) => {
                  const cat = (idea as any).category;
                  return (
                    <tr key={idea._id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <Link href={`/admin/ideas/${idea._id}`} className="font-semibold text-foreground hover:text-primary transition-colors mb-0.5">
                            {idea.title}
                          </Link>
                          <span className="text-xs text-muted-foreground font-mono">{idea.slug}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border",
                          idea.isPublished 
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {idea.isPublished ? "Published" : "Draft"}
                        </span>
                        {idea.isFeatured && (
                          <span className="ml-2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full border bg-violet-500/10 text-violet-400 border-violet-500/20">
                            Featured
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cat ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-xs">
                            {cat.icon} {cat.name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">None</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-4 text-muted-foreground">
                          <span className="flex items-center gap-1.5" title="Views">
                            <Eye className="w-3.5 h-3.5" /> {idea.viewCount}
                          </span>
                          <span className="flex items-center gap-1.5" title="Purchases">
                            <ShoppingBag className="w-3.5 h-3.5" /> {idea.purchaseCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {idea.isPublished && (
                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="View live">
                              <Link href={`/ideas/${idea.slug}`} target="_blank"><ExternalLink className="w-4 h-4" /></Link>
                            </Button>
                          )}
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Edit details">
                            <Link href={`/admin/ideas/${idea._id}`}><BarChart2 className="w-4 h-4" /></Link>
                          </Button>
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Edit CMS sections">
                            <Link href={`/admin/ideas/${idea._id}/sections`}><ArrowRight className="w-4 h-4" /></Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Simple pagination state indicator */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
          Showing {filtered.length} idea{filtered.length !== 1 ? 's' : ''}
          {ideas.isDone === false && (
            <Button variant="outline" size="sm" className="h-7 text-xs">Load More</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Local duplicate for ExternalLink to avoid import bloat if missing
function ExternalLink(props: any) {
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
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  );
}
