"use client";

import { useState } from "react";
import { createCapture } from "@/lib/captures";

export function QuickCapture() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      await createCapture({ text: trimmed, source: "manual" });
      setText("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Parking lot
        </h2>
        <span className="text-[10px] text-muted/40">quick capture</span>
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <span className="text-sm text-muted">+</span>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Capture a thought, task, or idea..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/50 outline-none"
          disabled={saving}
        />
        {text.trim() && (
          <button
            type="submit"
            disabled={saving}
            className="text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
          >
            {saving ? "..." : "Save"}
          </button>
        )}
      </form>
    </div>
  );
}
