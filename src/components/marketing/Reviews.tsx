"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUser, SignInButton } from "@clerk/nextjs";
import { 
  Star, ThumbsUp, ThumbsDown, MessageSquare, 
  Plus, CheckCircle2, AlertCircle, Loader2,
  Lock, BadgeCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ReviewsProps {
  ideaId: Id<"ideas">;
}

export function Reviews({ ideaId }: ReviewsProps) {
  const { isSignedIn, isLoaded } = useUser();
  const reviews = useQuery(api.reviews.getIdeaReviews, {
    ideaId,
    paginationOpts: { numItems: 10, cursor: null },
  });
  
  const eligibleOrderId = useQuery(api.reviews.getEligibleOrder, { ideaId });
  const hasReviewed = useQuery(api.reviews.hasReviewed, { ideaId });
  const voteMutation = useMutation(api.reviews.voteOnReview);

  const [isVoteLoading, setIsVoteLoading] = useState<string | null>(null);

  const handleVote = async (reviewId: Id<"reviews">, vote: "helpful" | "not_helpful") => {
    if (!isSignedIn) {
      toast.error("Please sign in to vote on reviews.");
      return;
    }
    setIsVoteLoading(reviewId);
    try {
      await voteMutation({ reviewId, vote });
    } catch (error) {
      toast.error("Failed to record your vote.");
    } finally {
      setIsVoteLoading(null);
    }
  };

  return (
    <section id="reviews" className="space-y-8 py-12 border-t border-border/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="w-6 h-6 text-primary fill-primary" />
            Discussion & Reviews
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Share your thoughts or read feedback from verified buyers.
          </p>
        </div>

        {!isLoaded ? (
          <div className="h-11 w-32 bg-muted animate-pulse rounded-xl" />
        ) : !isSignedIn ? (
          <SignInButton mode="modal">
            <Button className="rounded-xl gap-2 h-11 px-6 bg-muted hover:bg-muted/80 text-foreground border border-border/60">
              <Lock className="w-4 h-4" /> Sign in to comment
            </Button>
          </SignInButton>
        ) : hasReviewed ? (
          <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> You've shared your feedback
          </div>
        ) : (
          <ReviewFormDialog ideaId={ideaId} orderId={eligibleOrderId ?? undefined} />
        )}
      </div>

      {!reviews ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse border border-border/60" />
          ))}
        </div>
      ) : reviews.page.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-border/60 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-1">No comments yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Be the first to share your experience with this SaaS idea and help others make a decision.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.page.map((review) => (
            <div 
              key={review._id} 
              className="p-6 rounded-2xl border border-border/60 bg-card hover:border-primary/20 transition-all group flex flex-col gap-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9 border border-border/60">
                    <AvatarImage src={review.author?.avatarUrl} />
                    <AvatarFallback>{review.author?.name?.charAt(0) ?? "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{review.author?.name ?? "User"}</span>
                      {review.orderId && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-[9px] font-bold text-emerald-500 uppercase tracking-tight border border-emerald-500/20">
                          <BadgeCheck className="w-2.5 h-2.5" /> Verified
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                      {formatDistanceToNow(review.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={cn(
                        "w-3.5 h-3.5",
                        s <= review.rating ? "text-primary fill-primary" : "text-muted-foreground/20"
                      )} 
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2 flex-1">
                {review.title && <h4 className="font-bold text-sm leading-tight">{review.title}</h4>}
                {review.body && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                    {review.body}
                  </p>
                )}
              </div>

              {/* Pros / Cons */}
              {(review.pros.length > 0 || review.cons.length > 0) && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/40">
                  {review.pros.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Pros</p>
                      <ul className="space-y-1">
                        {review.pros.slice(0, 2).map((p, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="line-clamp-1">{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {review.cons.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Cons</p>
                      <ul className="space-y-1">
                        {review.cons.slice(0, 2).map((c, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <AlertCircle className="w-3 h-3 text-rose-500 mt-0.5 shrink-0" />
                            <span className="line-clamp-1">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Footer / Votes */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2.5 rounded-lg text-xs gap-1.5 transition-colors",
                      review.myVote === "helpful" 
                        ? "bg-primary/10 text-primary hover:bg-primary/20" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => handleVote(review._id, "helpful")}
                    disabled={isVoteLoading === review._id}
                  >
                    {isVoteLoading === review._id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ThumbsUp className={cn("w-3.5 h-3.5", review.myVote === "helpful" && "fill-primary")} />
                    )}
                    {review.helpfulCount}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2.5 rounded-lg text-xs gap-1.5 transition-colors",
                      review.myVote === "not_helpful" 
                        ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => handleVote(review._id, "not_helpful")}
                    disabled={isVoteLoading === review._id}
                  >
                    <ThumbsDown className={cn("w-3.5 h-3.5", review.myVote === "not_helpful" && "fill-rose-500")} />
                    {review.notHelpfulCount}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewFormDialog({ ideaId, orderId }: { ideaId: Id<"ideas">, orderId?: Id<"orders"> }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pro, setPro] = useState("");
  const [con, setCon] = useState("");
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useMutation(api.reviews.createReview);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createMutation({
        ideaId,
        orderId,
        rating,
        title: title || undefined,
        body: body || undefined,
        pros,
        cons,
      });
      toast.success("Feedback submitted! It will appear after moderation.");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addPro = () => {
    if (pro.trim() && !pros.includes(pro.trim())) {
      setPros([...pros, pro.trim()]);
      setPro("");
    }
  };

  const addCon = () => {
    if (con.trim() && !cons.includes(con.trim())) {
      setCons([...cons, con.trim()]);
      setCon("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl gap-2 h-11 px-6 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Share Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl p-0 overflow-hidden border-border/60">
        <DialogHeader className="p-6 bg-muted/30 border-b border-border/60">
          <DialogTitle className="text-xl">Share your thoughts</DialogTitle>
          <DialogDescription>
            Join the discussion or leave a review. Feedback is moderated for community quality.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Rating */}
          <div className="space-y-3">
            <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="hover:scale-110 transition-transform p-1"
                >
                  <Star 
                    className={cn(
                      "w-8 h-8",
                      s <= rating ? "text-primary fill-primary" : "text-muted-foreground/20"
                    )} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Headline</label>
              <Input 
                placeholder="Summarize your comment or review..." 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="rounded-xl bg-muted/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Comment</label>
              <Textarea 
                placeholder="What's on your mind regarding this idea?" 
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={4}
                className="rounded-xl bg-muted/30 resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-500 uppercase">Pros / Benefits</label>
              <div className="flex gap-1.5">
                <Input 
                  placeholder="e.g. Great niche" 
                  value={pro}
                  onChange={e => setPro(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addPro())}
                  className="h-8 text-xs rounded-lg bg-muted/30"
                />
                <Button type="button" size="icon" variant="ghost" onClick={addPro} className="h-8 w-8 shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {pros.map(p => (
                  <span key={p} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-medium flex items-center gap-1">
                    {p}
                    <button type="button" onClick={() => setPros(pros.filter(x => x !== p))} className="hover:text-emerald-700">×</button>
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-rose-500 uppercase">Cons / Risks</label>
              <div className="flex gap-1.5">
                <Input 
                  placeholder="e.g. High churn" 
                  value={con}
                  onChange={e => setCon(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCon())}
                  className="h-8 text-xs rounded-lg bg-muted/30"
                />
                <Button type="button" size="icon" variant="ghost" onClick={addCon} className="h-8 w-8 shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {cons.map(c => (
                  <span key={c} className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[10px] font-medium flex items-center gap-1">
                    {c}
                    <button type="button" onClick={() => setCons(cons.filter(x => x !== c))} className="hover:text-rose-700">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full rounded-xl h-12 gap-2 text-base font-semibold shadow-lg shadow-primary/20"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Feedback"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
