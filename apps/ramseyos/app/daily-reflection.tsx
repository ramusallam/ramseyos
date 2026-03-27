"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getTodayReflection,
  createReflection,
  type Reflection,
} from "@/lib/reflections";

const MOODS: { value: Reflection["mood"]; emoji: string; label: string }[] = [
  { value: "great", emoji: "\u2728", label: "Great" },
  { value: "good", emoji: "\u2600\uFE0F", label: "Good" },
  { value: "okay", emoji: "\u2601\uFE0F", label: "Okay" },
  { value: "rough", emoji: "\uD83C\uDF27\uFE0F", label: "Rough" },
];

export function DailyReflection() {
  const [existing, setExisting] = useState<Reflection | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [wins, setWins] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [mood, setMood] = useState<Reflection["mood"]>("good");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getTodayReflection().then((r) => {
      setExisting(r);
      setLoading(false);
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!wins.trim() && !tomorrow.trim()) return;
    setSaving(true);
    try {
      await createReflection({ wins: wins.trim(), tomorrow: tomorrow.trim(), mood });
      setSaved(true);
      setExpanded(false);
    } finally {
      setSaving(false);
    }
  }, [wins, tomorrow, mood]);

  // Don't show before 3pm
  const hour = new Date().getHours();
  if (hour < 15) return null;

  if (loading) return null;

  // Already reflected today
  if (existing || saved) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
            <path d="M8 2v1M8 13v1M3 8H2M14 8h-1M4.5 4.5l.7.7M11.5 11.5l-.7-.7M4.5 11.5l.7-.7M11.5 4.5l-.7.7" />
            <circle cx="8" cy="8" r="3" />
          </svg>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Today&apos;s reflection
          </h3>
          <div className="flex-1 border-t border-border" />
        </div>
        <div className="space-y-2">
          {(existing?.wins || saved) && (
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wide">Wins</p>
              <p className="text-[13px] text-foreground/80">{existing?.wins || wins}</p>
            </div>
          )}
          {(existing?.tomorrow || saved) && (
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wide">Tomorrow</p>
              <p className="text-[13px] text-foreground/80">{existing?.tomorrow || tomorrow}</p>
            </div>
          )}
          <p className="text-[10px] text-muted">
            Mood: {MOODS.find((m) => m.value === (existing?.mood || mood))?.label ?? "—"}
          </p>
        </div>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full rounded-xl border border-dashed border-border bg-surface/50 p-5 text-center hover:border-accent/30 hover:bg-surface transition-all group"
      >
        <p className="text-[13px] text-muted group-hover:text-foreground/70 transition-colors">
          End of day? Take a moment to reflect.
        </p>
        <p className="text-[11px] text-muted/50 mt-1">
          What went well · What&apos;s tomorrow
        </p>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-accent/15 bg-surface p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <path d="M8 2v1M8 13v1M3 8H2M14 8h-1M4.5 4.5l.7.7M11.5 11.5l-.7-.7M4.5 11.5l.7-.7M11.5 4.5l-.7.7" />
          <circle cx="8" cy="8" r="3" />
        </svg>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-accent/70">
          Daily reflection
        </h3>
        <div className="flex-1 border-t border-border" />
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-[11px] text-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-3">
        {/* Mood */}
        <div>
          <p className="text-[11px] text-muted mb-1.5">How was today?</p>
          <div className="flex gap-1.5">
            {MOODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value)}
                className={`px-3 py-1.5 rounded-lg text-[12px] transition-colors ${
                  mood === m.value
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "bg-surface-raised text-muted border border-border hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Wins */}
        <div>
          <label className="text-[11px] text-muted block mb-1">What went well?</label>
          <textarea
            value={wins}
            onChange={(e) => setWins(e.target.value)}
            placeholder="Wins, progress, good moments..."
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/30 resize-none"
          />
        </div>

        {/* Tomorrow */}
        <div>
          <label className="text-[11px] text-muted block mb-1">What&apos;s the focus for tomorrow?</label>
          <textarea
            value={tomorrow}
            onChange={(e) => setTomorrow(e.target.value)}
            placeholder="Top priority, carry-forward, mindset..."
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/30 resize-none"
          />
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || (!wins.trim() && !tomorrow.trim())}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[12px] font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save reflection"}
          </button>
        </div>
      </div>
    </div>
  );
}
