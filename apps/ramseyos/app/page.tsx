import { QuickCapture } from "./quick-capture";
import { ProjectFocus } from "./dashboard-live";
import { DailyCard } from "./daily-card";
import { NowNext } from "./now-next";

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
    <div className="max-w-4xl px-8 pt-10 pb-20">
        {/* Header */}
        <header className="mb-8">
          <p className="text-[12px] text-muted mb-1">{formatDate()}</p>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {getGreeting()}, Ramsey
          </h1>
        </header>

        {/* Now / Next — primary controller */}
        <div className="mb-8">
          <NowNext />
        </div>

        {/* Quick Capture */}
        <div className="mb-8">
          <DashboardCard>
            <QuickCapture />
          </DashboardCard>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Daily Card — primary */}
          <div className="lg:col-span-2">
            <DashboardCard>
              <DailyCard />
            </DashboardCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <DashboardCard>
              <CardHeader>Quick launch</CardHeader>
              <div className="space-y-0.5">
                <ActionButton label="New lesson plan" />
                <ActionButton label="Grade with rubric" />
                <ActionButton label="Draft recommendation" />
                <ActionButton label="Discussion response" />
              </div>
            </DashboardCard>

            <DashboardCard>
              <CardHeader>
                <span className="flex items-center gap-2">
                  Approvals
                  <Badge count={2} />
                </span>
              </CardHeader>
              <div className="space-y-1">
                <Approval
                  title="Lesson Plan: Atomic Structure"
                  meta="Lesson Planning · Sonoma"
                />
                <Approval
                  title="Discussion Response: Week 4"
                  meta="Discussion Board · Concordia"
                />
              </div>
            </DashboardCard>
          </div>
        </div>

        {/* Project Focus */}
        <div className="mb-8">
          <DashboardCard>
            <ProjectFocus />
          </DashboardCard>
        </div>

        {/* Reflection */}
        <DashboardCard className="opacity-50">
          <CardHeader>Evening reflection</CardHeader>
          <p className="text-sm text-muted italic">Available later today</p>
        </DashboardCard>
      </div>
  );
}

/* ── Dashboard primitives ── */

function DashboardCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-surface rounded-xl border border-border p-5 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">
      {children}
    </h2>
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-accent-dim text-accent text-[10px] font-semibold tabular-nums size-5">
      {count}
    </span>
  );
}

function ActionButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="w-full text-left rounded-lg px-3 py-2 text-[13px] text-foreground/70 transition-colors hover:bg-surface-raised hover:text-foreground"
    >
      {label}
    </button>
  );
}

function Approval({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-raised cursor-pointer">
      <p className="text-[13px] text-foreground/80 truncate">{title}</p>
      <p className="text-[10px] text-muted mt-0.5">{meta}</p>
    </div>
  );
}
