"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth, type AuthStatus } from "@/lib/auth";
import { trackRecent } from "@/lib/recents";
import { CommandPalette } from "./command-palette";
import { useFocusTimer, FocusTimerIndicator } from "./focus-timer";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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

    const inboxQ = query(
      collection(db, "captures"),
      where("processed", "==", false)
    );
    unsubs.push(
      onSnapshot(inboxQ, (snap) =>
        setCounts((prev) => ({ ...prev, inbox: snap.size }))
      )
    );

    const tasksQ = query(
      collection(db, "tasks"),
      where("completed", "==", false)
    );
    unsubs.push(
      onSnapshot(tasksQ, (snap) =>
        setCounts((prev) => ({ ...prev, tasks: snap.size }))
      )
    );

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

/* ── Nav structure ── */

type NavKey =
  | "today"
  | "week"
  | "inbox"
  | "tasks"
  | "projects"
  | "calendar"
  | "tools"
  | "lessonPlans"
  | "rubrics"
  | "grading"
  | "materials"
  | "purchasing"
  | "vendors"
  | "communications"
  | "productOps"
  | "admin"
  | "life"
  | "weeklyReview"
  | "settings";

interface NavItem {
  href: string;
  label: string;
  icon: React.FC<{ active: boolean }>;
  key: NavKey;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/", label: "Today", icon: SunIcon, key: "today" },
      { href: "/week", label: "This Week", icon: WeekIcon, key: "week" },
    ],
  },
  {
    label: "Work",
    items: [
      { href: "/inbox", label: "Inbox", icon: InboxIcon, key: "inbox" },
      { href: "/tasks", label: "Tasks", icon: CheckIcon, key: "tasks" },
      { href: "/projects", label: "Projects", icon: FolderIcon, key: "projects" },
      { href: "/calendar", label: "Calendar", icon: CalendarIcon, key: "calendar" },
    ],
  },
  {
    label: "Teach",
    items: [
      { href: "/lesson-plans", label: "Lesson Plans", icon: LessonPlanIcon, key: "lessonPlans" },
      { href: "/rubrics", label: "Rubrics", icon: RubricIcon, key: "rubrics" },
      { href: "/grading", label: "Grading", icon: GradingIcon, key: "grading" },
      { href: "/materials", label: "Materials", icon: MaterialsIcon, key: "materials" },
      { href: "/purchasing", label: "Purchasing", icon: PurchasingIcon, key: "purchasing" },
      { href: "/vendors", label: "Sources", icon: VendorIcon, key: "vendors" },
      { href: "/tools", label: "Tools", icon: ToolsIcon, key: "tools" },
      { href: "/communications", label: "Comms", icon: CommsIcon, key: "communications" },
    ],
  },
  {
    label: "Ops",
    items: [
      { href: "/weekly-review", label: "Weekly Review", icon: WeeklyReviewIcon, key: "weeklyReview" },
      { href: "/product-ops", label: "Product Ops", icon: ProductOpsIcon, key: "productOps" },
      { href: "/admin", label: "Admin", icon: AdminIcon, key: "admin" },
      { href: "/life", label: "Life", icon: LifeIcon, key: "life" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/settings", label: "Settings", icon: SettingsIcon, key: "settings" },
    ],
  },
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

const SHELL_HIDDEN_ROUTES = ["/today", "/capture"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { status, user, error: authError, signingIn, signIn, signInRedirect, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const counts = useShellCounts();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const focusTimer = useFocusTimer();
  const gPending = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Global keyboard shortcuts
  useEffect(() => {
    const GO_MAP: Record<string, string> = {
      h: "/",
      w: "/week",
      i: "/inbox",
      t: "/tasks",
      p: "/projects",
      c: "/calendar",
      l: "/lesson-plans",
      r: "/rubrics",
      g: "/grading",
      v: "/weekly-review",
      a: "/admin",
      s: "/settings",
    };

    function handleKeyDown(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      // Cmd+K / Ctrl+K → command palette
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      // "f" to toggle focus timer
      if (!e.metaKey && !e.ctrlKey && !e.altKey && e.key === "f" && !gPending.current) {
        if (focusTimer.isRunning) focusTimer.pause();
        else if (focusTimer.isActive) focusTimer.resume();
        else focusTimer.start();
        return;
      }

      // "g" prefix navigation: press g, then a letter
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "g" && !gPending.current) {
          gPending.current = true;
          if (gTimer.current) clearTimeout(gTimer.current);
          gTimer.current = setTimeout(() => { gPending.current = false; }, 800);
          return;
        }

        if (gPending.current) {
          gPending.current = false;
          if (gTimer.current) clearTimeout(gTimer.current);
          const dest = GO_MAP[e.key];
          if (dest) {
            e.preventDefault();
            router.push(dest);
          }
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, focusTimer]);

  // Track page visits for recent activity
  useEffect(() => {
    if (pathname === "/") return; // Don't track the dashboard itself
    const label =
      NAV_GROUPS.flatMap((g) => g.items).find((n) => n.href === pathname)?.label;
    if (label) {
      trackRecent({ id: `page-${pathname}`, label, href: pathname, category: "page" });
    } else if (pathname.startsWith("/projects/")) {
      trackRecent({ id: `nav-${pathname}`, label: "Project", href: pathname, category: "project", detail: pathname.split("/").pop() });
    } else if (pathname.startsWith("/lesson-plans/")) {
      trackRecent({ id: `nav-${pathname}`, label: "Lesson Plan", href: pathname, category: "lesson", detail: pathname.split("/").pop() });
    }
  }, [pathname]);

  // Auth gate — show login/loading before anything else
  if (status !== "ready") {
    return <AuthGate status={status} signIn={signIn} signInRedirect={signInRedirect} signingIn={signingIn} error={authError} />;
  }

  const hideShell = SHELL_HIDDEN_ROUTES.some((r) => pathname.startsWith(r));

  if (hideShell) {
    return (
      <div className="min-h-screen bg-background">
        {children}
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Command Palette */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-surface flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-5">
          <Link href="/" className="text-[12px] font-bold tracking-widest uppercase text-accent hover:text-accent/80 transition-colors">
            RamseyOS
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-1 space-y-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted px-3 mb-1.5">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon, key }) => {
                  const isActive =
                    href === "/" ? pathname === "/" : pathname.startsWith(href);
                  const count = getNavCount(key, counts);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                          isActive
                            ? "bg-accent-dim text-accent font-semibold"
                            : "text-foreground/70 hover:bg-surface-raised hover:text-foreground"
                        }`}
                      >
                        <Icon active={isActive} />
                        <span className="flex-1">{label}</span>
                        {count !== null && (
                          <span className="text-[10px] font-semibold tabular-nums text-muted">
                            {count}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Focus Timer */}
        <FocusTimerIndicator
          isActive={focusTimer.isActive}
          isRunning={focusTimer.isRunning}
          label={focusTimer.label}
          displayMs={focusTimer.displayMs}
          onPause={focusTimer.pause}
          onResume={focusTimer.resume}
          onStop={focusTimer.stop}
        />

        {/* Command Palette Trigger */}
        <div className="px-3 py-3 border-t border-border">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 w-full text-[13px] text-muted hover:bg-surface-raised hover:text-foreground transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>Search</span>
            <span className="ml-auto text-[10px] text-muted font-mono">⌘K</span>
          </button>
        </div>

        {/* Footer — user + sign out */}
        <div className="px-4 py-3 border-t border-border flex items-center gap-2.5">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt=""
              className="size-6 rounded-full shrink-0"
              referrerPolicy="no-referrer"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted tracking-wide truncate">
              RamseyOS
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="text-[11px] text-muted hover:text-foreground transition-colors shrink-0"
            aria-label="Sign out"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2H4a2 2 0 00-2 2v8a2 2 0 002 2h2M10.5 12l4-4-4-4M14 8H6" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  );
}

/* ── Auth Gate ── */

function AuthGate({
  status,
  signIn,
  signInRedirect,
  signingIn,
  error,
}: {
  status: AuthStatus;
  signIn: () => Promise<void>;
  signInRedirect: () => Promise<void>;
  signingIn: boolean;
  error: string | null;
}) {
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="size-5 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
          <p className="text-[12px] tracking-widest uppercase text-muted font-medium">
            RamseyOS
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <p className="text-[12px] tracking-widest uppercase text-accent font-semibold mb-8">
            RamseyOS
          </p>
          <div className="rounded-2xl border border-border bg-surface p-10 shadow-card">
            <svg
              width="32"
              height="32"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto text-muted mb-5"
            >
              <rect x="3" y="7" width="10" height="7" rx="1.5" />
              <path d="M5 7V5a3 3 0 016 0v2" />
            </svg>
            <p className="text-[18px] text-foreground font-semibold mb-2">
              Access restricted
            </p>
            <p className="text-[14px] text-muted leading-relaxed mb-6">
              This system is private. The account you signed in with does not
              have access.
            </p>
            <button
              type="button"
              onClick={signIn}
              className="text-[14px] text-accent font-medium hover:text-accent/80 transition-colors"
            >
              Try a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // status === "signed-out"
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <p className="text-[12px] tracking-widest uppercase text-accent font-semibold mb-8">
          RamseyOS
        </p>
        <div className="rounded-2xl border border-border bg-surface p-10 shadow-card">
          <p className="text-[22px] text-foreground font-semibold mb-2">
            Welcome back
          </p>
          <p className="text-[14px] text-muted leading-relaxed mb-8">
            Sign in to access your personal operating system.
          </p>
          <button
            type="button"
            onClick={signIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-60 px-5 py-3.5 text-[15px] font-semibold text-white transition-colors shadow-sm"
          >
            {signingIn ? (
              <>
                <div className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#fff" fillOpacity="0.6" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#fff" fillOpacity="0.8" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#fff" fillOpacity="0.6" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#fff" fillOpacity="0.7" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Sign in with Google
              </>
            )}
          </button>
          {!signingIn && (
            <button
              type="button"
              onClick={signInRedirect}
              className="w-full mt-2 text-[13px] text-accent/70 hover:text-accent transition-colors py-2"
            >
              Popup not working? Sign in via redirect
            </button>
          )}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-left">
              <p className="text-[13px] text-red-700 font-medium">Sign-in error</p>
              <p className="text-[12px] text-red-600 mt-1">{error}</p>
            </div>
          )}
        </div>
        <p className="text-[12px] text-muted/60 mt-6">
          Private system · Single-user access
        </p>
      </div>
    </div>
  );
}

/* ── Icons (simple SVG, 16x16) ── */

function WeekIcon({ active }: { active: boolean }) {
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
        d="M2 7h12M5.5 3v-1M10.5 3v-1M5.5 9.5h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function LessonPlanIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={active ? "text-accent" : "text-muted"}
    >
      <path
        d="M3 2.5h10a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 6h6M5 8.5h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RubricIcon({ active }: { active: boolean }) {
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
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 5.5h6M5 8h6M5 10.5h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GradingIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={active ? "text-accent" : "text-muted"}
    >
      <path
        d="M3 2h10a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"
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

function WeeklyReviewIcon({ active }: { active: boolean }) {
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
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 6h6M5 8.5h4M5 11h2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ToolsIcon({ active }: { active: boolean }) {
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
        width="5"
        height="5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="9"
        y="2"
        width="5"
        height="5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="2"
        y="9"
        width="5"
        height="5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="9"
        y="9"
        width="5"
        height="5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function PurchasingIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={active ? "text-accent" : "text-muted"}
    >
      <circle cx="6" cy="13.5" r="1" fill="currentColor" />
      <circle cx="12.5" cy="13.5" r="1" fill="currentColor" />
      <path
        d="M1 1h2.5l1.3 7.5a1 1 0 001 .8h6.4a1 1 0 001-.8L14.5 4H4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MaterialsIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={active ? "text-accent" : "text-muted"}
    >
      <path
        d="M3 3h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 7h6M5 9.5h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CommsIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={active ? "text-accent" : "text-muted"}
    >
      <path
        d="M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M1.5 3.5l6.5 5 6.5-5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VendorIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={active ? "text-accent" : "text-muted"}
    >
      <path
        d="M2 6l1-3.5h10L14 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="2"
        y="6"
        width="12"
        height="7.5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6 10h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AdminIcon({ active }: { active: boolean }) {
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
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 5.5h6M5 8h6M5 10.5h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProductOpsIcon({ active }: { active: boolean }) {
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
        d="M5 7h6M5 10h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LifeIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={active ? "text-accent" : "text-muted"}
    >
      <path
        d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={active ? "text-accent" : "text-muted"}
    >
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
