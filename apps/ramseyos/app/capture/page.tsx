"use client";

import { useState, useRef, useEffect } from "react";
import { createCapture, type CaptureType } from "@/lib/captures";
import Link from "next/link";

const TYPE_HINTS: { value: CaptureType; label: string }[] = [
  { value: "capture", label: "Anything" },
  { value: "task", label: "Task" },
  { value: "idea", label: "Idea" },
  { value: "note", label: "Note" },
];

export default function CapturePage() {
  const [text, setText] = useState("");
  const [typeHint, setTypeHint] = useState<CaptureType>("capture");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      await createCapture({
        text: trimmed,
        source: "mobile",
        type: typeHint,
      });
      setText("");
      setTypeHint("capture");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      inputRef.current?.focus();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col pt-safe-top pb-safe-bottom bg-background">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent/60">
            RamseyOS
          </p>
          <h1 className="text-[20px] font-semibold text-foreground mt-1">
            Capture
          </h1>
        </div>
        <Link
          href="/inbox"
          className="flex items-center gap-1.5 text-[12px] text-muted/50 hover:text-foreground transition-colors px-3 py-2 rounded-xl hover:bg-surface-raised active:scale-95"
        >
          Inbox
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4l4 4-4 4" />
          </svg>
        </Link>
      </header>

      {/* Capture form */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col px-5 pb-6"
      >
        <div className="flex-1 flex flex-col">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="What's on your mind?"
            rows={4}
            className="w-full flex-1 min-h-[120px] max-h-[50vh] resize-none bg-surface rounded-xl border border-border px-5 py-4 text-[16px] leading-relaxed text-foreground placeholder:text-muted outline-none focus:border-accent/30 transition-colors backdrop-blur-sm"
            disabled={saving}
          />

          {/* Type hints */}
          <div className="flex items-center gap-1.5 mt-3 px-1">
            {TYPE_HINTS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeHint(value)}
                className={`text-[12px] px-3 py-1.5 rounded-xl transition-colors active:scale-95 ${
                  typeHint === value
                    ? "bg-accent/10 text-accent font-medium border border-accent/20"
                    : "text-muted hover:text-muted/60 border border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={!text.trim() || saving}
            className="flex-1 py-3.5 rounded-xl text-[15px] font-medium transition-all disabled:opacity-30 bg-accent text-white hover:bg-accent/90 active:scale-[0.98]"
          >
            {saving ? "Saving…" : "Capture"}
          </button>
        </div>

        {/* Confirmation */}
        <div
          className={`mt-4 flex items-center justify-center gap-2 transition-all duration-300 ${
            saved ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
          }`}
        >
          <span className="size-2 rounded-full bg-emerald-400" />
          <span className="text-[13px] text-emerald-400/80">
            Captured — sent to inbox
          </span>
        </div>
      </form>

      {/* Footer */}
      <footer className="text-center px-5 pb-6">
        <p className="text-[10px] text-muted/20 mb-3">
          Lands in your inbox for triage
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/today"
            className="text-[11px] text-accent/50 hover:text-accent transition-colors"
          >
            Daily Card
          </Link>
          <span className="text-muted/15">·</span>
          <Link
            href="/"
            className="text-[11px] text-muted hover:text-muted/60 transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-muted/15">·</span>
          <Link
            href="/inbox"
            className="text-[11px] text-muted hover:text-muted/60 transition-colors"
          >
            Inbox
          </Link>
        </div>
      </footer>
    </div>
  );
}
