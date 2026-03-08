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
      <div className="mx-auto max-w-2xl px-6 py-16">

        {/* Header */}
        <header className="mb-14">
          <p className="text-xs font-medium tracking-wide text-muted mb-1.5">
            {formatDate()}
          </p>
          <h1 className="text-2xl font-normal tracking-tight text-zinc-100">
            {getGreeting()}, Ramsey
          </h1>
        </header>

        {/* Intention */}
        <Section>
          <SectionLabel>Intention</SectionLabel>
          <p className="text-sm text-muted italic leading-relaxed">
            Set your intention for the day...
          </p>
        </Section>

        {/* Today */}
        <Section>
          <SectionLabel>Today</SectionLabel>
          <ul className="space-y-1">
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
              <p className="text-xs text-muted mt-0.5">9:00 AM</p>
            </div>
            <p className="text-xs text-muted">in 25 min</p>
          </div>
        </Section>

        {/* Quick Launch + Approvals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
          <Section flush>
            <SectionLabel>Quick launch</SectionLabel>
            <div className="space-y-1">
              <ActionButton label="New lesson plan" />
              <ActionButton label="Grade with rubric" />
              <ActionButton label="Draft recommendation" />
              <ActionButton label="Discussion response" />
            </div>
          </Section>

          <Section flush>
            <SectionLabel>
              Approvals
              <Badge count={2} />
            </SectionLabel>
            <div className="space-y-1">
              <Approval title="Lesson Plan: Atomic Structure" meta="Lesson Planning · Sonoma" />
              <Approval title="Discussion Response: Week 4" meta="Discussion Board · Concordia" />
            </div>
          </Section>
        </div>

        {/* Quick Capture */}
        <Section>
          <div className="flex items-center gap-2.5 text-muted">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
            <p className="text-sm">Capture a thought, task, or idea...</p>
          </div>
        </Section>

        {/* Reflection */}
        <div className="mb-16 opacity-40">
          <SectionLabel>Evening reflection</SectionLabel>
          <p className="text-sm text-muted italic">Available later today</p>
        </div>

        {/* Footer */}
        <footer className="text-center">
          <p className="text-[10px] text-muted/40 tracking-widest uppercase">
            RamseyOS
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ── Layout primitives ── */

function Section({ children, flush }: { children: React.ReactNode; flush?: boolean }) {
  return <div className={flush ? "" : "mb-12"}>{children}</div>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-muted mb-4">
      {children}
    </h2>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-accent-dim text-accent text-[10px] font-medium tabular-nums h-[18px] min-w-[18px] px-1">
      {count}
    </span>
  );
}

/* ── Daily Card ── */

const WORKSPACE_COLORS: Record<string, string> = {
  Sonoma: "text-indigo-400",
  Concordia: "text-emerald-400",
  Woven: "text-amber-400",
  Cycles: "text-rose-400",
  Calendar: "text-blue-400",
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
  const color = WORKSPACE_COLORS[workspace] ?? "text-muted";

  return (
    <li className="group flex items-center gap-3 rounded-md px-3 py-2.5 -mx-3 transition-colors hover:bg-surface">
      <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted font-mono">
        {time ?? "—"}
      </span>
      <span
        className={`w-1.5 h-1.5 shrink-0 rounded-full ${
          event ? "bg-blue-400/60" : "bg-border-strong"
        }`}
      />
      <span className={`flex-1 text-sm ${event ? "text-zinc-400" : "text-zinc-200"}`}>
        {label}
      </span>
      <span className={`text-[10px] tracking-wider uppercase ${color} shrink-0`}>
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
      className="w-full text-left rounded-md px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-surface hover:text-zinc-100"
    >
      {label}
    </button>
  );
}

function Approval({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-md px-3 py-2.5 transition-colors hover:bg-surface cursor-pointer">
      <p className="text-sm text-zinc-300 truncate">{title}</p>
      <p className="text-[10px] text-muted mt-0.5">{meta}</p>
    </div>
  );
}
