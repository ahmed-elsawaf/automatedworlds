"use client";

/**
 * AuthGateProvider
 * ----------------
 * Watches Clerk's `isSignedIn` status. When it transitions false → true
 * (i.e. the user just authenticated), it reads the pending intent from
 * the AuthIntentContext and resolves it:
 *
 *  - "save_idea"   → fires the saveIdea Convex mutation
 *  - "buy_*"       → scrolls to #purchase-panel and highlights the option
 *  - Everything    → shows a contextual toast
 */

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useAuthIntent } from "@/lib/auth-intent";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function scrollToPurchasePanel(highlight?: "buy_code" | "buy_custom" | "buy_exclusive") {
  const panel = document.getElementById("purchase-panel");
  if (!panel) return;
  panel.scrollIntoView({ behavior: "smooth", block: "center" });

  if (highlight) {
    const targetId = {
      buy_code: "purchase-option-code",
      buy_custom: "purchase-option-custom",
      buy_exclusive: "purchase-option-exclusive",
    }[highlight];
    const el = document.getElementById(targetId);
    if (el) {
      el.classList.add("intent-highlight");
      setTimeout(() => el.classList.remove("intent-highlight"), 2500);
    }
  }
}

/* ─── Provider ───────────────────────────────────────────────────────────── */

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const { pendingIntent, clearIntent } = useAuthIntent();

  // Track the previous signed-in state so we only fire on the transition
  const prevSignedIn = useRef<boolean | null>(null);

  const saveIdea = useMutation(api.ideas.saveIdea);

  useEffect(() => {
    if (!isLoaded) return;

    const justSignedIn =
      prevSignedIn.current === false && isSignedIn === true;

    prevSignedIn.current = isSignedIn ?? false;

    if (!justSignedIn) return;
    if (!pendingIntent) {
      // No pending intent — just welcome the new user
      return;
    }

    const intent = pendingIntent;
    clearIntent();

    // Small delay so the modal close animation finishes first
    setTimeout(async () => {
      switch (intent.action) {
        case "save_idea": {
          if (!intent.ideaId) break;
          try {
            await saveIdea({ ideaId: intent.ideaId as Id<"ideas"> });
            toast.success("Idea saved! ✅", {
              description: "You can find it in your dashboard.",
            });
          } catch {
            toast.error("Couldn't auto-save — please try again.");
          }
          break;
        }

        case "buy_code": {
          toast.success("Welcome! 🎉", {
            description: "You're ready to purchase. Select an option below.",
          });
          scrollToPurchasePanel("buy_code");
          break;
        }

        case "buy_custom": {
          toast.success("Welcome! 🎉", {
            description: "Ready to request a custom build.",
          });
          scrollToPurchasePanel("buy_custom");
          break;
        }

        case "buy_exclusive": {
          toast.success("Welcome! 🎉", {
            description: "Ready to claim the exclusive license.",
          });
          scrollToPurchasePanel("buy_exclusive");
          break;
        }

        case "join_waitlist": {
          toast.success("You're signed in! 🎉", {
            description: "You can now join the waitlist.",
          });
          scrollToPurchasePanel();
          break;
        }

        default:
          break;
      }
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isLoaded]);

  return <>{children}</>;
}
