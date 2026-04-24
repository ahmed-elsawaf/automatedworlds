"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IdeaCard } from "@/components/marketing/IdeaCard";
import { AuthPromptBanner } from "@/components/auth/AuthPromptBanner";
import {
  Eye, Bookmark, ShoppingBag, Star, ArrowRight, ExternalLink,
  Play, Code2, Paintbrush, Crown, CheckCircle2, BookmarkCheck,
  TrendingUp, Clock, Users, DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { api } from "../../../../../convex/_generated/api";
import { useAuthIntent } from "@/lib/auth-intent";
import type { Id } from "../../../../../convex/_generated/dataModel";

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const SESSION_KEY = "aw_session";
function getSessionId() {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(SESSION_KEY, id); }
  return id;
}

function fmt(cents?: number) {
  if (!cents) return null;
  return `$${(cents / 100).toFixed(0)}`;
}

const DIFF_COLOR = {
  beginner: "bg-emerald-500/15 text-emerald-500",
  intermediate: "bg-amber-500/15 text-amber-500",
  advanced: "bg-rose-500/15 text-rose-500",
};
const ROI_COLOR = {
  low: "bg-slate-500/15 text-slate-400",
  medium: "bg-blue-500/15 text-blue-400",
  high: "bg-violet-500/15 text-violet-400",
  very_high: "bg-orange-500/15 text-orange-400",
};

/* ─── Purchase Option ─────────────────────────────────────────────────── */
interface PurchaseOptionProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  price: number;
  description: string;
  variant?: "default" | "cyan" | "amber";
  isGuest: boolean;
  hasPurchased: boolean;
  isSoldOut: boolean;
  onGuestClick: () => void;
  onBuyClick: () => void;
}

