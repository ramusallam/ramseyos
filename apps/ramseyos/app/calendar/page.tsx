"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { getCalendarEventsRange, type CalendarEvent } from "@/lib/calendar";
import { type Timestamp } from "firebase/firestore";
import Link from "next/link";

interface ConnectionStatus {
  connected: boolean;
  lastSyncedAt: string | null;
  email: string | null;
}

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  total: number;
  error?: string;
}

function formatTime(ts: Timestamp): string {
  return ts.toDate().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSyncTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getWeekDays(base: Date): Date[] {
  const start = new Date(base);
  start.setDate(start.getDate() - start.getDay()); // Sunday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function CalendarPage() {
  return (
    <Suspense>
      <CalendarContent />
    </Suspense>
  );
}

function CalendarContent() {
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("connected") === "true";
  const authError = searchParams.get("error");

  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const now = new Date();
  const baseDate = new Date(now);
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(baseDate);
  const weekStart = weekDays[0];
  const weekEnd = new Date(weekDays[6]);
  weekEnd.setHours(23, 59, 59, 999);

  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const loadData = useCallback(async () => {
    try {
      const [statusRes, evts] = await Promise.all([
        fetch("/api/calendar/status").then((r) => r.json()),
        getCalendarEventsRange(weekStart, weekEnd),
      ]);
      setStatus(statusRes);
      setEvents(evts);
    } catch (err) {
      console.error("Failed to load calendar data:", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (justConnected && status?.connected && !syncing) {
      handleSync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justConnected, status?.connected]);

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/calendar/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data);
      if (data.success) {
        const evts = await getCalendarEventsRange(weekStart, weekEnd);
        setEvents(evts);
        const statusRes = await fetch("/api/calendar/status").then((r) => r.json());
        setStatus(statusRes);
      }
    } catch {
      setSyncResult({ success: false, created: 0, updated: 0, total: 0, error: "Network error" });
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    await fetch("/api/calendar/disconnect", { method: "POST" });
    setStatus({ connected: false, lastSyncedAt: null, email: null });
    setSyncResult(null);
  }

  if (loading) {
    return (
      <div className="max-w-4xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading calendar…</span>
        </div>
      </div>
    );
  }

  // Group events by day
  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const evt of events) {
    const key = evt.startTime.toDate().toDateString();
    const arr = eventsByDay.get(key);
    if (arr) arr.push(evt);
    else eventsByDay.set(key, [evt]);
  }

  const isPast = (evt: CalendarEvent) => evt.endTime.toDate() < now;
  const isActive = (evt: CalendarEvent) =>
    evt.startTime.toDate() <= now && evt.endTime.toDate() > now;

  return (
    <div className="max-w-4xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-[20px] font-semibold text-foreground tracking-tight mt-2">
          Calendar
        </h1>

        {/* Week navigation */}
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w - 1)}
            className="text-[11px] text-muted hover:text-foreground transition-colors"
          >
            &larr; Prev
          </button>
          <span className="text-[13px] text-foreground font-medium">{weekLabel}</span>
          <button
            type="button"
            onClick={() => setWeekOffset((w) => w + 1)}
            className="text-[11px] text-muted hover:text-foreground transition-colors"
          >
            Next &rarr;
          </button>
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="text-[11px] text-accent hover:text-accent/80 transition-colors ml-2"
            >
              This week
            </button>
          )}
        </div>

        {/* Stats + links */}
        <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
          <span className="tabular-nums">{events.length} event{events.length !== 1 ? "s" : ""}</span>
          {status?.connected && (
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Google connected
            </span>
          )}
          <Link href="/week" className="text-muted hover:text-accent transition-colors ml-auto">
            Weekly plan &rarr;
          </Link>
        </div>
      </header>

      {/* Auth error */}
      {authError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-8">
          <p className="text-[13px] text-red-600">Connection failed: {authError}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* ── Google Calendar connection ── */}
        <section>
          <SectionHeader icon="M2 3h12v11H2zM2 7h12M5 1.5v3M11 1.5v3" label="Google Calendar">
            {status?.connected && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-500">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Connected
              </span>
            )}
          </SectionHeader>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            {status?.connected ? (
              <div className="flex items-center gap-3 flex-wrap">
                {status.email && (
                  <span className="text-[13px] text-foreground/70">{status.email}</span>
                )}
                {status.lastSyncedAt && (
                  <span className="text-[11px] text-muted">
                    Last synced: {formatSyncTime(status.lastSyncedAt)}
                  </span>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
                    className="inline-flex items-center gap-2 rounded-lg bg-accent-dim px-3 py-1.5 text-[11px] font-medium text-accent hover:bg-accent/15 transition-colors disabled:opacity-50"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={syncing ? "animate-spin" : ""}>
                      <path d="M2 8a6 6 0 0110.5-4M14 8a6 6 0 01-10.5 4" />
                      <path d="M14 2v4h-4M2 14v-4h4" />
                    </svg>
                    {syncing ? "Syncing…" : "Sync now"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-[11px] text-muted hover:text-red-500 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
                {syncResult && (
                  <div className={`w-full rounded-lg px-3 py-2 text-[11px] mt-1 ${
                    syncResult.success
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}>
                    {syncResult.success
                      ? `Synced ${syncResult.total} event${syncResult.total !== 1 ? "s" : ""} (${syncResult.created} new, ${syncResult.updated} updated)`
                      : `Sync failed: ${syncResult.error}`}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[13px] text-muted">
                  Connect Google Calendar to sync events into your daily plan.
                </p>
                <a
                  href="/api/calendar/auth"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent-dim px-4 py-2 text-[12px] font-medium text-accent hover:bg-accent/15 transition-colors"
                >
                  Connect Google Calendar
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ── Week Schedule ── */}
        <section>
          <SectionHeader icon="M8 4.5v3.5l2.5 1.5" label="Schedule" />

          <div className="space-y-1">
            {weekDays.map((day) => {
              const isToday = isSameDay(day, now);
              const dayEvents = eventsByDay.get(day.toDateString()) ?? [];
              const dayLabel = day.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={day.toDateString()}
                  className={`rounded-xl border px-4 py-3 transition-colors ${
                    isToday
                      ? "border-accent/20 bg-accent-dim/30"
                      : "border-border bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[12px] font-medium w-36 shrink-0 ${isToday ? "text-accent" : "text-foreground/70"}`}>
                      {dayLabel}
                      {isToday && <span className="ml-2 text-[9px] font-semibold uppercase text-accent">today</span>}
                    </span>
                    {dayEvents.length === 0 && (
                      <span className="text-[12px] text-muted/40">—</span>
                    )}
                  </div>

                  {dayEvents.length > 0 && (
                    <div className="ml-0 sm:ml-36 space-y-1 mt-1">
                      {dayEvents.map((evt) => (
                        <div
                          key={evt.id}
                          className={`flex items-center gap-2 text-[12px] rounded-lg px-2 py-1 ${
                            isActive(evt) ? "bg-emerald-50" : isPast(evt) ? "opacity-40" : ""
                          }`}
                        >
                          {isActive(evt) ? (
                            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          ) : (
                            <span className="size-1.5 rounded-full bg-sky-400 shrink-0" />
                          )}
                          <span className="text-muted tabular-nums shrink-0 w-28">
                            {formatTime(evt.startTime)} – {formatTime(evt.endTime)}
                          </span>
                          <span className={`flex-1 truncate ${isActive(evt) ? "text-emerald-700 font-medium" : "text-foreground/80"}`}>
                            {evt.title}
                          </span>
                          {isActive(evt) && (
                            <span className="text-[9px] font-semibold uppercase text-emerald-500 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                              now
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
        <path d={icon} />
      </svg>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</h2>
      {children}
      <div className="flex-1 border-t border-border" />
    </div>
  );
}
