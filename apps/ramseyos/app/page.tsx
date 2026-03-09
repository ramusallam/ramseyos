import { QuickCapture } from "./quick-capture";
import { TodayFocus, RecentCaptures } from "./dashboard-live";
import Link from "next/link";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function TodayDashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-xl px-5 pt-12 pb-20">

        {/* Header */}
        <header className="mb-10">
          <p className="text-[11px] tracking-wide text-muted mb-1">
            {formatDate()}
          </p>
          <h1 className="text-xl font-normal text-zinc-100">
            {getGreeting()}, Ramsey
          </h1>
        </header>

        {/* Intention */}
        <Section>
          <SectionLabel>Intention</SectionLabel>
          <p className="text-sm text-muted/70 italic">
            Set your intention for the day...
          </p>
        </Section>

        {/* Today Focus */}
        <Section>
          <SectionLabel>Today focus</SectionLabel>
          <TodayFocus />
        </Section>

        {/* Recent Captures */}
        <Section>
          <RecentCaptures />
        </Section>

        {/* Quick Launch + Approvals */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <SectionLabel>Quick launch</SectionLabel>
            <div className="space-y-px">
              <ActionButton label="New lesson plan" />
              <ActionButton label="Grade with rubric" />
              <ActionButton label="Draft recommendation" />
              <ActionButton label="Discussion response" />
            </div>
          </div>
          <div>
            <SectionLabel>
              Approvals
              <Badge count={2} />
            </SectionLabel>
            <div className="space-y-px">
              <Approval title="Lesson Plan: Atomic Structure" meta="Lesson Planning · Sonoma" />
              <Approval title="Discussion Response: Week 4" meta="Discussion Board · Concordia" />
            </div>
          </div>
        </div>

        {/* Quick Capture */}
        <Section>
          <QuickCapture />
          <div className="flex items-center gap-4 mt-3">
            <Link
              href="/inbox"
              className="text-[11px] text-muted/60 hover:text-zinc-400 transition-colors"
            >
              Inbox
            </Link>
            <Link
              href="/tasks"
              className="text-[11px] text-muted/60 hover:text-zinc-400 transition-colors"
            >
              Tasks
            </Link>
          </div>
        </Section>

        {/* Reflection */}
        <div className="mb-10 opacity-30">
          <SectionLabel>Evening reflection</SectionLabel>
          <p className="text-sm text-muted italic">Available later today</p>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted/30 tracking-widest uppercase">
          RamseyOS
        </p>
      </div>
    </div>
  );
}

/* ── Primitives ── */

function Section({ children }: { children: React.ReactNode }) {
  return <div className="mb-8">{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted/70 mb-3">
      {children}
    </h2>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-accent-dim text-accent text-[9px] font-medium tabular-nums size-4">
      {count}
    </span>
  );
}

/* ── Actions ── */

function ActionButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="w-full text-left rounded px-2.5 py-1.5 text-[13px] text-zinc-400 transition-colors hover:bg-surface hover:text-zinc-200"
    >
      {label}
    </button>
  );
}

function Approval({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded px-2.5 py-2 transition-colors hover:bg-surface cursor-pointer">
      <p className="text-[13px] text-zinc-400 truncate">{title}</p>
      <p className="text-[9px] text-muted/60 mt-0.5">{meta}</p>
    </div>
  );
}
