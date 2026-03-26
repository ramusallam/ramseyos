"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createCapture } from "@/lib/captures";
import { createTask } from "@/lib/tasks";
import { createProject } from "@/lib/projects";
import { createLessonPlan } from "@/lib/lesson-plans";
import { createDraft } from "@/lib/drafts";
import { getRecents, type RecentItem } from "@/lib/recents";

/* ── Types ── */

interface PaletteItem {
  id: string;
  label: string;
  detail?: string;
  category: "navigate" | "task" | "project" | "lesson" | "action" | "recent";
  href?: string;
  action?: () => void | Promise<void>;
  icon: string;
}

/* ── Static navigation items ── */

const NAV_ITEMS: PaletteItem[] = [
  { id: "nav-today", label: "Today", category: "navigate", href: "/", icon: "sun" },
  { id: "nav-week", label: "This Week", detail: "Weekly planning & review", category: "navigate", href: "/week", icon: "calendar" },
  { id: "nav-inbox", label: "Inbox", category: "navigate", href: "/inbox", icon: "inbox" },
  { id: "nav-tasks", label: "Tasks", category: "navigate", href: "/tasks", icon: "check" },
  { id: "nav-projects", label: "Projects", category: "navigate", href: "/projects", icon: "folder" },
  { id: "nav-calendar", label: "Calendar", category: "navigate", href: "/calendar", icon: "calendar" },
  { id: "nav-lessons", label: "Lesson Plans", category: "navigate", href: "/lesson-plans", icon: "lesson" },
  { id: "nav-materials", label: "Materials", category: "navigate", href: "/materials", icon: "materials" },
  { id: "nav-purchasing", label: "Purchasing", category: "navigate", href: "/purchasing", icon: "cart" },
  { id: "nav-vendors", label: "Sources", category: "navigate", href: "/vendors", icon: "vendor" },
  { id: "nav-tools", label: "Tools", category: "navigate", href: "/tools", icon: "tools" },
  { id: "nav-comms", label: "Communications", category: "navigate", href: "/communications", icon: "comms" },
  { id: "nav-product", label: "Product Ops", category: "navigate", href: "/product-ops", icon: "product" },
  { id: "nav-admin", label: "Admin", category: "navigate", href: "/admin", icon: "admin" },
  { id: "nav-life", label: "Life", category: "navigate", href: "/life", icon: "life" },
  { id: "nav-settings", label: "Settings", category: "navigate", href: "/settings", icon: "settings" },
  { id: "nav-capture", label: "Quick Capture", detail: "Full screen", category: "navigate", href: "/capture", icon: "plus" },
  { id: "nav-mobile", label: "Mobile Daily Card", category: "navigate", href: "/today", icon: "sun" },
];

/* ── Fetch dynamic items ── */

interface DynamicItems {
  tasks: PaletteItem[];
  projects: PaletteItem[];
  lessons: PaletteItem[];
}

async function fetchDynamicItems(): Promise<DynamicItems> {
  const [taskSnap, projSnap, lessonSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, "tasks"),
        where("completed", "==", false),
        orderBy("createdAt", "desc"),
        limit(50)
      )
    ),
    getDocs(
      query(
        collection(db, "projects"),
        where("archived", "==", false),
        orderBy("createdAt", "desc"),
        limit(30)
      )
    ),
    getDocs(
      query(collection(db, "lessonPlans"), orderBy("createdAt", "desc"), limit(30))
    ),
  ]);

  const projects: PaletteItem[] = projSnap.docs.map((d) => ({
    id: `proj-${d.id}`,
    label: d.data().title ?? "Untitled",
    detail: d.data().status ?? "",
    category: "project",
    href: `/projects/${d.id}`,
    icon: "folder",
  }));

  const projMap = new Map(projSnap.docs.map((d) => [d.id, d.data().title ?? ""]));

  const tasks: PaletteItem[] = taskSnap.docs.map((d) => {
    const data = d.data();
    const projName = data.projectId ? projMap.get(data.projectId) : null;
    return {
      id: `task-${d.id}`,
      label: data.title ?? "Untitled",
      detail: projName ? `in ${projName}` : data.priority ?? "",
      category: "task",
      href: data.projectId ? `/projects/${data.projectId}` : "/tasks",
      icon: "check",
    };
  });

  const lessons: PaletteItem[] = lessonSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: `lesson-${d.id}`,
      label: data.title ?? "Untitled",
      detail: data.course ?? "",
      category: "lesson",
      href: `/lesson-plans/${d.id}`,
      icon: "lesson",
    };
  });

  return { tasks, projects, lessons };
}

/* ── Icon renderer ── */

