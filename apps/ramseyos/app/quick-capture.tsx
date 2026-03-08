"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function QuickCapture() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      await addDoc(collection(db, "captures"), {
        text: trimmed,
        status: "unprocessed",
        createdAt: serverTimestamp(),
      });
      setText("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <span className="text-xs text-muted/60">+</span>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Capture a thought, task, or idea..."
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted/60 outline-none"
        disabled={saving}
      />
      {text.trim() && (
        <button
          type="submit"
          disabled={saving}
          className="text-[11px] text-accent/70 hover:text-accent transition-colors"
        >
          {saving ? "..." : "Save"}
        </button>
      )}
    </form>
  );
}
