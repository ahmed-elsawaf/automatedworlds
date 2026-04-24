"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { IdeaCard } from "@/components/marketing/IdeaCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";

/* ─── Filter Types ───────────────────────────────────────────────────────── */
type Difficulty = "beginner" | "intermediate" | "advanced";
type ROI = "low" | "medium" | "high" | "very_high";
type SortBy = "newest" | "popular" | "most_purchased" | "top_rated";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const ROI_OPTIONS: { value: ROI; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "very_high", label: "Very High 🔥" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Viewed" },
  { value: "most_purchased", label: "Best Selling" },
  { value: "top_rated", label: "Top Rated" },
];

/* ─── Filter Pill ────────────────────────────────────────────────────────── */
function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
      )}
    >
      {label}
    </button>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function BrowsePage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();
  const [roi, setRoi] = useState<ROI | undefined>();
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [categoryId, setCategoryId] = useState<Id<"categories"> | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const isSearching = search.trim().length > 1;

  const categories = useQuery(api.categories.listCategories, {});

  const searchResults = useQuery(
    api.ideas.searchIdeas,
    isSearching
      ? {
          query: search.trim(),
          difficulty,
          roiPotential: roi,
          limit: 30,
        }
      : "skip"
  );

  const browseResults = useQuery(
    api.ideas.listIdeas,
    !isSearching
      ? {
          paginationOpts: { numItems: 24, cursor: null },
          categoryId,
          difficulty,
          roiPotential: roi,
          sortBy,
        }
      : "skip"
  );

  const ideas = isSearching
    ? searchResults
    : browseResults?.page ?? (browseResults === undefined ? undefined : []);

  const hasActiveFilters = !!(difficulty || roi || categoryId);

  function clearFilters() {
    setDifficulty(undefined);
    setRoi(undefined);
    setCategoryId(undefined);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/95 sticky top-16 z-30 nav-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          {/* Search + filter toggle row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="browse-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ideas…"
                className="pl-10 rounded-xl border-border/60 bg-muted/40 focus:bg-background"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              className="gap-2 rounded-xl shrink-0"
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary-foreground" />
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground shrink-0"
                onClick={clearFilters}
              >
                <X className="w-3.5 h-3.5" />
                Clear
              </Button>
            )}
          </div>

          {/* Expandable filter panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border/60 space-y-3">
              {/* Categories */}
              {categories && categories.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">
                    Category
                  </span>
                  {categories.map((cat) => (
                    <FilterPill
                      key={cat._id}
                      label={`${cat.icon ?? ""} ${cat.name}`}
                      active={categoryId === cat._id}
                      onClick={() =>
                        setCategoryId(categoryId === cat._id ? undefined : cat._id)
                      }
                    />
                  ))}
                </div>
              )}

              {/* Difficulty */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">
                  Difficulty
                </span>
                {DIFFICULTIES.map((d) => (
                  <FilterPill
                    key={d.value}
                    label={d.label}
                    active={difficulty === d.value}
                    onClick={() =>
                      setDifficulty(difficulty === d.value ? undefined : d.value)
                    }
                  />
                ))}
              </div>

              {/* ROI */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">
                  ROI
                </span>
                {ROI_OPTIONS.map((r) => (
                  <FilterPill
                    key={r.value}
                    label={r.label}
                    active={roi === r.value}
                    onClick={() => setRoi(roi === r.value ? undefined : r.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Sort row (only when not searching) */}
          {!isSearching && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground mr-1">
                Sort
              </span>
              {SORT_OPTIONS.map((s) => (
                <FilterPill
                  key={s.value}
                  label={s.label}
                  active={sortBy === s.value}
                  onClick={() => setSortBy(s.value)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Result count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {ideas === undefined
              ? "Loading…"
              : isSearching
              ? `${ideas.length} result${ideas.length !== 1 ? "s" : ""} for "${search}"`
              : `${ideas.length} idea${ideas.length !== 1 ? "s" : ""}`}
          </p>
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              {difficulty && (
                <Badge variant="secondary" className="gap-1.5 text-xs">
                  {difficulty}
                  <button onClick={() => setDifficulty(undefined)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {roi && (
                <Badge variant="secondary" className="gap-1.5 text-xs">
                  {roi}
                  <button onClick={() => setRoi(undefined)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Grid */}
        {ideas === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 md:gap-10">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="aspect-video rounded-3xl border border-border/60 bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No ideas found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Try adjusting your filters or search terms.
            </p>
            <Button variant="outline" onClick={clearFilters} className="rounded-xl">
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 md:gap-12">
            {ideas.map((idea) => (
              <IdeaCard key={idea._id} {...(idea as any)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
