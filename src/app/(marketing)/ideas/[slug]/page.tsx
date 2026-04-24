"use client";

import { useState, useEffect } from "react";
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
  TrendingUp, Clock, Users, DollarSign, Layout
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { api } from "../../../../../convex/_generated/api";
import { useAuthIntent } from "@/lib/auth-intent";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Reviews } from "@/components/marketing/Reviews";

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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const idea = useQuery(api.ideas.getIdeaBySlug, { slug, sessionId });
  const related = useQuery(
    api.ideas.getRelatedIdeas,
    idea ? { ideaId: idea._id, limit: 3 } : "skip"
  );
  const saveIdea = useMutation(api.ideas.saveIdea);
  const unsaveIdea = useMutation(api.ideas.unsaveIdea);
  const recordDemoClick = useMutation(api.ideas.recordDemoClick);
  const recordIdeaView = useMutation(api.ideas.recordIdeaView);

  // Record a view on load
  useEffect(() => {
    if (idea?._id) {
      recordIdeaView({
        ideaId: idea._id,
        sessionId,
        referrer: document.referrer || undefined,
        device: navigator.userAgent || undefined,
      }).catch(console.error);
    }
  }, [idea?._id, sessionId, recordIdeaView]);

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

  function handleGuestBuy(action: "buy_code" | "buy_custom") {
    if (!idea) return;
    recordIntent({ action, ideaSlug: slug, ideaId: String(idea._id) });
  }

  function handleBuy(type: string) {
    toast.info(`Purchase flow for "${type}" coming soon!`);
  }

  function handleDemoClick() {
    if (idea) {
      recordDemoClick({ ideaId: idea._id }).catch(console.error);
    }
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

  // Compile all images
  const allImages = [
    ...(idea.coverImageUrl ? [idea.coverImageUrl] : []),
    ...(idea.screenshotUrls || [])
  ];
  
  const currentImage = allImages.length > 0 ? allImages[selectedImageIndex] : null;

  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-8">
          <Link href="/browse" className="hover:text-primary transition-colors">Browse</Link>
          <span className="opacity-30">/</span>
          {idea.category && <span className="text-primary/70">{idea.category.name}</span>}
          <span className="opacity-30">/</span>
          <span className="text-foreground/40 truncate max-w-xs">{idea.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* LEFT: Image Gallery (Amazon style) */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row-reverse gap-4">
            {/* Main Image */}
            <div className="flex-1 aspect-4/3 sm:aspect-auto sm:h-[500px] bg-muted rounded-xl border border-border/40 overflow-hidden relative">
              {currentImage ? (
                <img src={currentImage} alt={idea.title} className="w-full h-full object-contain bg-black/5 dark:bg-white/5" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Layout className="w-12 h-12 text-muted-foreground/20" />
                </div>
              )}
            </div>
            {/* Thumbnails list (vertical on desktop, horizontal on mobile) */}
            {allImages.length > 1 && (
              <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:w-20 pb-2 sm:pb-0 shrink-0 custom-scrollbar">
                {allImages.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setSelectedImageIndex(i)}
                    className={cn(
                      "w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all bg-muted",
                      selectedImageIndex === i ? "border-primary" : "border-transparent hover:border-border"
                    )}
                  >
                    <img src={img as string} alt={`Thumbnail ${i+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* MIDDLE: Product Details */}
          <div className="lg:col-span-4 space-y-6">
            {/* Title & Badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {idea.isNew && <span className="bg-primary text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm shadow-sm">New</span>}
                {idea.isFeatured && <span className="bg-amber-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm shadow-sm">Featured</span>}
                <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm shadow-sm", DIFF_COLOR[idea.difficulty as keyof typeof DIFF_COLOR])}>{idea.difficulty}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 leading-tight">{idea.title}</h1>
              <p className="text-base text-muted-foreground leading-relaxed">{idea.tagline}</p>
            </div>

            {/* Rating & Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground py-3 border-y border-border/40">
              {idea.rating != null && idea.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="font-medium text-foreground">{idea.rating.toFixed(1)}</span>
                  <span>({idea.reviewCount} reviews)</span>
                </div>
              )}
              <div className="flex items-center gap-1.5"><Eye className="w-4 h-4" />{idea.viewCount.toLocaleString()} views</div>
              <div className="flex items-center gap-1.5"><ShoppingBag className="w-4 h-4" />{idea.purchaseCount} sold</div>
            </div>

            {/* Quick Features Bullet Points */}
            <div className="space-y-3 pt-2">
              <h3 className="font-semibold text-sm">About this idea</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4 marker:text-primary">
                <li><strong className="text-foreground">ROI Potential:</strong> {idea.roiPotential.replace("_", " ").toUpperCase()}</li>
                {idea.timeToLaunch && <li><strong className="text-foreground">Time to Launch:</strong> {idea.timeToLaunch}</li>}
                {idea.marketSize && <li><strong className="text-foreground">Market Size:</strong> {idea.marketSize}</li>}
                <li><strong className="text-foreground">Target Audience:</strong> {idea.targetAudience}</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              {isGuest ? (
                <SignUpButton mode="modal">
                  <Button variant="outline" className="gap-2" onClick={() => recordIntent({ action: "save_idea", ideaId: String(idea._id), ideaSlug: slug })}>
                    <Bookmark className="w-4 h-4" /> Save to List
                  </Button>
                </SignUpButton>
              ) : (
                <Button variant="outline" className="gap-2" onClick={handleSave}>
                  {idea.hasSaved ? <><BookmarkCheck className="w-4 h-4 text-primary" /> Saved</> : <><Bookmark className="w-4 h-4" /> Save to List</>}
                </Button>
              )}
              {idea.demoUrl && (
                <Button asChild variant="secondary" className="gap-2" onClick={handleDemoClick}>
                  <a href={idea.demoUrl} target="_blank" rel="noopener noreferrer"><Play className="w-4 h-4" /> Live Demo</a>
                </Button>
              )}
            </div>
          </div>

          {/* RIGHT: Buy Box */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 rounded-xl border border-border/60 bg-card shadow-lg p-5 space-y-4">
              {isGuest && (
                <AuthPromptBanner action="buy_code" ideaId={String(idea._id)} ideaSlug={slug} label="Sign up free to purchase" className="mb-4" />
              )}
              <h2 className="font-bold text-lg border-b border-border/40 pb-3">Get This Idea</h2>
              
              {isSoldOut ? (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm text-rose-500 font-semibold">Sold Out / Exclusive claimed</p>
                  <Button variant="outline" className="w-full">Join Waitlist</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {idea.priceCodeBase && (
                    <PurchaseOption
                      id="purchase-option-code"
                      icon={<Code2 className="w-4 h-4 text-primary" />}
                      label="Source Code"
                      price={idea.priceCodeBase}
                      description="Deploy it yourself"
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
                      description="We build it for you"
                      variant="cyan"
                      isGuest={isGuest}
                      hasPurchased={hasPurchased}
                      isSoldOut={isSoldOut}
                      onGuestClick={() => handleGuestBuy("buy_custom")}
                      onBuyClick={() => handleBuy("custom")}
                    />
                  )}
                  {hasPurchased && (
                    <Button asChild className="w-full" variant="outline"><Link href="/dashboard/orders">View Orders</Link></Button>
                  )}
                </div>
              )}
              
              <div className="pt-3 border-t border-border/40 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Instant delivery</div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Secure payment</div>
              </div>
            </div>
          </div>

        </div>

        {/* BELOW THE FOLD: Deep Dive Details */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10 border-t border-border/40 pt-10">
          <div className="lg:col-span-8 space-y-10">
            {idea.description && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {idea.description}
                </div>
              </section>
            )}

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-bold text-lg flex items-center gap-2 text-rose-500"><TrendingUp className="w-5 h-5" /> The Problem</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{idea.problemStatement}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-500"><CheckCircle2 className="w-5 h-5" /> The Solution</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{idea.solutionOverview}</p>
              </div>
            </section>

            {idea.uniqueValueProp && (
              <section className="bg-primary/5 border border-primary/20 rounded-xl p-6">
                <h3 className="font-bold text-lg text-primary mb-2">Unique Value Proposition</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{idea.uniqueValueProp}</p>
              </section>
            )}

            <section>
              <h2 className="text-2xl font-bold mb-4">Revenue Model</h2>
              <p className="text-sm text-muted-foreground mb-4">{idea.revenueModel}</p>
              {idea.revenueStreams.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {idea.revenueStreams.map((s: any) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              )}
            </section>

            {idea.techStack.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Tech Stack</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {idea.techStack.map((t: any) => (
                    <div key={t.name} className="p-4 rounded-xl border border-border/60 bg-card">
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {idea.competitors.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4">Competition</h2>
                <div className="space-y-3">
                  {idea.competitors.map((c: any) => (
                    <div key={c.name} className="p-4 rounded-xl border border-border/60 bg-card">
                      <p className="font-bold text-sm mb-1">{c.name} {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="inline-block ml-1"><ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" /></a>}</p>
                      <p className="text-xs text-muted-foreground"><strong>Weakness:</strong> {c.weakness}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
          
          <div className="lg:col-span-4">
            {/* Demo Panel if exists */}
            {idea.demoUrl && (
              <div className="rounded-xl border border-border/60 bg-card p-6 sticky top-24">
                <h3 className="font-bold text-lg mb-3">Try before you buy</h3>
                <p className="text-sm text-muted-foreground mb-4">Access the fully functioning live demo.</p>
                {idea.demoUsername && (
                  <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono mb-4 space-y-1">
                    <p><span className="text-muted-foreground">Email:</span> {idea.demoUsername}</p>
                    {idea.demoPassword && <p><span className="text-muted-foreground">Password:</span> {idea.demoPassword}</p>}
                  </div>
                )}
                <Button asChild className="w-full gap-2" variant="secondary" onClick={handleDemoClick}>
                  <a href={idea.demoUrl} target="_blank" rel="noopener noreferrer">
                    Open Live Demo <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <Reviews ideaId={idea._id} />
        </div>

        {/* Related ideas */}
        {related && related.length > 0 && (
          <section className="mt-20 pt-10 border-t border-border/40">
            <h2 className="text-2xl font-bold mb-6">Customers also viewed</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {related.map((r: any) => <IdeaCard key={r._id} {...(r as any)} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
