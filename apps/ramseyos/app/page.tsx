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
  const greeting = getGreeting();
  const date = formatDate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12">

        {/* Greeting + Date */}
        <header className="mb-12">
          <p className="text-sm tracking-widest uppercase text-muted mb-2">
            {date}
          </p>
          <h1 className="text-3xl font-light tracking-tight">
            {greeting}, Ramsey
          </h1>
        </header>

        {/* Morning Intention */}
        <section className="mb-10">
          <div className="rounded-lg border border-border bg-surface px-5 py-4">
            <p className="text-xs uppercase tracking-widest text-muted mb-2">
              Intention
            </p>
            <p className="text-sm text-foreground/70 italic">
              Set your intention for the day...
            </p>
          </div>
        </section>

        {/* Daily Card */}
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-muted mb-4">
            Today
          </h2>
          <div className="space-y-2">
            <DailyCardItem
              time="8:30"
              title="Review AP Chemistry homework"
              tag="Sonoma"
              tagColor="text-indigo-400"
            />
            <DailyCardItem
              time="9:00"
              title="Period 2 — AP Chemistry"
              tag="Calendar"
              tagColor="text-blue-400"
              isEvent
            />
            <DailyCardItem
              time="10:30"
              title="Draft lesson plan: Chemical Bonding"
              tag="Sonoma"
              tagColor="text-indigo-400"
            />
            <DailyCardItem
              time="11:00"
              title="Department meeting"
              tag="Calendar"
              tagColor="text-blue-400"
              isEvent
            />
            <DailyCardItem
              title="Concordia discussion responses"
              tag="Concordia"
              tagColor="text-emerald-400"
            />
            <DailyCardItem
              title="Woven workshop outline review"
              tag="Woven"
              tagColor="text-amber-400"
            />
          </div>
        </section>

        {/* Next Up */}
        <section className="mb-10">
          <h2 className="text-xs uppercase tracking-widest text-muted mb-4">
            Next up
          </h2>
          <div className="rounded-lg border border-border bg-surface px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Period 2 — AP Chemistry</p>
              <p className="text-xs text-muted mt-0.5">9:00 AM</p>
            </div>
            <span className="text-xs text-muted">in 25 min</span>
          </div>
        </section>

        {/* Two-column: Quick Launch + Approvals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">

          {/* Quick Launch */}
          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted mb-4">
              Quick launch
            </h2>
            <div className="space-y-2">
              <QuickAction label="New lesson plan" />
              <QuickAction label="Grade with rubric" />
              <QuickAction label="Draft recommendation" />
              <QuickAction label="Discussion response" />
            </div>
          </section>

          {/* Approvals Ready */}
          <section>
            <h2 className="text-xs uppercase tracking-widest text-muted mb-4">
              Approvals ready
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-accent/15 text-accent text-[10px] font-medium w-5 h-5">
                2
              </span>
            </h2>
            <div className="space-y-2">
              <ApprovalCard
                title="Lesson Plan: Atomic Structure"
                workflow="Lesson Planning"
                workspace="Sonoma"
              />
              <ApprovalCard
                title="Discussion Response: Week 4"
                workflow="Discussion Board"
                workspace="Concordia"
              />
            </div>
          </section>
        </div>

        {/* Quick Capture */}
        <section className="mb-10">
          <div className="rounded-lg border border-border bg-surface px-4 py-3 flex items-center gap-3">
            <span className="text-muted text-sm">+</span>
            <p className="text-sm text-muted">
              Capture a thought, task, or idea...
            </p>
          </div>
        </section>

        {/* Evening Reflection */}
        <section className="mb-12">
          <div className="rounded-lg border border-border/50 bg-surface/50 px-5 py-4">
            <p className="text-xs uppercase tracking-widest text-muted/60 mb-2">
              Evening reflection
            </p>
            <p className="text-sm text-foreground/40 italic">
              Available later today
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center">
          <p className="text-xs text-muted/50 tracking-wide">
            RamseyOS
          </p>
        </footer>

      </div>
    </div>
  );
}

function DailyCardItem({
  time,
  title,
  tag,
  tagColor,
  isEvent = false,
}: {
  time?: string;
  title: string;
  tag: string;
  tagColor: string;
  isEvent?: boolean;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-hover">
      {/* Checkbox or time anchor */}
      <div className="w-12 shrink-0 text-right">
        {time ? (
          <span className="text-xs text-muted font-mono">{time}</span>
        ) : (
          <span className="text-xs text-muted">&mdash;</span>
        )}
      </div>

      {/* Completion indicator */}
      <div
        className={`w-3.5 h-3.5 shrink-0 rounded-sm border ${
          isEvent
            ? "border-blue-500/40 bg-blue-500/10"
            : "border-border group-hover:border-muted"
        }`}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm truncate ${isEvent ? "text-foreground/80" : ""}`}>
          {title}
        </p>
      </div>

      {/* Workspace tag */}
      <span className={`text-[10px] uppercase tracking-widest ${tagColor} shrink-0`}>
        {tag}
      </span>
    </div>
  );
}

function QuickAction({ label }: { label: string }) {
  return (
    <button type="button" className="w-full text-left rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground/80 transition-colors hover:bg-surface-hover hover:text-foreground">
      {label}
    </button>
  );
}

function ApprovalCard({
  title,
  workflow,
  workspace,
}: {
  title: string;
  workflow: string;
  workspace: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:bg-surface-hover">
      <p className="text-sm truncate">{title}</p>
      <p className="text-[10px] text-muted mt-1">
        {workflow} &middot; {workspace}
      </p>
    </div>
  );
}
