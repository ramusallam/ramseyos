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
        type: "capture",
        processed: false,
        tags: [],
        projectId: null,
        priority: null,
      });
      setText("");
    } finally {
      setSaving(false);
    }
  }

  return (
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
  );
}
