"use client";

import { useRef, useState } from "react";
import { createCapture } from "@/lib/captures";
import { createTask } from "@/lib/tasks";

type CaptureMode = "capture" | "task";

export function QuickCaptureBar() {
  const [value, setValue] = useState("");
  const [mode, setMode] = useState<CaptureMode>("capture");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    const text = value.trim();
    if (!text || saving) return;

    setSaving(true);
    try {
      if (mode === "task") {
        await createTask({ title: text });
        setFlash("Task added");
      } else {
        await createCapture({ text, source: "manual" });
        setFlash("Captured");
      }
      setValue("");
      setTimeout(() => setFlash(null), 1500);
    } catch (err) {
      console.error("Quick capture error:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    // Tab to toggle mode
    if (e.key === "Tab") {
      e.preventDefault();
      setMode((m) => (m === "capture" ? "task" : "capture"));
    }
  }

  return (
    <div className="relative flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 shadow-card transition-all focus-within:border-accent/30 focus-within:shadow-[0_0_0_3px_rgba(230,126,34,0.06)]">
      {/* Mode indicator */}
      <button
        type="button"
        onClick={() => setMode((m) => (m === "capture" ? "task" : "capture"))}
        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md transition-colors shrink-0 ${
          mode === "task"
            ? "bg-accent-dim text-accent"
            : "bg-surface-raised text-muted"
        }`}
        title="Tab to toggle mode"
      >
        {mode === "task" ? "task" : "capture"}
      </button>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={mode === "task" ? "Add a task…" : "Quick capture…"}
        className="flex-1 text-[14px] text-foreground bg-transparent outline-none placeholder:text-muted/40"
        disabled={saving}
      />

      {/* Flash confirmation */}
      {flash && (
        <span className="text-[11px] text-emerald-500 font-medium animate-pulse shrink-0">
          {flash} ✓
        </span>
      )}

      {/* Submit hint */}
      {value.trim() && !flash && (
        <span className="text-[10px] text-muted shrink-0">
          ↵ enter
        </span>
      )}

      {/* Keyboard hint when empty */}
      {!value && !flash && (
        <span className="text-[10px] text-muted/40 shrink-0">
          tab to switch
        </span>
      )}
    </div>
  );
}
