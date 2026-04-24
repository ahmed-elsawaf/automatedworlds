"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Footer } from "@/components/marketing/Footer";
import { IdeaCard } from "@/components/marketing/IdeaCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Zap,
  Search,
  ShoppingBag,
  Rocket,
  CheckCircle2,
  Code2,
  Paintbrush,
  Crown,
  TrendingUp,
  Users,
  Layers,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "../../convex/_generated/dataModel";

/* ─── Stats ─────────────────────────────────────────────────────────────── */
const STATS = [
  { label: "Ideas Published", value: "50+", icon: Layers },
  { label: "Happy Buyers", value: "200+", icon: Users },
  { label: "Categories", value: "15", icon: TrendingUp },
];

/* ─── How It Works ───────────────────────────────────────────────────────── */
const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Browse Ideas",
    description: "Explore data-backed SaaS opportunities. Each idea includes full market research, competitor analysis, revenue model, and tech stack.",
    icon: Search,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    step: "02",
    title: "Try the Live Demo",
    description: "Visit the live demo and test the product yourself before spending a cent. Real credentials, real features, fully deployed.",
    icon: Rocket,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    step: "03",
    title: "Buy & Launch",
    description: "Purchase the source code and deploy in minutes. Or request a custom build — we brand it, configure it, and hand it over.",
    icon: ShoppingBag,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
];

/* ─── Purchase options ───────────────────────────────────────────────────── */
const PURCHASE_OPTIONS = [
  {
    icon: Code2,
    title: "Get the Code",
    description: "Download the full source code. Deploy it yourself, customize it however you want. Own it completely.",
    badge: "Most popular",
    badgeColor: "bg-violet-500/15 text-violet-400",
    color: "border-violet-500/20 hover:border-violet-500/40",
  },
  {
    icon: Paintbrush,
    title: "Get It Customized",
    description: "We'll brand it with your logo, colors, and domain. Add extra features. Hand over a production-ready business.",
    badge: "Done-for-you",
    badgeColor: "bg-cyan-500/15 text-cyan-400",
    color: "border-cyan-500/20 hover:border-cyan-500/40",
  },
  {
    icon: Crown,
    title: "Exclusive License",
    description: "Be the only owner. We remove the idea from the marketplace so no one else can build competing with your exact concept.",
    badge: "Premium",
    badgeColor: "bg-amber-500/15 text-amber-400",
    color: "border-amber-500/20 hover:border-amber-500/40",
  },
];

/* ─── Testimonials ──────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    body: "I went from idea to paying customers in 3 weeks. The code quality blew me away — it was better than anything I could have built in 3 months.",
    name: "Alex K.",
    role: "Indie Hacker",
    avatar: "AK",
  },
  {
    body: "The customization service is insane value. They rebranded everything, set up my domain, and delivered a SaaS I'm already charging $49/mo for.",
    name: "Sarah M.",
    role: "Solopreneur",
    avatar: "SM",
  },
  {
    body: "I've bought 3 ideas so far. The market research alone is worth the price. This is like having a co-founder who does all the validation work.",
    name: "David R.",
    role: "Serial Founder",
    avatar: "DR",
  },
];

/* ─── Filter types ───────────────────────────────────────────────────────── */
type Difficulty = "beginner" | "intermediate" | "advanced";
type ROI = "low" | "medium" | "high" | "very_high";
type SortBy = "newest" | "popular" | "most_purchased" | "top_rated";

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most Viewed" },
  { value: "most_purchased", label: "Best Selling" },
  { value: "top_rated", label: "Top Rated" },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
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

