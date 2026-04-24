"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, MessageSquare, Check, X, 
  ExternalLink, User, Lightbulb, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminReviewsPage() {
  const reviews = useQuery(api.reviews.adminListPendingReviews, {
    paginationOpts: { numItems: 50, cursor: null },
  });

  const moderateMutation = useMutation(api.reviews.moderateReview);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleModerate = async (reviewId: any, status: "approved" | "rejected") => {
    setLoadingId(reviewId);
    try {
      await moderateMutation({ reviewId, status });
      toast.success(`Review ${status} successfully.`);
    } catch (error: any) {
      toast.error(error.message || "Failed to moderate review.");
    } finally {
      setLoadingId(null);
    }
  };

  if (reviews === undefined) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">Review Moderation</h1>
        <div className="h-96 rounded-2xl bg-muted animate-pulse border border-border/60" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Review Moderation</h1>
        <p className="text-muted-foreground text-sm">
          Approve or reject customer reviews. Approved reviews update the idea's average rating.
        </p>
      </div>

      {reviews.page.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-border/60 text-center bg-card">
          <Check className="w-12 h-12 text-emerald-500/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-1">Inbox Zero!</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            All reviews have been moderated. Check back later for new customer feedback.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.page.map((review: any) => (
            <div 
              key={review._id} 
              className="p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/20 transition-all flex flex-col lg:flex-row gap-8"
            >
              {/* Context Column */}
              <div className="lg:w-64 space-y-4 shrink-0">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Author
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {review.user?.name?.charAt(0) ?? "U"}
                    </div>
                    <span className="text-sm font-medium truncate">{review.user?.name ?? "Unknown"}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{review.user?.email}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3" /> Idea
                  </p>
                  <Link 
                    href={`/admin/ideas/${review.ideaId}`}
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    {review.idea?.title ?? "Unknown Idea"}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Submitted
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Review Content Column */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={cn(
                          "w-4 h-4",
                          s <= review.rating ? "text-primary fill-primary" : "text-muted-foreground/20"
                        )} 
                      />
                    ))}
                  </div>
                  <Badge variant="outline" className="bg-amber-500/5 text-amber-500 border-amber-500/20 text-[10px] uppercase">Pending</Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-bold">{review.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed italic">
                    "{review.body}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Pros</p>
                    <ul className="space-y-1">
                      {review.pros.map((p: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Cons</p>
                    <ul className="space-y-1">
                      {review.cons.map((c: string, i: number) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <X className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions Column */}
              <div className="lg:w-48 flex flex-col gap-2 shrink-0 justify-center">
                <Button 
                  className="w-full rounded-xl gap-2 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                  onClick={() => handleModerate(review._id, "approved")}
                  disabled={loadingId === review._id}
                >
                  <Check className="w-4 h-4" /> Approve
                </Button>
                <Button 
                  variant="outline"
                  className="w-full rounded-xl gap-2 border-rose-500/20 text-rose-500 hover:bg-rose-500/5"
                  onClick={() => handleModerate(review._id, "rejected")}
                  disabled={loadingId === review._id}
                >
                  <X className="w-4 h-4" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
