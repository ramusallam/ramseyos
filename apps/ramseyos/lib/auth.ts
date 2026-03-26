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
  signingIn: boolean;
  signIn: () => Promise<void>;
  signInRedirect: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();

    // Check for redirect result (fallback flow)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // Redirect sign-in succeeded — onAuthStateChanged will handle it
        }
      })
      .catch((err) => {
        console.error("Redirect result error:", err);
        setError("Sign-in redirect failed. Please try again.");
        setSigningIn(false);
      });

    const unsub = onAuthStateChanged(auth, (u) => {
      setSigningIn(false);
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
    setSigningIn(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      setSigningIn(false);
      const code = (err as { code?: string })?.code ?? "";
      const msg = (err as { message?: string })?.message ?? "Sign-in failed";
      console.error("Auth popup error:", code, msg);

      if (code === "auth/unauthorized-domain") {
        setError(
          "This domain is not authorized in Firebase. Add it under Authentication → Settings → Authorized domains."
        );
      } else if (code === "auth/popup-blocked") {
        setError("Popup was blocked. Try the redirect sign-in below, or allow popups for this site.");
      } else if (
        code === "auth/popup-closed-by-browser" ||
        code === "auth/cancelled-popup-request" ||
        code === "auth/user-cancelled"
      ) {
        // User closed — no error needed
      } else {
        setError(`Sign-in failed: ${code || msg}`);
      }
    }
  }, []);

  const signInRedirect = useCallback(async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    setError(null);
    setSigningIn(true);
    try {
      await signInWithRedirect(auth, provider);
    } catch (err: unknown) {
      setSigningIn(false);
      const msg = (err as { message?: string })?.message ?? "Redirect failed";
      setError(msg);
    }
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
  }, []);

  return { status, user, error, signingIn, signIn, signInRedirect, signOut };
}
