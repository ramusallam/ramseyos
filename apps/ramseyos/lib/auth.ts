"use client";

import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "./firebase";

const ALLOWED_EMAIL = process.env.NEXT_PUBLIC_ALLOWED_EMAIL ?? "";

export type AuthStatus = "loading" | "signed-out" | "unauthorized" | "ready";

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();

    // Check for redirect result (fallback flow)
    getRedirectResult(auth).catch(() => {});

    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setUser(null);
        setStatus("signed-out");
        return;
      }
      if (ALLOWED_EMAIL && u.email !== ALLOWED_EMAIL) {
        firebaseSignOut(auth);
        setUser(null);
        setStatus("unauthorized");
        return;
      }
      setError(null);
      setUser(u);
      setStatus("ready");
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    setError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      const msg = (err as { message?: string })?.message ?? "Sign-in failed";
      console.error("Auth error:", code, msg);

      // If popup blocked or unauthorized origin, try redirect flow
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-browser" ||
        code === "auth/unauthorized-domain"
      ) {
        if (code === "auth/unauthorized-domain") {
          setError(
            "This domain is not authorized in Firebase. Add it in the Firebase Console under Authentication → Settings → Authorized domains."
          );
        } else {
          // Try redirect as fallback
          try {
            await signInWithRedirect(auth, provider);
          } catch {
            setError("Sign-in failed. Please allow popups for this site.");
          }
        }
      } else if (code === "auth/cancelled-popup-request" || code === "auth/user-cancelled") {
        // User intentionally cancelled — no error
      } else {
        setError(msg);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
  }, []);

  return { status, user, error, signIn, signOut };
}