function PurchaseOption({
  id,
  icon,
  label,
  price,
  description,
  variant = "default",
  isGuest,
  hasPurchased,
  isSoldOut,
  onGuestClick,
  onBuyClick,
}: PurchaseOptionProps) {
  const borderClass = {
    default: "border-border/60 hover:border-primary/40",
    cyan: "border-border/60 hover:border-cyan-500/40",
    amber: "border-amber-500/20 hover:border-amber-500/50",
  }[variant];

  return (
    <div
      id={id}
      className={cn(
        "p-4 rounded-xl border transition-colors duration-200",
        borderClass,
        hasPurchased && "border-emerald-500/30 bg-emerald-500/5",
        isSoldOut && "opacity-60 pointer-events-none"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{label}</span>
        </div>
        <span className="font-bold text-sm">{fmt(price)}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>

      {hasPurchased ? (
        <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> Already purchased
        </div>
      ) : isGuest ? (
        <SignUpButton mode="modal">
          <Button
            size="sm"
            variant={variant === "default" ? "default" : "outline"}
            className={cn(
              "w-full rounded-lg h-9 text-sm gap-2",
              variant === "default" && "brand-gradient border-0 text-white hover:opacity-90"
            )}
            onClick={onGuestClick}
          >
            Sign up to buy <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </SignUpButton>
      ) : (
        <Button
          size="sm"
          variant={variant === "default" ? "default" : "outline"}
          className={cn(
            "w-full rounded-lg h-9 text-sm gap-2",
            variant === "default" && "brand-gradient border-0 text-white hover:opacity-90"
          )}
          onClick={onBuyClick}
        >
          {label === "Source Code" ? "Buy Code" : label === "Custom Build" ? "Request Custom" : "Buy Exclusive"}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
export default function IdeaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isSignedIn } = useUser();
  const sessionId = typeof window !== "undefined" ? getSessionId() : "ssr";
  const { recordIntent } = useAuthIntent();

  const idea = useQuery(api.ideas.getIdeaBySlug, { slug, sessionId });
  const related = useQuery(
    api.ideas.getRelatedIdeas,
    idea ? { ideaId: idea._id, limit: 3 } : "skip"
  );
  const saveIdea = useMutation(api.ideas.saveIdea);
  const unsaveIdea = useMutation(api.ideas.unsaveIdea);

  async function handleSave() {
    if (!idea) return;
    if (!isSignedIn) {
      recordIntent({ action: "save_idea", ideaId: String(idea._id), ideaSlug: slug });
      return;
    }
    try {
      if (idea.hasSaved) {
        await unsaveIdea({ ideaId: idea._id });
        toast.success("Removed from saved");
      } else {
        await saveIdea({ ideaId: idea._id });
        toast.success("Saved! ✅");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  function handleGuestBuy(action: "buy_code" | "buy_custom" | "buy_exclusive") {
    if (!idea) return;
    recordIntent({ action, ideaSlug: slug, ideaId: String(idea._id) });
  }

  function handleBuy(type: string) {
    toast.info(`Purchase flow for "${type}" coming soon!`);
  }

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (idea === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-10 w-64 bg-muted rounded-lg animate-pulse mb-4" />
        <div className="h-5 w-96 bg-muted rounded animate-pulse mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-80 bg-muted rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (idea === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-2xl font-bold mb-2">Idea not found</h1>
        <p className="text-muted-foreground mb-6">This idea doesn&apos;t exist or you don&apos;t have access.</p>
        <Button asChild className="rounded-xl"><Link href="/browse">Browse Ideas</Link></Button>
      </div>
    );
  }

  const isSoldOut = idea.status === "sold_out";
  const isGuest = !isSignedIn;
  const hasPurchased = !!idea.hasPurchased;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <div className="relative border-b border-border/40 bg-muted/20 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-500/5 blur-[100px] rounded-full -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-12">
          {/* Breadcrumb - Minimal */}
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-8">
            <Link href="/browse" className="hover:text-primary transition-colors">Browse</Link>
            <span className="opacity-20">/</span>
            {idea.category && <span className="text-primary/60">{idea.category.name}</span>}
            <span className="opacity-20">/</span>
            <span className="text-foreground/20 truncate max-w-xs">{idea.title}</span>
          </div>

          {/* Featured Image - The Centerpiece */}
          {idea.coverImageUrl && (
            <div className="mb-14 relative group max-w-5xl mx-auto">
              <div className="aspect-video w-full rounded-[3rem] overflow-hidden border border-border/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] bg-black/5 relative">
                <img 
                  src={idea.coverImageUrl} 
                  alt={idea.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none" />
              </div>
              {/* Floating stats on image */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-6 backdrop-blur-2xl bg-background/80 border border-border/60 px-8 py-4 rounded-[2rem] shadow-2xl z-10 whitespace-nowrap">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-60">Views</span>
                  <span className="text-lg font-black tabular-nums tracking-tighter">{idea.viewCount.toLocaleString()}</span>
                </div>
                <div className="w-px h-10 bg-border/60" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-60">Sales</span>
                  <span className="text-lg font-black tabular-nums tracking-tighter">{idea.purchaseCount}</span>
                </div>
                <div className="w-px h-10 bg-border/60" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter opacity-60">Rating</span>
                  <span className="text-lg font-black flex items-center gap-1.5 tracking-tighter">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    {idea.rating?.toFixed(1) || "5.0"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-12 items-start mt-10">
            <div className="flex-1 min-w-0">
              {/* Badge row */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {idea.isNew && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-primary text-white rounded-full px-4 py-1.5 shadow-lg shadow-primary/20">New Idea</span>
                )}
                {idea.isFeatured && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white rounded-full px-4 py-1.5 shadow-lg shadow-amber-500/20">⭐ Featured</span>
                )}
                <span className={cn("text-[10px] font-black uppercase tracking-widest rounded-full px-4 py-1.5 border shadow-sm", DIFF_COLOR[idea.difficulty as keyof typeof DIFF_COLOR])}>
                  {idea.difficulty}
                </span>
                <span className={cn("text-[10px] font-black uppercase tracking-widest rounded-full px-4 py-1.5 border shadow-sm", ROI_COLOR[idea.roiPotential as keyof typeof ROI_COLOR])}>
                  {idea.roiPotential.replace("_", " ")} ROI
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 leading-[1.1]">{idea.title}</h1>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl font-medium">{idea.tagline}</p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{idea.viewCount.toLocaleString()} views</span>
                <span className="flex items-center gap-1.5"><ShoppingBag className="w-4 h-4" />{idea.purchaseCount} purchased</span>
                {idea.rating != null && idea.rating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {idea.rating.toFixed(1)} ({idea.reviewCount} reviews)
                  </span>
                )}
              </div>
            </div>

            {/* Save + Demo quick access */}
            <div className="flex items-center gap-3 shrink-0">
              {isGuest ? (
                <SignUpButton mode="modal">
                  <Button
                    variant="outline"
                    className="rounded-xl gap-2"
                    onClick={() => recordIntent({ action: "save_idea", ideaId: String(idea._id), ideaSlug: slug })}
                  >
                    <Bookmark className="w-4 h-4" /> Save
                  </Button>
                </SignUpButton>
              ) : (
                <Button variant="outline" className="rounded-xl gap-2" onClick={handleSave}>
                  {idea.hasSaved ? (
                    <><BookmarkCheck className="w-4 h-4 text-primary" /> Saved</>
                  ) : (
                    <><Bookmark className="w-4 h-4" /> Save</>
                  )}
                </Button>
              )}
              {idea.demoUrl && (
                <Button asChild className="rounded-xl gap-2" variant="secondary">
                  <a href={idea.demoUrl} target="_blank" rel="noopener noreferrer">
                    <Play className="w-4 h-4" /> Live Demo
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body — two column */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── Left: main content ────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border border-border/60 bg-card">
                <p className="text-xs text-muted-foreground mb-1">Market Size</p>
                <p className="font-semibold text-sm">{idea.marketSize ?? "—"}</p>
              </div>
              <div className="p-4 rounded-2xl border border-border/60 bg-card">
                <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", DIFF_COLOR[idea.difficulty])}>{idea.difficulty}</span>
              </div>
              <div className="p-4 rounded-2xl border border-border/60 bg-card">
                <p className="text-xs text-muted-foreground mb-1">ROI Potential</p>
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", ROI_COLOR[idea.roiPotential])}>{idea.roiPotential.replace("_", " ")}</span>
              </div>
              <div className="p-4 rounded-2xl border border-border/60 bg-card">
                <p className="text-xs text-muted-foreground mb-1">Time to Launch</p>
                <p className="font-semibold text-sm">{idea.timeToLaunch ?? "—"}</p>
              </div>
            </div>

            {/* Description */}
            {idea.description && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Overview</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {idea.description}
                </div>
              </section>
            )}

            {/* Problem / Solution */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5">
                <h3 className="font-semibold text-sm mb-2 text-rose-400">The Problem</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{idea.problemStatement}</p>
              </div>
              <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                <h3 className="font-semibold text-sm mb-2 text-emerald-400">The Solution</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{idea.solutionOverview}</p>
              </div>
            </section>

            {/* UVP */}
            {idea.uniqueValueProp && (
              <section className="p-5 rounded-2xl border border-primary/20 bg-primary/5">
                <h3 className="font-semibold text-sm text-primary mb-2">Unique Value Proposition</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{idea.uniqueValueProp}</p>
              </section>
            )}

            {/* Target audience */}
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Target Audience
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{idea.targetAudience}</p>
            </section>

            {/* Revenue model */}
            <section>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" /> Revenue Model
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{idea.revenueModel}</p>
              {idea.revenueStreams.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {idea.revenueStreams.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              )}
            </section>

            {/* Competitors */}
            {idea.competitors.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Competition Analysis
                </h2>
                <div className="space-y-3">
                  {idea.competitors.map((c) => (
                    <div key={c.name} className="flex items-start gap-4 p-4 rounded-xl border border-border/60 bg-card">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">{c.name}</p>
                          {c.url && (
                            <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{c.weakness}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tech stack */}
            {idea.techStack.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold mb-4">Tech Stack</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {idea.techStack.map((t) => (
                    <div key={t.name} className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{t.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Live demo */}
            {idea.demoUrl && (
              <section className="p-6 rounded-2xl border border-border/60 bg-card">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary" /> Live Demo
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Test the actual product before you buy. Fully deployed, real features.
                </p>
                {idea.demoUsername && (
                  <div className="bg-muted/50 rounded-xl p-3 text-xs font-mono mb-4 space-y-1">
                    <p><span className="text-muted-foreground">Email:</span> {idea.demoUsername}</p>
                    {idea.demoPassword && <p><span className="text-muted-foreground">Password:</span> {idea.demoPassword}</p>}
                  </div>
                )}
                <Button asChild className="rounded-xl gap-2" variant="secondary">
                  <a href={idea.demoUrl} target="_blank" rel="noopener noreferrer">
                    Open Live Demo <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </section>
            )}
          </div>

          {/* ── Right: Purchase sidebar ───────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-36 space-y-4" id="purchase-panel">

              {/* Guest prompt banner — only shown to guests above purchase options */}
              {isGuest && (
                <AuthPromptBanner
                  action="buy_code"
                  ideaId={String(idea._id)}
                  ideaSlug={slug}
                  label="Sign up free to purchase this idea"
                  className="fade-in-up"
                />
              )}

              {/* Purchase panel — always visible */}
              <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">Get This Idea</h2>
                  {hasPurchased && (
                    <span className="flex items-center gap-1.5 text-emerald-500 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Owned
                    </span>
                  )}
                </div>

                {isSoldOut ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">This exclusive idea has been sold.</p>
                    {isGuest ? (
                      <SignUpButton mode="modal">
                        <Button
                          variant="outline"
                          className="w-full rounded-xl"
                          onClick={() => recordIntent({ action: "join_waitlist", ideaSlug: slug })}
                        >
                          Join Waitlist
                        </Button>
                      </SignUpButton>
                    ) : (
                      <Button variant="outline" className="w-full rounded-xl">Join Waitlist</Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {idea.priceCodeBase && (
                      <PurchaseOption
                        id="purchase-option-code"
                        icon={<Code2 className="w-4 h-4 text-primary" />}
                        label="Source Code"
                        price={idea.priceCodeBase}
                        description="Full source code — deploy yourself"
                        variant="default"
                        isGuest={isGuest}
                        hasPurchased={hasPurchased}
                        isSoldOut={isSoldOut}
                        onGuestClick={() => handleGuestBuy("buy_code")}
                        onBuyClick={() => handleBuy("code")}
                      />
                    )}
                    {idea.priceCustomization && (
                      <PurchaseOption
                        id="purchase-option-custom"
                        icon={<Paintbrush className="w-4 h-4 text-cyan-400" />}
                        label="Custom Build"
                        price={idea.priceCustomization}
                        description="We brand and deploy it for you"
                        variant="cyan"
                        isGuest={isGuest}
                        hasPurchased={hasPurchased}
                        isSoldOut={isSoldOut}
                        onGuestClick={() => handleGuestBuy("buy_custom")}
                        onBuyClick={() => handleBuy("custom")}
                      />
                    )}
                    {idea.priceExclusive && (
                      <PurchaseOption
                        id="purchase-option-exclusive"
                        icon={<Crown className="w-4 h-4 text-amber-400" />}
                        label="Exclusive License"
                        price={idea.priceExclusive}
                        description="Own it completely — removed from marketplace"
                        variant="amber"
                        isGuest={isGuest}
                        hasPurchased={hasPurchased}
                        isSoldOut={isSoldOut}
                        onGuestClick={() => handleGuestBuy("buy_exclusive")}
                        onBuyClick={() => handleBuy("exclusive")}
                      />
                    )}

                    {hasPurchased && (
                      <Button asChild className="w-full rounded-xl" variant="outline">
                        <Link href="/dashboard/orders">View Orders</Link>
                      </Button>
                    )}
                  </div>
                )}

                {/* Guarantees */}
                <div className="pt-2 border-t border-border/60 space-y-2">
                  {["Instant code delivery", "Up to 10 downloads", "Money-back guarantee"].map((g) => (
                    <div key={g} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {g}
                    </div>
                  ))}
                </div>
              </div>

              {/* Idea meta */}
              <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
                <h3 className="font-semibold text-sm">Idea Details</h3>
                {idea.timeToLaunch && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Time to Launch</span>
                    <span className="font-medium">{idea.timeToLaunch}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Difficulty</span>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", DIFF_COLOR[idea.difficulty])}>{idea.difficulty}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ROI Potential</span>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", ROI_COLOR[idea.roiPotential])}>{idea.roiPotential.replace("_", " ")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related ideas */}
        {related && related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">You might also like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((r) => <IdeaCard key={r._id} {...(r as any)} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
