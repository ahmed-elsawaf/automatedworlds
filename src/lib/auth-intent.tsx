"use client";

/**
 * Auth Intent System
 * -----------------
 * Lets guests interact with gated actions (buy, save, etc.) without being
 * hard-blocked. When a guest triggers a gated action we:
 *   1. Store the intent in React state + sessionStorage (survives modal)
 *   2. Open the Clerk sign-in/sign-up modal
 *   3. After auth, AuthGateProvider reads the intent and resolves it
 */

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export type IntentAction =
  | "save_idea"
  | "unsave_idea"
  | "buy_code"
  | "buy_custom"
  | "join_waitlist";

export interface PendingIntent {
  action: IntentAction;
  ideaId?: string;
  ideaSlug?: string;
  /** Timestamp so stale intents can be cleared */
  ts: number;
}

interface AuthIntentContextValue {
  pendingIntent: PendingIntent | null;
  setPendingIntent: (intent: PendingIntent | null) => void;
  /** Record an intent — caller is responsible for opening the Clerk modal */
  recordIntent: (intent: Omit<PendingIntent, "ts">) => void;
  clearIntent: () => void;
}

/* ─── Storage helpers ────────────────────────────────────────────────────── */

const STORAGE_KEY = "aw_pending_intent";
const INTENT_TTL_MS = 10 * 60 * 1000; // 10 minutes

function readStoredIntent(): PendingIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: PendingIntent = JSON.parse(raw);
    // Discard stale intents
    if (Date.now() - parsed.ts > INTENT_TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredIntent(intent: PendingIntent | null) {
  if (typeof window === "undefined") return;
  if (intent === null) {
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  }
}

/* ─── Context ────────────────────────────────────────────────────────────── */

const AuthIntentContext = createContext<AuthIntentContextValue>({
  pendingIntent: null,
  setPendingIntent: () => {},
  recordIntent: () => {},
  clearIntent: () => {},
});

export function AuthIntentProvider({ children }: { children: React.ReactNode }) {
  const [pendingIntent, setPendingIntentState] = useState<PendingIntent | null>(
    () => readStoredIntent()
  );

  const setPendingIntent = useCallback((intent: PendingIntent | null) => {
    setPendingIntentState(intent);
    writeStoredIntent(intent);
  }, []);

  const recordIntent = useCallback(
    (intent: Omit<PendingIntent, "ts">) => {
      const full: PendingIntent = { ...intent, ts: Date.now() };
      setPendingIntent(full);
    },
    [setPendingIntent]
  );

  const clearIntent = useCallback(() => {
    setPendingIntent(null);
  }, [setPendingIntent]);

  return (
    <AuthIntentContext.Provider
      value={{ pendingIntent, setPendingIntent, recordIntent, clearIntent }}
    >
      {children}
    </AuthIntentContext.Provider>
  );
}

/* ─── Hook ───────────────────────────────────────────────────────────────── */

export function useAuthIntent() {
  return useContext(AuthIntentContext);
}

/**
 * Returns whether the current user is a guest (not signed in & Clerk loaded).
 * Useful for rendering auth-aware UI without needing the full intent context.
 */
export function useIsGuest() {
  const { isLoaded, isSignedIn } = useUser();
  return isLoaded && !isSignedIn;
}
