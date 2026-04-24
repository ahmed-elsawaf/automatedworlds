"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useState } from "react";

/**
 * Headless component that synchronizes the authenticated Clerk user
 * with the Convex database as soon as the session is loaded.
 */
export function SyncUserWithConvex() {
  const { user, isLoaded, isSignedIn } = useUser();
  const storeUser = useMutation(api.users.storeUser);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user && !synced) {
      // Small delay to ensure any transient Clerk states settle
      const timer = setTimeout(async () => {
        try {
          await storeUser({
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName || undefined,
            profileImageUrl: user.imageUrl || undefined,
          });
          setSynced(true);
        } catch (error) {
          console.error("Failed to sync user with Convex:", error);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoaded, isSignedIn, user, storeUser, synced]);

  return null;
}
