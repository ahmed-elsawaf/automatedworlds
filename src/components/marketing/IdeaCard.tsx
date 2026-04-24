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
  isExclusive?: boolean;
  viewCount: number;
  saveCount: number;
  purchaseCount: number;
  rating?: number;
  reviewCount: number;
  priceCodeBase?: number;
  priceCustomization?: number;
  priceExclusive?: number;
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

/* ─── Component ─────────────────────────────────────────────────────────── */
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
  isExclusive,
  viewCount,
  saveCount,
  purchaseCount,
  rating,
  reviewCount,
  priceCodeBase,
  priceCustomization,
  priceExclusive,
  status,
  category,
  hasSaved,
  coverImageUrl,
}: IdeaCardProps) {
  const isSoldOut = status === "sold_out";
  // Members-only shows a teaser with a sign-up nudge; paid_only is fully browsable
  const isMembersOnly = visibility === "members_only";

  return (
    <div className="group relative w-full aspect-[4/5] rounded-3xl overflow-hidden border border-border/40 transition-all duration-700 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2">
      <Link href={`/ideas/${slug}`} className="absolute inset-0 z-0">
        {/* Background Image */}
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-primary/10 to-primary/30 flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-primary/10 animate-pulse" />
          </div>
        )}
        
        {/* Overlays */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />
        <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-transparent opacity-40" />
        
        {/* Content Container */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
          {/* Top Row: Category + Badges */}
          <div className="flex items-start justify-between">
            <div className="flex flex-wrap gap-2">
              {category && (
                <span className="backdrop-blur-md bg-white/10 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border border-white/10">
                  {category.icon} {category.name}
                </span>
              )}
              {isNew && (
                <span className="backdrop-blur-md bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl shadow-xl">
                  New
                </span>
              )}
            </div>
          </div>

          {/* Bottom Area: Info */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <h3 className="text-2xl font-black text-white leading-tight tracking-tight group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-white/70 line-clamp-2 font-medium leading-relaxed">
                {tagline}
              </p>
            </div>

            {/* Bottom Stats Strip */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/40 uppercase">Starting</span>
                  <span className="text-lg font-black text-white tabular-nums tracking-tighter">{formatPrice(priceCodeBase || 0)}</span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-white/90 tabular-nums">{formatCount(viewCount)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span className="text-xs font-black text-amber-500">{rating?.toFixed(1) || "5.0"}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Floating Save Button - Outside Link for clickability */}
      <div className="absolute top-6 right-6 z-20 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-1 rounded-2xl">
          <SaveButton ideaId={_id} ideaSlug={slug} hasSaved={hasSaved} />
        </div>
      </div>

      {/* Interactive Border Glow */}
      <div className="absolute inset-0 rounded-3xl border-2 border-primary/0 group-hover:border-primary/20 pointer-events-none transition-colors duration-500" />
    </div>
  );
}
