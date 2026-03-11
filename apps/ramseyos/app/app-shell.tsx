"use client";

import { useState, useRef, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createCapture } from "@/lib/captures";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface ShellCounts {
  inbox: number;
  tasks: number;
  chosenToday: number;
  schedule: number;
}

function useShellCounts(): ShellCounts {
  const [counts, setCounts] = useState<ShellCounts>({
    inbox: 0,
    tasks: 0,
    chosenToday: 0,
    schedule: 0,
  });

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // Unprocessed inbox captures
    const inboxQ = query(
      collection(db, "captures"),
      where("processed", "==", false)
    );
    unsubs.push(
      onSnapshot(inboxQ, (snap) =>
        setCounts((prev) => ({ ...prev, inbox: snap.size }))
      )
    );

    // Open (incomplete) tasks
    const tasksQ = query(
      collection(db, "tasks"),
      where("completed", "==", false)
    );
    unsubs.push(
      onSnapshot(tasksQ, (snap) =>
        setCounts((prev) => ({ ...prev, tasks: snap.size }))
      )
    );

    // Chosen for today
    const chosenQ = query(
      collection(db, "tasks"),
      where("completed", "==", false),
      where("chosenForToday", "==", true)
    );
    unsubs.push(
      onSnapshot(chosenQ, (snap) =>
        setCounts((prev) => ({ ...prev, chosenToday: snap.size }))
      )
    );

    // Today's calendar events
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const calQ = query(
      collection(db, "calendarEvents"),
      where("startTime", ">=", start),
      where("startTime", "<=", end),
      orderBy("startTime", "asc")
    );
    unsubs.push(
      onSnapshot(calQ, (snap) =>
        setCounts((prev) => ({ ...prev, schedule: snap.size }))
      )
    );

    return () => unsubs.forEach((fn) => fn());
  }, []);

  return counts;
}

type NavKey = "today" | "inbox" | "tasks" | "projects" | "calendar";

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: React.FC<{ active: boolean }>;
  key: NavKey;
}[] = [
  { href: "/", label: "Today", icon: SunIcon, key: "today" },
  { href: "/inbox", label: "Inbox", icon: InboxIcon, key: "inbox" },
  { href: "/tasks", label: "Tasks", icon: CheckIcon, key: "tasks" },
  { href: "/projects", label: "Projects", icon: FolderIcon, key: "projects" },
  { href: "/calendar", label: "Calendar", icon: CalendarIcon, key: "calendar" },
];

function getNavCount(
  key: NavKey,
  counts: ShellCounts
): number | null {
  switch (key) {
    case "today":
      return counts.chosenToday || null;
    case "inbox":
      return counts.inbox || null;
    case "tasks":
      return counts.tasks || null;
    case "calendar":
      return counts.schedule || null;
    default:
      return null;
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const counts = useShellCounts();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border-strong bg-surface flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-5">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-accent">
            RamseyOS
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon, key }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              const count = getNavCount(key, counts);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                      isActive
                        ? "bg-accent-dim text-accent font-medium"
                        : "text-foreground/60 hover:bg-surface-raised hover:text-foreground"
                    }`}
                  >
                    <Icon active={isActive} />
                    <span className="flex-1">{label}</span>
                    {count !== null && (
                      <span className="text-[10px] font-medium tabular-nums text-muted/70">
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Capture */}
        <div className="px-3 py-3 border-t border-border">
          <SidebarCapture />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border">
          <p className="text-[10px] text-muted/50 tracking-wide">
            v0.1 · Foundation
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}

/* ── Sidebar Capture ── */

function SidebarCapture() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      await createCapture({ text: trimmed, source: "manual" });
      setText("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-lg px-3 py-2 w-full text-[13px] text-foreground/60 hover:bg-surface-raised hover:text-foreground transition-colors"
      >
        <PlusIcon />
        Parking lot
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setText("");
            setOpen(false);
          }
        }}
        placeholder="Capture a thought..."
        className="w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-[13px] text-foreground placeholder:text-muted/50 outline-none focus:border-accent/30 transition-colors"
        disabled={saving}
      />
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => {
            setText("");
            setOpen(false);
          }}
          className="text-[11px] text-muted hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        {text.trim() && (
          <button
            type="submit"
            disabled={saving}
            className="text-[11px] font-medium text-accent hover:text-accent/80 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        )}
      </div>
    </form>
  );
}

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="text-muted"
    >
      <path
        d="M8 3.5v9M3.5 8h9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ── Icons (simple SVG, 16x16) ── */

function SunIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={active ? "text-accent" : "text-muted"}
    >
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InboxIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={active ? "text-accent" : "text-muted"}
    >
      <rect
        x="2"
        y="3"
        width="12"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2 9h3.5a1 1 0 011 1v0a1 1 0 001 1h1a1 1 0 001-1v0a1 1 0 011-1H14"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CheckIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={active ? "text-accent" : "text-muted"}
    >
      <rect
        x="2"
        y="2"
        width="12"
        height="12"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5.5 8l2 2 3-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FolderIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={active ? "text-accent" : "text-muted"}
    >
      <path
        d="M2 5V4a1 1 0 011-1h3l1.5 2H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={active ? "text-accent" : "text-muted"}
    >
      <rect
        x="2"
        y="3"
        width="12"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2 7h12M5 1.5v3M11 1.5v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
