"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

/* ── Types ── */

interface ConnectionStatus {
  connected: boolean;
  lastSyncedAt: string | null;
  email: string | null;
}

/* ── Page ── */

export default function SettingsPage() {
  const { user, status: authStatus } = useAuth();
  const [gcalStatus, setGcalStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/calendar/status")
      .then((r) => r.json())
      .then((data) => {
        setGcalStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || authStatus === "loading") {
    return (
      <div className="max-w-3xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted/40">Loading settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-xl font-normal text-foreground tracking-tight mt-2">
          Settings
        </h1>
        <p className="text-[13px] text-muted/50 mt-1">
          Preferences, integrations, and system info.
        </p>

        {/* Cross-links */}
        <div className="flex items-center gap-3 mt-3">
          <Link href="/calendar" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Calendar &rarr;
          </Link>
          <Link href="/tools" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Tools &rarr;
          </Link>
          <Link href="/admin" className="text-[11px] text-muted/35 hover:text-muted/60 transition-colors">
            Admin &rarr;
          </Link>
        </div>
      </header>

      <div className="space-y-8">
        {/* ── Account ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
              <circle cx="8" cy="6" r="3" />
              <path d="M2.5 14a5.5 5.5 0 0111 0" />
            </svg>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Account
            </h2>
            <div className="flex-1 border-t border-border/40" />
          </div>

          <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-5">
            <div className="flex items-center gap-4">
              {user?.photoURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt=""
                  className="size-10 rounded-full border border-border/50"
                />
              )}
              <div className="min-w-0">
                <p className="text-[13px] text-foreground/80 truncate">
                  {user?.displayName ?? "User"}
                </p>
                <p className="text-[11px] text-muted/50 truncate">
                  {user?.email}
                </p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-emerald-400/70">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Authenticated
              </span>
            </div>
          </div>
        </section>

        {/* ── Integrations ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
              <path d="M6 3H3v3M10 3h3v3M6 13H3v-3M10 13h3v-3" />
            </svg>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Integrations
            </h2>
            <span className="text-[10px] text-muted/40 tabular-nums">
              {gcalStatus?.connected ? 1 : 0} active
            </span>
            <div className="flex-1 border-t border-border/40" />
          </div>

          <div className="space-y-2">
            {/* Google Calendar */}
            <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-4 flex items-center gap-4">
              <div className="size-8 rounded-lg border border-border/50 bg-white/5 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/60">
                  <rect x="2" y="3" width="12" height="11" rx="2" />
                  <path d="M2 7h12M5 1.5v3M11 1.5v3" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-foreground/80">Google Calendar</p>
                <p className="text-[11px] text-muted/40">
                  {gcalStatus?.connected
                    ? gcalStatus.email ?? "Connected"
                    : "Not connected"}
                </p>
              </div>
              {gcalStatus?.connected ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400/70">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              ) : (
                <Link
                  href="/calendar"
                  className="text-[11px] text-accent hover:text-accent/80 transition-colors"
                >
                  Connect &rarr;
                </Link>
              )}
            </div>

            {/* Firebase */}
            <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-4 flex items-center gap-4">
              <div className="size-8 rounded-lg border border-border/50 bg-white/5 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/60">
                  <path d="M8 2l5 10H3L8 2z" />
                  <path d="M8 6v3M8 11.5v.5" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-foreground/80">Firebase</p>
                <p className="text-[11px] text-muted/40">Auth, Firestore, Storage</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400/70">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>

            {/* Vercel */}
            <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-4 flex items-center gap-4">
              <div className="size-8 rounded-lg border border-border/50 bg-white/5 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/60">
                  <path d="M8 3l6 10H2L8 3z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-foreground/80">Vercel</p>
                <p className="text-[11px] text-muted/40">Hosting &amp; deployment</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400/70">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Active
              </span>
            </div>
          </div>
        </section>

        {/* ── Dashboard Preferences ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
              <rect x="2" y="2" width="5" height="5" rx="1" />
              <rect x="9" y="2" width="5" height="5" rx="1" />
              <rect x="2" y="9" width="5" height="5" rx="1" />
              <rect x="9" y="9" width="5" height="5" rx="1" />
            </svg>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Dashboard
            </h2>
            <div className="flex-1 border-t border-border/40" />
          </div>

          <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-foreground/80">Daily Card</p>
                <p className="text-[11px] text-muted/40">Show the Daily Card on the Today dashboard</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400/70">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                On
              </span>
            </div>
            <div className="border-t border-border/30" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-foreground/80">Life Context</p>
                <p className="text-[11px] text-muted/40">Include life &amp; admin items in daily context</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400/70">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                On
              </span>
            </div>
            <div className="border-t border-border/30" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-foreground/80">Auto-sync Calendar</p>
                <p className="text-[11px] text-muted/40">Sync events when you open the dashboard</p>
              </div>
              <span className="text-[10px] text-muted/40">Off</span>
            </div>
          </div>
        </section>

        {/* ── System ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3M8 10.5v.5" />
            </svg>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              System
            </h2>
            <div className="flex-1 border-t border-border/40" />
          </div>

          <div className="rounded-xl border border-border/50 bg-surface/50 backdrop-blur-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted/50">Version</span>
              <span className="text-[12px] text-foreground/60 tabular-nums">0.1.0-alpha</span>
            </div>
            <div className="border-t border-border/30" />
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted/50">Platform</span>
              <span className="text-[12px] text-foreground/60">Web</span>
            </div>
            <div className="border-t border-border/30" />
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted/50">Runtime</span>
              <span className="text-[12px] text-foreground/60">Next.js + Vercel</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