/* ─── Component ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();
  const [roi, setRoi] = useState<ROI | undefined>();
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [categoryId, setCategoryId] = useState<Id<"categories"> | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const isSearching = search.trim().length > 1;
  const hasActiveFilters = !!(difficulty || roi || categoryId);

  const categories = useQuery(api.categories.listCategories, {});

  const searchResults = useQuery(
    api.ideas.searchIdeas,
    isSearching
      ? { query: search.trim(), difficulty, roiPotential: roi, limit: 30 }
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

  function clearFilters() {
    setDifficulty(undefined);
    setRoi(undefined);
    setCategoryId(undefined);
    setSearch("");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MarketingNav />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-14 px-4 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] rounded-full bg-brand-cyan/5 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-sm text-primary font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            50+ Ideas Ready to Buy and Launch
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
            Buy the idea.{" "}
            <span className="brand-gradient-text">Launch the product.</span>
          </h1>

          {/* Sub */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
            Professionally researched SaaS opportunities — every idea comes with
            full market analysis, a{" "}
            <span className="text-foreground font-medium">live demo you can test</span>,
            and ready-to-launch source code. No account needed to browse.
          </p>

          {/* Reassurance strip */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground mb-10">
            {["Browse freely — no sign-up", "Test live demos instantly", "Buy only when you're ready"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {t}
              </span>
            ))}
          </div>

          {/* Stats bar */}
          <div className="mx-auto max-w-2xl">
            <div className="grid grid-cols-3 gap-4">
              {STATS.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 p-5 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm"
                >
                  <Icon className="w-5 h-5 text-primary mb-1" />
                  <p className="text-3xl font-extrabold tracking-tight">{value}</p>
                  <p className="text-xs text-muted-foreground text-center">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Live Browse Section ────────────────────────────────────────────── */}
      <section className="flex-1 border-t border-border/60 bg-muted/20">
        {/* Sticky filter bar */}
        <div className="sticky top-16 z-30 border-b border-border/60 bg-background/95 nav-blur">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            {/* Search + filter toggle */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="home-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search 50+ ideas…"
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
                {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-foreground" />}
              </Button>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground shrink-0"
                  onClick={clearFilters}
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </Button>
              )}
            </div>

            {/* Expandable filter panel */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-border/60 space-y-2.5">
                {categories && categories.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">Category</span>
                    {categories.map((cat) => (
                      <FilterPill
                        key={cat._id}
                        label={`${cat.icon ?? ""} ${cat.name}`}
                        active={categoryId === cat._id}
                        onClick={() => setCategoryId(categoryId === cat._id ? undefined : cat._id)}
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">Difficulty</span>
                  {DIFFICULTY_OPTIONS.map((d) => (
                    <FilterPill
                      key={d.value}
                      label={d.label}
                      active={difficulty === d.value}
                      onClick={() => setDifficulty(difficulty === d.value ? undefined : d.value)}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">ROI</span>
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

            {/* Sort row */}
            {!isSearching && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Sort</span>
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

        {/* Result count + grid */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {ideas === undefined
                ? "Loading…"
                : isSearching
                ? `${ideas.length} result${ideas.length !== 1 ? "s" : ""} for "${search}"`
                : `${ideas.length} idea${ideas.length !== 1 ? "s" : ""}`}
            </p>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <Link href="/browse">
                Advanced browse <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          {ideas === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-3xl border border-border/60 bg-muted animate-pulse" />
              ))}
            </div>
          ) : ideas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No ideas found</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">Try adjusting your filters or search terms.</p>
              <Button variant="outline" onClick={clearFilters} className="rounded-xl">Clear filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {ideas.map((idea) => (
                <IdeaCard key={idea._id} {...(idea as any)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 border-t border-border/60">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">The Process</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">From browse to business in days</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              We handle the research, building, and validation — you handle the growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon, color, bg }) => (
              <div key={step} className="relative flex flex-col items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Step {step}</p>
                  <h3 className="text-xl font-semibold mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Purchase Options ─────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Three Ways to Win</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Buy exactly what you need</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PURCHASE_OPTIONS.map(({ icon: Icon, title, description, badge, badgeColor, color }) => (
              <div
                key={title}
                className={`relative flex flex-col gap-4 p-6 rounded-2xl border bg-card transition-all duration-200 ${color}`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 ${badgeColor}`}>{badge}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Social Proof</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Founders who shipped fast</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ body, name, role, avatar }) => (
              <div key={name} className="flex flex-col gap-4 p-6 rounded-2xl border border-border/60 bg-card">
                <p className="text-sm leading-relaxed text-muted-foreground">&ldquo;{body}&rdquo;</p>
                <div className="flex items-center gap-3 mt-auto">
                  <div className="w-9 h-9 rounded-full brand-gradient flex items-center justify-center text-white text-xs font-bold">{avatar}</div>
                  <div>
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="relative p-12 rounded-3xl border border-primary/20 bg-primary/5 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.65_0.24_292/0.12),transparent_70%)]" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Ready to start your next business?</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Browse 50+ ideas and find your next product today. No validation, no research, no guessing.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-semibold rounded-xl brand-gradient border-0 hover:opacity-90 gap-2"
                  onClick={() => document.getElementById("home-search")?.focus()}
                >
                  Browse All Ideas <ArrowRight className="w-4 h-4" />
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base rounded-xl">
                  <Link href="#how-it-works">See How It Works</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