const ICON_PATHS: Record<string, string> = {
  sun: "M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M8 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z",
  inbox: "M2 3h12v10H2zM2 9h3.5a1 1 0 011 1 1 1 0 001 1h1a1 1 0 001-1 1 1 0 011-1H14",
  check: "M2 2h12a3 3 0 010 0v12a3 3 0 010 0H2a3 3 0 010 0V2zM5.5 8l2 2 3-4",
  folder: "M2 5V4a1 1 0 011-1h3l1.5 2H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5z",
  calendar: "M2 3h12a2 2 0 012 0v11a2 2 0 010 0H2a2 2 0 010 0V3zM2 7h12M5 1.5v3M11 1.5v3",
  lesson: "M3 2.5h10a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9a1 1 0 011-1zM5 6h6M5 8.5h4",
  materials: "M3 3h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1zM5 7h6M5 9.5h3",
  cart: "M1 1h2.5l1.3 7.5a1 1 0 001 .8h6.4a1 1 0 001-.8L14.5 4H4",
  vendor: "M2 6l1-3.5h10L14 6M2 6h12v7.5a1 1 0 01-1 1H3a1 1 0 01-1-1V6zM6 10h4",
  tools: "M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z",
  comms: "M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1zM1.5 3.5l6.5 5 6.5-5",
  product: "M2 3h12a2 2 0 012 0v10a2 2 0 010 0H2a2 2 0 010 0V3zM5 7h6M5 10h3",
  admin: "M2 2h12a2 2 0 012 0v12a2 2 0 010 0H2a2 2 0 010 0V2zM5 5.5h6M5 8h6M5 10.5h4",
  life: "M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z",
  settings: "M8 6a2 2 0 100 4 2 2 0 000-4zM8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2",
  plus: "M8 3.5v9M3.5 8h9",
  capture: "M8 3.5v9M3.5 8h9",
  task: "M5.5 8l2 2 3-4",
};

function PaletteIcon({ name }: { name: string }) {
  const d = ICON_PATHS[name] ?? ICON_PATHS.check;
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-muted/50"
    >
      <path d={d} />
    </svg>
  );
}

/* ── Category labels ── */

const CATEGORY_LABEL: Record<string, string> = {
  action: "Quick Actions",
  recent: "Recent",
  navigate: "Navigate",
  task: "Tasks",
  project: "Projects",
  lesson: "Lessons",
};

const CATEGORY_ORDER = ["action", "recent", "navigate", "task", "project", "lesson"];

