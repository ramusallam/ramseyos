import { ProjectFocus, SuggestedTools } from "./dashboard-live";
import { DailyControllerSection } from "./daily-controller";
import { PlaybookSidebar } from "./playbook-sidebar";
import { getQuickLaunchWorkflows } from "@/lib/workflows";
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
    <div className="max-w-5xl px-4 sm:px-8 pt-8 sm:pt-10 pb-20">
      {/* ── OS Header — unified status line ── */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[11px] text-muted/50 tabular-nums tracking-wide">
            {formatDate()}
          </span>
          <div className="flex-1 border-t border-border/30" />
        </div>
        <h1 className="text-[26px] sm:text-[30px] font-light text-foreground tracking-tight leading-tight">
          {getGreeting()}, Ramsey
        </h1>
        <p className="text-[13px] text-muted/40 mt-1.5">
          Here is your day.
        </p>
      </header>

      {/* ── Primary Controller — NowNext + DailyCard + Sidebar ── */}
      <DailyControllerSection
        sidebar={
          <>
            <DashboardCard variant="sidebar">
              <CardHeader
                icon="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M8 4.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"
                label="Quick launch"
              />
              <div className="space-y-0.5">
                {getQuickLaunchWorkflows().map((w) => (
                  <WorkflowLaunchButton
                    key={w.id}
                    label={w.shortName}
                    href={w.entryRoute}
                    icon={w.icon}
                    stepCount={w.steps.length}
                  />
                ))}
              </div>
            </DashboardCard>

            <DashboardCard variant="sidebar">
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

            <DashboardCard variant="sidebar">
              <CardHeader
                icon="M3 2h10v12H3zM6 5h4M6 7.5h4M6 10h2"
                label="Playbooks"
              />
              <PlaybookSidebar />
            </DashboardCard>
          </>
        }
      />

      {/* ── Secondary zone — lower visual weight ── */}
      <div className="mt-4 space-y-4 opacity-80">
        <DashboardCard variant="secondary">
          <SuggestedTools />
        </DashboardCard>

        <DashboardCard variant="secondary">
          <ProjectFocus />
        </DashboardCard>
      </div>

    </div>
  );
}

/* ── Dashboard primitives ── */

type CardVariant = "default" | "sidebar" | "secondary" | "ambient";

const CARD_STYLES: Record<CardVariant, string> = {
  default:
    "bg-surface/60 rounded-xl border border-border/60 p-5",
  sidebar:
    "bg-surface/50 rounded-xl border border-border/50 p-4 backdrop-blur-sm",
  secondary:
    "bg-surface/40 rounded-xl border border-border/40 p-5",
  ambient:
    "bg-surface/30 rounded-xl border border-border/30 p-5 opacity-50",
};

function DashboardCard({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
}) {
  return (
    <div className={`${CARD_STYLES[variant]} ${className}`}>
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
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted/60">
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

function WorkflowLaunchButton({
  label,
  href,
  icon,
  stepCount,
}: {
  label: string;
  href: string;
  icon: string;
  stepCount: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-[13px] text-foreground/60 transition-colors hover:bg-surface-raised hover:text-foreground group"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-muted/40 group-hover:text-accent/60 transition-colors shrink-0"
      >
        <path d={icon} />
      </svg>
      <span className="flex-1">{label}</span>
      <span className="text-[9px] text-muted/30 tabular-nums shrink-0">
        {stepCount} steps
      </span>
    </Link>
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
