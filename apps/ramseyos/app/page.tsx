import { ProjectFocus, SuggestedTools } from "./dashboard-live";
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
    <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
        {/* Header */}
        <header className="mb-8">
          <p className="text-[12px] text-muted/60 mb-1">{formatDate()}</p>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            {getGreeting()}, Ramsey
          </h1>
        </header>

        {/* Now / Next — primary controller */}
        <div className="mb-8">
          <NowNext />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          {/* Daily Card — primary */}
          <div className="lg:col-span-2">
            <DashboardCard>
              <DailyCard />
            </DashboardCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <DashboardCard>
              <CardHeader
                icon="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M8 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"
                label="Quick launch"
              />
              <div className="space-y-0.5">
                <ActionButton label="New lesson plan" />
                <ActionButton label="Grade with rubric" />
                <ActionButton label="Draft recommendation" />
                <ActionButton label="Discussion response" />
              </div>
            </DashboardCard>

            <DashboardCard>
              <CardHeader
                icon="M5.5 8l2 2 3-4"
                label="Approvals"
                count={2}
              />
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

        {/* Suggested Tools */}
        <div className="mb-8">
          <DashboardCard>
            <SuggestedTools />
          </DashboardCard>
        </div>

        {/* Project Focus */}
        <div className="mb-8">
          <DashboardCard>
            <ProjectFocus />
          </DashboardCard>
        </div>

        {/* Reflection */}
        <DashboardCard className="opacity-40">
          <CardHeader
            icon="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"
            label="Evening reflection"
          />
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
      className={`bg-surface/60 rounded-xl border border-border/60 p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({
  icon,
  label,
  count,
}: {
  icon: string;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-muted/40">
        <path d={icon} />
      </svg>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </h2>
      {count !== undefined && count > 0 && (
        <span className="inline-flex items-center justify-center rounded-full bg-accent-dim text-accent text-[10px] font-semibold tabular-nums size-5">
          {count}
        </span>
      )}
    </div>
  );
}

function ActionButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="w-full text-left rounded-lg px-3 py-2 text-[13px] text-foreground/60 transition-colors hover:bg-surface-raised hover:text-foreground"
    >
      {label}
    </button>
  );
}

function Approval({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-raised cursor-pointer">
      <p className="text-[13px] text-foreground/80 truncate">{title}</p>
      <p className="text-[10px] text-muted/50 mt-0.5">{meta}</p>
    </div>
  );
}
