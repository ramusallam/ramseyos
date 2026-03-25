"use client";

import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
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
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const auth = getFirebaseAuth();
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
      setUser(u);
      setStatus("ready");
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(auth, provider);
    } catch {
      // User closed popup or network error — no-op, status stays signed-out
    }
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
  }, []);

  return { status, user, signIn, signOut };
}