/* ── Main Component ── */

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [dynamic, setDynamic] = useState<DynamicItems | null>(null);
  const [recentItems, setRecentItems] = useState<PaletteItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Fetch dynamic items + recents when palette opens
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIdx(0);
      setActionFeedback(null);
      fetchDynamicItems().then(setDynamic);

      // Load recent items from localStorage
      const recents = getRecents(6);
      setRecentItems(
        recents.map((r) => ({
          id: `recent-${r.id}`,
          label: r.label,
          detail: r.detail,
          category: "recent" as const,
          href: r.href,
          icon: r.category === "project" ? "folder" : r.category === "lesson" ? "lesson" : r.category === "task" ? "check" : "sun",
        }))
      );

      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Quick action items
  const actionItems: PaletteItem[] = useMemo(
    () => [
      {
        id: "action-capture",
        label: "Quick Capture",
        detail: "Send to inbox",
        category: "action",
        icon: "capture",
        action: async () => {
          const text = search.trim();
          if (!text) return;
          await createCapture({ text, source: "manual" });
          setActionFeedback("Captured → inbox");
          setTimeout(onClose, 800);
        },
      },
      {
        id: "action-task",
        label: "Create Task",
        detail: search.trim() ? `"${search.trim()}"` : "from search text",
        category: "action",
        icon: "task",
        action: async () => {
          const text = search.trim();
          if (!text) return;
          await createTask({ title: text });
          setActionFeedback("Task created");
          setTimeout(onClose, 800);
        },
      },
      {
        id: "action-project",
        label: "New Project",
        detail: search.trim() ? `"${search.trim()}"` : "from search text",
        category: "action",
        icon: "folder",
        action: async () => {
          const text = search.trim();
          if (!text) return;
          const id = await createProject({ title: text });
          setActionFeedback("Project created");
          setTimeout(() => { router.push(`/projects/${id}`); onClose(); }, 800);
        },
      },
      {
        id: "action-lesson",
        label: "New Lesson Plan",
        detail: search.trim() ? `"${search.trim()}"` : "from search text",
        category: "action",
        icon: "lesson",
        action: async () => {
          const text = search.trim();
          if (!text) return;
          const id = await createLessonPlan({ title: text });
          setActionFeedback("Lesson plan created");
          setTimeout(() => { router.push(`/lesson-plans/${id}`); onClose(); }, 800);
        },
      },
      {
        id: "action-draft",
        label: "New Draft",
        detail: search.trim() ? `"${search.trim()}"` : "from search text",
        category: "action",
        icon: "comms",
        action: async () => {
          const text = search.trim();
          if (!text) return;
          await createDraft({ subject: text });
          setActionFeedback("Draft created");
          setTimeout(() => { router.push("/communications"); onClose(); }, 800);
        },
      },
    ],
    [search, onClose, router]
  );

  // Build filtered results
  const results = useMemo(() => {
    const q = search.toLowerCase().trim();
    const all: PaletteItem[] = [
      ...(q.length > 0 ? actionItems : []),
      ...NAV_ITEMS,
      ...(dynamic?.tasks ?? []),
      ...(dynamic?.projects ?? []),
      ...(dynamic?.lessons ?? []),
    ];

    if (!q) {
      // Show recents (if any) + navigation when search is empty
      return [...recentItems, ...all.filter((i) => i.category === "navigate")];
    }

    return all.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.detail && i.detail.toLowerCase().includes(q)) ||
        (i.category === "action" && q.length > 0)
    );
  }, [search, dynamic, actionItems, recentItems]);

  // Group by category
  const grouped = useMemo(() => {
    const groups = new Map<string, PaletteItem[]>();
    for (const item of results) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    const sorted: [string, PaletteItem[]][] = [];
    for (const cat of CATEGORY_ORDER) {
      const items = groups.get(cat);
      if (items) sorted.push([cat, items]);
    }
    return sorted;
  }, [results]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(
    () => grouped.flatMap(([, items]) => items),
    [grouped]
  );

  // Clamp selected index
  useEffect(() => {
    if (selectedIdx >= flatResults.length) {
      setSelectedIdx(Math.max(0, flatResults.length - 1));
    }
  }, [flatResults.length, selectedIdx]);

  const handleSelect = useCallback(
    (item: PaletteItem) => {
      if (item.action) {
        item.action();
      } else if (item.href) {
        router.push(item.href);
        onClose();
      }
    },
    [router, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flatResults[selectedIdx];
        if (item) handleSelect(item);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [flatResults, selectedIdx, handleSelect, onClose]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Palette */}
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Action feedback */}
        {actionFeedback ? (
          <div className="flex items-center gap-3 px-5 py-5">
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="text-[14px] text-emerald-400/80 font-medium">
              {actionFeedback}
            </span>
          </div>
        ) : (
          <>
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-muted"
              >
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5L14 14" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIdx(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search or type a command…"
                className="flex-1 bg-transparent py-3.5 text-[14px] text-foreground placeholder:text-muted outline-none"
                autoComplete="off"
              />
              <kbd className="text-[10px] text-muted font-mono border border-border rounded px-1.5 py-0.5">
                esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto py-2">
              {flatResults.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-[13px] text-muted">No results</p>
                </div>
              ) : (
                grouped.map(([category, items]) => (
                  <div key={category}>
                    <p className="px-5 pt-3 pb-1 text-[9px] font-semibold uppercase tracking-widest text-muted">
                      {CATEGORY_LABEL[category] ?? category}
                    </p>
                    {items.map((item) => {
                      const globalIdx = flatResults.indexOf(item);
                      const isSelected = globalIdx === selectedIdx;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIdx(globalIdx)}
                          className={`flex items-center gap-3 w-full px-5 py-2 text-left transition-colors ${
                            isSelected
                              ? "bg-accent/[0.08] text-foreground"
                              : "text-foreground/70 hover:bg-surface-raised/50"
                          }`}
                        >
                          <PaletteIcon name={item.icon} />
                          <span className="flex-1 truncate text-[13px]">
                            {item.label}
                          </span>
                          {item.detail && (
                            <span className="text-[11px] text-muted truncate max-w-[140px]">
                              {item.detail}
                            </span>
                          )}
                          {isSelected && (
                            <kbd className="text-[9px] text-muted font-mono">
                              ↵
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-2 flex items-center gap-4">
              <span className="text-[10px] text-muted">
                <kbd className="font-mono">↑↓</kbd> navigate
              </span>
              <span className="text-[10px] text-muted">
                <kbd className="font-mono">↵</kbd> select
              </span>
              <span className="text-[10px] text-muted">
                <kbd className="font-mono">esc</kbd> close
              </span>
              {search.trim() && (
                <span className="ml-auto text-[10px] text-accent font-medium">
                  Type to create
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
