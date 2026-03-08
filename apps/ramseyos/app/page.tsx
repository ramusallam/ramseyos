import { QuickCapture } from "./quick-capture";

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

        {/* Today */}
        <Section>
          <SectionLabel>Today</SectionLabel>
          <ul className="space-y-px">
            <CardItem time="8:30" label="Review AP Chemistry homework" workspace="Sonoma" />
            <CardItem time="9:00" label="Period 2 — AP Chemistry" workspace="Calendar" event />
            <CardItem time="10:30" label="Draft lesson plan: Chemical Bonding" workspace="Sonoma" />
            <CardItem time="11:00" label="Department meeting" workspace="Calendar" event />
            <CardItem label="Concordia discussion responses" workspace="Concordia" />
            <CardItem label="Woven workshop outline review" workspace="Woven" />
          </ul>
        </Section>

        {/* Next Up */}
        <Section>
          <SectionLabel>Next up</SectionLabel>
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-sm text-zinc-200">Period 2 — AP Chemistry</p>
              <p className="text-[11px] text-muted mt-0.5">9:00 AM</p>
            </div>
            <p className="text-[11px] text-muted">in 25 min</p>
          </div>
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

/* ── Daily Card ── */

const WS: Record<string, string> = {
  Sonoma: "text-indigo-400/70",
  Concordia: "text-emerald-400/70",
  Woven: "text-amber-400/70",
  Cycles: "text-rose-400/70",
  Calendar: "text-blue-400/60",
};

function CardItem({
  time,
  label,
  workspace,
  event = false,
}: {
  time?: string;
  label: string;
  workspace: string;
  event?: boolean;
}) {
  return (
    <li className="group flex items-center gap-3 rounded px-2.5 py-2 -mx-2.5 transition-colors hover:bg-surface">
      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted/60 font-mono">
        {time ?? "–"}
      </span>
      <span className={`size-1 shrink-0 rounded-full ${event ? "bg-blue-400/50" : "bg-zinc-600"}`} />
      <span className={`flex-1 text-[13px] ${event ? "text-zinc-400" : "text-zinc-300"}`}>
        {label}
      </span>
      <span className={`text-[9px] tracking-wider uppercase shrink-0 ${WS[workspace] ?? "text-muted/50"}`}>
        {workspace}
      </span>
    </li>
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
