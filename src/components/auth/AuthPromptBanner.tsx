"use client";

/**
 * AuthPromptBanner
 * ----------------
 * A sleek, glassmorphic inline banner that appears when a guest
 * attempts a gated action. It gives context ("Sign up to save this idea")
 * and fires the Clerk modal with the intent pre-recorded.
 *
 * Usage:
 *   <AuthPromptBanner
 *     action="save_idea"
 *     ideaId={idea._id}
 *     ideaSlug={idea.slug}
 *     label="Sign up to save this idea"
 *   />
 */

import { useRef } from "react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useAuthIntent, type IntentAction } from "@/lib/auth-intent";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthPromptBannerProps {
  action: IntentAction;
  ideaId?: string;
  ideaSlug?: string;
  label?: string;
  compact?: boolean;
  className?: string;
  onDismiss?: () => void;
}

export function AuthPromptBanner({
  action,
  ideaId,
  ideaSlug,
  label = "Sign up free to unlock this",
  compact = false,
  className,
  onDismiss,
}: AuthPromptBannerProps) {
  const { recordIntent } = useAuthIntent();
  const signUpRef = useRef<HTMLButtonElement>(null);
  const signInRef = useRef<HTMLButtonElement>(null);

  function handleRecord() {
    recordIntent({ action, ideaId, ideaSlug });
  }

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl",
          "bg-primary/8 border border-primary/20",
          "text-xs text-muted-foreground",
          className
        )}
      >
        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="flex-1">{label}</span>
        <SignUpButton mode="modal">
          <button
            onClick={handleRecord}
            className="text-primary font-semibold hover:underline whitespace-nowrap"
          >
            Sign up free →
          </button>
        </SignUpButton>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-primary/25 overflow-hidden",
        "bg-linear-to-br from-primary/8 via-primary/5 to-brand-cyan/5",
        "p-5 space-y-3",
        className
      )}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/10 blur-2xl" />
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="relative flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg brand-gradient flex items-center justify-center shrink-0 shadow-sm">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm leading-snug">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Free account · Takes 10 seconds
          </p>
        </div>
      </div>

      <div className="relative flex items-center gap-2">
        <SignUpButton mode="modal">
          <Button
            ref={signUpRef}
            size="sm"
            className="flex-1 rounded-xl gap-1.5 brand-gradient border-0 hover:opacity-90 text-white font-semibold"
            onClick={handleRecord}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Get Started Free
          </Button>
        </SignUpButton>
        <SignInButton mode="modal">
          <Button
            ref={signInRef}
            size="sm"
            variant="outline"
            className="rounded-xl border-border/60 hover:border-primary/40"
            onClick={handleRecord}
          >
            Sign in
          </Button>
        </SignInButton>
      </div>
    </div>
  );
}
