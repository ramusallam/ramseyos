"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  getPermissionStatus,
  requestPermission,
  sendNotification,
  type NotificationPermissionStatus,
} from "@/lib/notifications";
import Link from "next/link";

/* ── Types ── */

interface ConnectionStatus {
  connected: boolean;
  lastSyncedAt: string | null;
  email: string | null;
}

interface Preferences {
  showLifeContext: boolean;
  showCarryForward: boolean;
  showQuickCapture: boolean;
  compactSidebar: boolean;
}

const DEFAULT_PREFS: Preferences = {
  showLifeContext: true,
  showCarryForward: true,
  showQuickCapture: true,
  compactSidebar: false,
};

const PREFS_KEY = "ramseyos:preferences";

function loadPrefs(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: Preferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/* ── Page ── */

export default function SettingsPage() {
  const { user, status: authStatus } = useAuth();
  const [gcalStatus, setGcalStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [notifPerm, setNotifPerm] = useState<NotificationPermissionStatus>("default");

  useEffect(() => {
    setPrefs(loadPrefs());
    setNotifPerm(getPermissionStatus());
  }, []);

  useEffect(() => {
    fetch("/api/calendar/status")
      .then((r) => r.json())
      .then((data) => {
        setGcalStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const togglePref = useCallback((key: keyof Preferences) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      savePrefs(next);
      return next;
    });
  }, []);

  async function handleExport() {
    setExportStatus("Exporting…");
    try {
      // Gather all key data from Firestore
      const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");

      const collections = ["tasks", "projects", "captures", "lessonPlans", "calendarEvents", "lifeItems", "adminItems", "communicationDrafts"];
      const exportData: Record<string, unknown[]> = {};

      for (const col of collections) {
        try {
          const snap = await getDocs(query(collection(db, col), orderBy("createdAt", "desc")));
          exportData[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        } catch {
          exportData[col] = [];
        }
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ramseyos-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus("Exported ✓");
      setTimeout(() => setExportStatus(null), 2000);
    } catch (err) {
      console.error("Export error:", err);
      setExportStatus("Export failed");
      setTimeout(() => setExportStatus(null), 3000);
    }
  }

  if (loading || authStatus === "loading") {
    return (
      <div className="max-w-3xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        <div className="flex items-center gap-3 py-16 justify-center">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[13px] text-muted">Loading settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted/50 hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-[20px] font-semibold text-foreground tracking-tight mt-2">
          Settings
        </h1>
        <p className="text-[13px] text-muted mt-1">
          Preferences, integrations, and system info.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <Link href="/calendar" className="text-[11px] text-muted hover:text-accent transition-colors">
            Calendar &rarr;
          </Link>
          <Link href="/admin" className="text-[11px] text-muted hover:text-accent transition-colors">
            Admin &rarr;
          </Link>
        </div>
      </header>

      <div className="space-y-8">
        {/* ── Account ── */}
        <SettingsSection icon="M8 6a3 3 0 100-1M2.5 14a5.5 5.5 0 0111 0" label="Account">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center gap-4">
              {user?.photoURL && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="" className="size-10 rounded-full border border-border" referrerPolicy="no-referrer" />
              )}
              <div className="min-w-0">
                <p className="text-[13px] text-foreground/80 truncate">{user?.displayName ?? "User"}</p>
                <p className="text-[11px] text-muted truncate">{user?.email}</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-emerald-500">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Authenticated
              </span>
            </div>
          </div>
        </SettingsSection>

        {/* ── Integrations ── */}
        <SettingsSection icon="M6 3H3v3M10 3h3v3M6 13H3v-3M10 13h3v-3" label="Integrations" badge={gcalStatus?.connected ? "1 active" : undefined}>
          <div className="space-y-2">
            <IntegrationRow
              name="Google Calendar"
              detail={gcalStatus?.connected ? gcalStatus.email ?? "Connected" : "Not connected"}
              connected={!!gcalStatus?.connected}
              href="/calendar"
            />
            <IntegrationRow name="Firebase" detail="Auth, Firestore, Storage" connected />
            <IntegrationRow name="Vercel" detail="Hosting & deployment" connected />
          </div>
        </SettingsSection>

        {/* ── Dashboard Preferences ── */}
        <SettingsSection icon="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" label="Dashboard">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-card space-y-0">
            <ToggleRow
              label="Life context"
              description="Include life & admin items in daily context"
              checked={prefs.showLifeContext}
              onChange={() => togglePref("showLifeContext")}
            />
            <Divider />
            <ToggleRow
              label="Carry forward"
              description="Show carry-forward widget on Today dashboard"
              checked={prefs.showCarryForward}
              onChange={() => togglePref("showCarryForward")}
            />
            <Divider />
            <ToggleRow
              label="Quick capture"
              description="Show capture bar at top of Today dashboard"
              checked={prefs.showQuickCapture}
              onChange={() => togglePref("showQuickCapture")}
            />
            <Divider />
            <ToggleRow
              label="Compact sidebar"
              description="Reduce spacing in the navigation sidebar"
              checked={prefs.compactSidebar}
              onChange={() => togglePref("compactSidebar")}
            />
          </div>
        </SettingsSection>

        {/* ── Notifications ── */}
        <SettingsSection icon="M8 1.5v1M8 13.5v1M3.5 8h-1M14.5 8h-1M4.5 4.5l-.7-.7M12.2 12.2l-.7-.7M4.5 11.5l-.7.7M12.2 3.8l-.7.7" label="Notifications">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-foreground/80">Browser notifications</p>
                <p className="text-[11px] text-muted">
                  {notifPerm === "granted"
                    ? "Notifications are enabled"
                    : notifPerm === "denied"
                      ? "Notifications are blocked — update in browser settings"
                      : "Allow RamseyOS to send browser notifications"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] ${
                    notifPerm === "granted"
                      ? "text-emerald-500"
                      : notifPerm === "denied"
                        ? "text-rose-400"
                        : "text-muted"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      notifPerm === "granted"
                        ? "bg-emerald-400"
                        : notifPerm === "denied"
                          ? "bg-rose-400"
                          : "bg-muted"
                    }`}
                  />
                  {notifPerm === "granted" ? "Granted" : notifPerm === "denied" ? "Blocked" : "Not set"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {notifPerm === "default" && (
                <button
                  type="button"
                  onClick={async () => {
                    const result = await requestPermission();
                    setNotifPerm(result);
                  }}
                  className="text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  Enable notifications
                </button>
              )}
              {notifPerm === "granted" && (
                <button
                  type="button"
                  onClick={() =>
                    sendNotification("RamseyOS", {
                      body: "Notifications are working.",
                    })
                  }
                  className="text-[12px] font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  Send test notification
                </button>
              )}
            </div>
          </div>
        </SettingsSection>

        {/* ── Keyboard Shortcuts ── */}
        <SettingsSection icon="M2 4h12v8H2zM5 8h1M8 8h1" label="Keyboard shortcuts">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="grid grid-cols-2 gap-y-2 gap-x-8">
              <ShortcutRow keys="⌘ K" label="Command palette" />
              <ShortcutRow keys="G then H" label="Go to Today" />
              <ShortcutRow keys="G then W" label="Go to This Week" />
              <ShortcutRow keys="G then I" label="Go to Inbox" />
              <ShortcutRow keys="G then T" label="Go to Tasks" />
              <ShortcutRow keys="G then P" label="Go to Projects" />
              <ShortcutRow keys="G then C" label="Go to Calendar" />
              <ShortcutRow keys="G then L" label="Go to Lesson Plans" />
              <ShortcutRow keys="G then R" label="Go to Rubrics" />
              <ShortcutRow keys="G then G" label="Go to Grading" />
              <ShortcutRow keys="G then V" label="Go to Weekly Review" />
              <ShortcutRow keys="F" label="Focus timer start/pause" />
            </div>
          </div>
        </SettingsSection>

        {/* ── Data ── */}
        <SettingsSection icon="M3 2h10v12H3zM6 5h4M6 7.5h4" label="Data">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] text-foreground/80">Export all data</p>
                <p className="text-[11px] text-muted">Download tasks, projects, captures, lessons, and more as JSON</p>
              </div>
              <button
                type="button"
                onClick={handleExport}
                disabled={!!exportStatus}
                className="text-[12px] font-medium text-accent hover:text-accent/80 transition-colors disabled:opacity-60"
              >
                {exportStatus ?? "Export"}
              </button>
            </div>
          </div>
        </SettingsSection>

        {/* ── System ── */}
        <SettingsSection icon="M8 5v3M8 10.5v.5" label="System">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-card space-y-3">
            <SystemRow label="Version" value="0.2.0" />
            <Divider />
            <SystemRow label="Platform" value="Web" />
            <Divider />
            <SystemRow label="Runtime" value="Next.js + Vercel" />
            <Divider />
            <SystemRow label="Database" value="Firebase Firestore" />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

/* ── Primitives ── */

function SettingsSection({
  icon,
  label,
  badge,
  children,
}: {
  icon: string;
  label: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <path d={icon} />
        </svg>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</h2>
        {badge && <span className="text-[10px] text-muted tabular-nums">{badge}</span>}
        <div className="flex-1 border-t border-border" />
      </div>
      {children}
    </section>
  );
}

function IntegrationRow({
  name,
  detail,
  connected,
  href,
}: {
  name: string;
  detail: string;
  connected: boolean;
  href?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-foreground/80">{name}</p>
        <p className="text-[11px] text-muted">{detail}</p>
      </div>
      {connected ? (
        <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-500">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          Active
        </span>
      ) : href ? (
        <Link href={href} className="text-[11px] text-accent hover:text-accent/80 transition-colors">
          Connect &rarr;
        </Link>
      ) : null}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-[13px] text-foreground/80">{label}</p>
        <p className="text-[11px] text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked ? "true" : "false"}
        aria-label={`Toggle ${label}`}
        onClick={onChange}
        className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors shrink-0 ${
          checked ? "bg-accent" : "bg-border-strong"
        }`}
      >
        <span
          className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-muted">{label}</span>
      <kbd className="text-[11px] text-foreground/60 bg-surface-raised px-2 py-0.5 rounded border border-border font-mono">
        {keys}
      </kbd>
    </div>
  );
}

function SystemRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-muted">{label}</span>
      <span className="text-[12px] text-foreground/60 tabular-nums">{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border" />;
}
