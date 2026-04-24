"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import {
  Eye,
  Bookmark,
  BookmarkCheck,
  ShoppingBag,
  Star,
  ArrowRight,
  Flame,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthIntent } from "@/lib/auth-intent";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";

/* ─── Types ─────────────────────────────────────────────────────────────── */
export interface IdeaCardProps {
  _id: Id<"ideas">;
  slug: string;
  title: string;
  tagline: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  roiPotential: "low" | "medium" | "high" | "very_high";
  visibility: "public" | "members_only" | "paid_only";
  isFeatured?: boolean;
  isNew?: boolean;
  viewCount: number;
  saveCount: number;
  purchaseCount: number;
  rating?: number;
  reviewCount: number;
  priceCodeBase?: number;
  priceCustomization?: number;
  status: string;
  category?: { name: string; color?: string; icon?: string } | null;
  hasSaved?: boolean;
  coverImageUrl?: string | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const DIFFICULTY_MAP = {
  beginner: {
    label: "Beginner",
    className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  },
  intermediate: {
    label: "Intermediate",
    className: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  },
  advanced: {
    label: "Advanced",
    className: "bg-rose-500/15 text-rose-500 border-rose-500/20",
  },
};

const ROI_MAP = {
  low: {
    label: "Low ROI",
    className: "bg-slate-500/15 text-slate-400 border-slate-500/20",
  },
  medium: {
    label: "Medium ROI",
    className: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  },
  high: {
    label: "High ROI",
    className: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  },
  very_high: {
    label: "Very High ROI 🔥",
    className: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  },
};

function formatPrice(cents?: number) {
  if (!cents) return null;
  return `$${(cents / 100).toFixed(0)}`;
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ─── Save Button ────────────────────────────────────────────────────────── */
function SaveButton({
  ideaId,
  ideaSlug,
  hasSaved,
}: {
  ideaId: Id<"ideas">;
  ideaSlug: string;
  hasSaved?: boolean;
}) {
  const { isSignedIn } = useUser();
  const { recordIntent } = useAuthIntent();
  const saveIdea = useMutation(api.ideas.saveIdea);
  const unsaveIdea = useMutation(api.ideas.unsaveIdea);

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      recordIntent({ action: "save_idea", ideaId: String(ideaId), ideaSlug });
      // Clerk modal opened by the SignUpButton wrapper below
      return;
    }

    try {
      if (hasSaved) {
        await unsaveIdea({ ideaId });
        toast.success("Removed from saved");
      } else {
        await saveIdea({ ideaId });
        toast.success("Saved! ✅");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  const icon = hasSaved ? (
    <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
  ) : (
    <Bookmark className="w-3.5 h-3.5" />
  );

  if (!isSignedIn) {
    return (
      <SignUpButton mode="modal">
        <button
          onClick={handleSave}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Sign up to save"
        >
          {icon}
        </button>
      </SignUpButton>
    );
  }

  return (
    <button
      onClick={handleSave}
      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      title={hasSaved ? "Remove from saved" : "Save idea"}
    >
      {icon}
    </button>
  );
}

export function IdeaCard({
  _id,
  slug,
  title,
  tagline,
  difficulty,
  roiPotential,
  visibility,
  isFeatured,
  isNew,
  viewCount,
  saveCount,
  purchaseCount,
  rating,
  reviewCount,
  priceCodeBase,
  priceCustomization,
  status,
  category,
  hasSaved,
  coverImageUrl,
}: IdeaCardProps) {
  const isSoldOut = status === "sold_out";

  return (
    <div className="group flex flex-col w-full rounded-none sm:rounded-md overflow-hidden transition-all duration-300 bg-transparent hover:bg-card hover:shadow-md">
      <Link href={`/ideas/${slug}`} className="flex flex-col flex-1 relative">
        {/* Thumbnail Container */}
        <div className="relative w-full aspect-video rounded-none sm:rounded-xl overflow-hidden bg-muted border border-border/40">
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Sparkles className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Top Left Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 z-10">
            {isNew && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-sm">
                New
              </span>
            )}
            {category && (
              <span className="bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-sm">
                {category.icon} {category.name}
              </span>
            )}
          </div>
          
          {/* Bottom Right Badge (YT Duration Style) */}
          <div className="absolute bottom-2 right-2 flex items-center z-10">
            <span className="bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm shadow-sm border border-white/10">
              {DIFFICULTY_MAP[difficulty].label}
            </span>
          </div>

          {/* Interactive Border Glow */}
          <div className="absolute inset-0 rounded-none sm:rounded-xl border border-black/5 pointer-events-none transition-colors duration-300" />
        </div>

        {/* Content Container */}
        <div className="flex flex-col p-3 pt-3">
          <div className="flex gap-3 items-start">
            {/* Optional Avatar space like YT */}
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <span className="text-primary font-bold text-xs">{title.substring(0,2).toUpperCase()}</span>
            </div>
            
            <div className="flex flex-col flex-1 min-w-0">
              <h3 className="text-base font-bold leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1 leading-snug">
                {tagline}
              </p>
              <div className="flex items-center text-sm text-muted-foreground mt-2 gap-2 font-medium">
                <span>{formatCount(viewCount)} views</span>
                <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                <span className="text-foreground font-bold">{formatPrice(priceCodeBase || 0)}</span>
                {rating != null && rating > 0 && (
                  <>
                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/50" />
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      {rating.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Absolute Save Button */}
      <div className="absolute right-2 bottom-3 z-20">
        <SaveButton ideaId={_id} ideaSlug={slug} hasSaved={hasSaved} />
      </div>
    </div>
  );
}
