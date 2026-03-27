"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ── localStorage persistence ── */

const TIMER_KEY = "ramseyos:focus-timer";

interface TimerState {
  running: boolean;
  startedAt: number | null; // epoch ms when timer was started/resumed
  elapsed: number; // accumulated ms before current run
  label: string;
}

const EMPTY: TimerState = { running: false, startedAt: null, elapsed: 0, label: "" };

function loadTimer(): TimerState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

function saveTimer(state: TimerState) {
  localStorage.setItem(TIMER_KEY, JSON.stringify(state));
}

/* ── Hook ── */

export function useFocusTimer() {
  const [state, setState] = useState<TimerState>(EMPTY);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [displayMs, setDisplayMs] = useState(0);

  // Load on mount
  useEffect(() => {
    const saved = loadTimer();
    setState(saved);
  }, []);

  // Tick every second when running
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (state.running && state.startedAt) {
      const tick = () => {
        const now = Date.now();
        setDisplayMs(state.elapsed + (now - state.startedAt!));
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setDisplayMs(state.elapsed);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.running, state.startedAt, state.elapsed]);

  const start = useCallback((label?: string) => {
    const next: TimerState = {
      running: true,
      startedAt: Date.now(),
      elapsed: 0,
      label: label ?? "",
    };
    setState(next);
    saveTimer(next);
  }, []);

  const pause = useCallback(() => {
    setState((prev) => {
      const now = Date.now();
      const totalElapsed = prev.elapsed + (prev.startedAt ? now - prev.startedAt : 0);
      const next: TimerState = { ...prev, running: false, startedAt: null, elapsed: totalElapsed };
      saveTimer(next);
      return next;
    });
  }, []);

  const resume = useCallback(() => {
    setState((prev) => {
      const next: TimerState = { ...prev, running: true, startedAt: Date.now() };
      saveTimer(next);
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    setState(EMPTY);
    saveTimer(EMPTY);
    setDisplayMs(0);
  }, []);

  return {
    isActive: state.running || state.elapsed > 0,
    isRunning: state.running,
    label: state.label,
    displayMs,
    start,
    pause,
    resume,
    stop,
  };
}

/* ── Format ── */

function formatElapsed(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/* ── Shell indicator (compact, for sidebar footer) ── */

export function FocusTimerIndicator({
  isActive,
  isRunning,
  label,
  displayMs,
  onPause,
  onResume,
  onStop,
}: {
  isActive: boolean;
  isRunning: boolean;
  label: string;
  displayMs: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}) {
  if (!isActive) return null;

  return (
    <div className="px-4 py-2.5 border-t border-border bg-accent/[0.04]">
      <div className="flex items-center gap-2">
        {/* Pulsing dot */}
        <span className={`size-2 rounded-full shrink-0 ${isRunning ? "bg-accent animate-pulse" : "bg-amber-400"}`} />

        {/* Timer display */}
        <span className="text-[13px] font-mono font-semibold text-foreground tabular-nums">
          {formatElapsed(displayMs)}
        </span>

        {label && (
          <span className="text-[10px] text-muted truncate flex-1">
            {label}
          </span>
        )}

        {!label && <span className="flex-1" />}

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {isRunning ? (
            <button
              type="button"
              onClick={onPause}
              className="text-muted hover:text-foreground transition-colors p-0.5"
              aria-label="Pause timer"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <rect x="4" y="3" width="3" height="10" rx="0.5" />
                <rect x="9" y="3" width="3" height="10" rx="0.5" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={onResume}
              className="text-accent hover:text-accent/80 transition-colors p-0.5"
              aria-label="Resume timer"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2.5l9 5.5-9 5.5V2.5z" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onStop}
            className="text-muted hover:text-red-500 transition-colors p-0.5"
            aria-label="Stop timer"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="3" width="10" height="10" rx="1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Start button (for dashboard / Now card) ── */

export function FocusTimerStartButton({
  label,
  onStart,
  isActive,
}: {
  label?: string;
  onStart: (label?: string) => void;
  isActive: boolean;
}) {
  if (isActive) return null;

  return (
    <button
      type="button"
      onClick={() => onStart(label)}
      className="inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-accent transition-colors"
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v3.5l2 1.5" />
      </svg>
      Focus
    </button>
  );
}
