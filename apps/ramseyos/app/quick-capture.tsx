"use client";

import { useState, useRef, useEffect } from "react";
import { createCapture } from "@/lib/captures";

export function QuickCapture() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      await createCapture({ text: trimmed, source: "manual" });
      setText("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-muted">
          Parking lot
        </h2>
        {saved ? (
          <span className="text-[11px] text-emerald-400/70 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Captured → inbox
          </span>
        ) : (
          <span className="text-[10px] text-muted/25">→ inbox</span>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <span className="text-muted/50">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Capture a thought, task, or idea…"
          className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted/40 outline-none"
          disabled={saving}
        />
        {text.trim() && (
          <button
            type="submit"
            disabled={saving}
            className="text-[13px] font-medium text-accent hover:text-accent/80 transition-colors px-2 py-1 rounded-lg hover:bg-accent-dim"
          >
            {saving ? "…" : "Save"}
          </button>
        )}
      </form>
    </div>
  );
}
