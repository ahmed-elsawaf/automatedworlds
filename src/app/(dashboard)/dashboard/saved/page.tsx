"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IdeaCard } from "@/components/marketing/IdeaCard";
import { Bookmark, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";

export default function SavedIdeasPage() {
  const saves = useQuery(api.ideas.getSavedIdeas, {
    paginationOpts: { numItems: 20, cursor: null },
  });

  const unsaveIdea = useMutation(api.ideas.unsaveIdea);

  if (saves === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Saved Ideas</h1>
          <p className="text-muted-foreground text-sm">Loading your wishlist...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-muted animate-pulse border border-border/60" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Saved Ideas</h1>
          <p className="text-muted-foreground text-sm">
            Ideas you've bookmarked for later.
          </p>
        </div>
      </div>

      {saves.page.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border/60 bg-card/50">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No saved ideas</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            When you see an idea you like, hit the save button to keep it in your wishlist.
          </p>
          <Button asChild className="rounded-xl gap-2">
            <Link href="/browse">
              Browse Ideas <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {saves.page.map((idea) => (
            <div key={idea._id} className="relative group">
              <IdeaCard {...(idea as any)} />
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    await unsaveIdea({ ideaId: idea._id });
                    toast.success("Removed from saved ideas");
                  } catch {
                    toast.error("Failed to remove idea");
                  }
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 z-10"
                title="Remove from saved"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
