# RamseyOS Today Dashboard

## Purpose

The Today Dashboard is the home screen of RamseyOS. It answers one question: "What does today look like?" It should take less than 10 seconds to scan and understand the shape of the day. Everything on this screen is today-relevant. Nothing historical, nothing next-week, nothing aspirational — just today.

The dashboard is designed for calm. It reduces cognitive load by pre-organizing the day so the user can move from item to item without deciding what to do next. It is the single surface a user opens in the morning and returns to throughout the day.

## Main Sections

The Today Dashboard is composed of discrete sections, each serving a specific role. Sections are laid out top-to-bottom in priority order on desktop, and stack naturally for future mobile views.

### 1. Morning Intention (Top, Compact)

A single line or short block at the very top of the dashboard. If a morning reflection entry exists for today, its intention text displays here. If not, a subtle prompt invites one.

- **Always visible:** Yes, but compact. One or two lines maximum.
- **Expand on demand:** Tap to open the full reflection entry or create one.
- **Purpose:** Sets the tone for the day. Grounds the user before diving into tasks.

### 2. Daily Card (Primary, Center)

The heart of the dashboard. The Daily Card is the ordered plan for the day, assembled from four sources:

- Recurring tasks (auto-populated by schedule)
- Chosen miscellaneous tasks (manually selected)
- Project tasks (pulled from active projects)
- Calendar commitments (time-anchored events)

Items are displayed in recommended sequence with time anchors visible. Each item shows: title, workspace badge, time or time block, and a completion checkbox.

- **Always visible:** Yes. This is the main content area.
- **Expand on demand:** Each item expands to show description, notes, or linked resources.
- **Purpose:** The operational plan for the day. Work through it top to bottom.

See [docs/daily-card.md](daily-card.md) for the full Daily Card specification.

### 3. Approvals Ready (Sidebar or Below Card)

A count badge and compact list of AI-generated drafts awaiting review. Each approval shows: title, source workflow, workspace, and time since generated.

- **Always visible:** Count badge is always visible. The list shows the first 3 items.
- **Expand on demand:** "View all" opens the full Approval Queue.
- **Purpose:** Ensures AI outputs don't pile up unreviewed. Keeps the review-before-publish loop tight.

### 4. Quick Capture (Persistent, Minimal)

A single-line input field always accessible on the dashboard. Type anything — a task, a note, an idea — and it goes to the Universal Inbox for processing later.

- **Always visible:** Yes. One input line with a submit action.
- **Expand on demand:** No expansion needed. Capture is fast and disposable.
- **Purpose:** Prevents context switching. Capture the thought without leaving the dashboard.

### 5. Calendar Glance (Sidebar or Below Card)

A compact timeline view of today's calendar commitments. Shows the next upcoming event prominently, with the rest of the day's events in a compressed list.

- **Always visible:** Next event is always visible. Full list is compact.
- **Expand on demand:** Opens the full Calendar view.
- **Purpose:** Time awareness without opening a separate calendar app.

### 6. Active Projects Pulse (Bottom or Sidebar)

A compact summary of active projects with recent activity or approaching deadlines. Shows project name, workspace, and the next due task.

- **Always visible:** Top 3-4 projects with nearest deadlines.
- **Expand on demand:** Opens the full Tasks / Projects view.
- **Purpose:** Keeps long-running work visible without cluttering the daily plan.

### 7. Evening Review Prompt (Bottom, End of Day)

After a configurable time (e.g., 4:00 PM), a gentle prompt appears at the bottom of the dashboard inviting an evening reflection. Shows today's completion stats (done, skipped, deferred) as context.

- **Always visible:** Only after the configured time.
- **Expand on demand:** Opens the reflection entry form.
- **Purpose:** Closes the daily loop. Encourages reflection without forcing it.

## Layout Priority

What appears first matters. The dashboard is ordered by cognitive priority:

```text
┌─────────────────────────────────────────────┐
│  Morning Intention (1-2 lines)              │
├─────────────────────────────────────────────┤
│                                             │
│  Daily Card                                 │
│  (ordered items: tasks + calendar)          │
│                                             │
├───────────────────────┬─────────────────────┤
│  Approvals Ready (3)  │  Calendar Glance    │
├───────────────────────┴─────────────────────┤
│  Quick Capture [________________________]   │
├─────────────────────────────────────────────┤
│  Active Projects Pulse                      │
├─────────────────────────────────────────────┤
│  Evening Review Prompt (after 4 PM)         │
└─────────────────────────────────────────────┘
```

On narrower screens, the two-column section (Approvals + Calendar) stacks vertically.

## Design Principles for the Dashboard

### Calm Over Busy

The dashboard should feel like a clean desk with today's work laid out, not like a control center with blinking alerts. Use whitespace, muted colors, and restrained typography. Reserve strong color for items that need attention (overdue tasks, pending approvals).

### Glanceable First, Expandable Second

Every section has a compressed default state that communicates its essence in one line or one number. Details are available on demand but never forced. The user should be able to scan the entire dashboard without scrolling on a standard desktop display.

### Today Only

Nothing on the dashboard is from yesterday or next week. Historical data lives in archives. Future planning lives in Tasks/Projects and Calendar. The dashboard is a present-tense surface.

### No Notifications, No Alerts

The dashboard does not ping, badge, or alert. It is a pull surface — the user comes to it when ready. Urgency is communicated through visual weight (position, color), not interruption.

### Completion Feels Good

Checking off items should feel satisfying. A subtle visual change (strikethrough, muted color) confirms completion. The completion count at the bottom quietly tracks progress without gamification.

## Connections to Other Systems

| Dashboard Section | Connected System | Relationship |
| --- | --- | --- |
| Morning Intention | Reflection Entry | Reads today's morning-intention entry |
| Daily Card | Tasks, Calendar Items | Assembles from tasks and calendar items for today's date |
| Approvals Ready | Workflow Runs | Reads runs with `awaiting_review` status |
| Quick Capture | Quick Capture Entry / Inbox | Creates new capture entries for later processing |
| Calendar Glance | Calendar Items | Reads today's calendar items |
| Active Projects Pulse | Projects, Tasks | Reads active projects and their nearest due tasks |
| Evening Review | Reflection Entry | Prompts creation of evening-review entry |

## Mobile Delivery (Future)

The Today Dashboard's data structure is designed for future mobile delivery:

- The Daily Card is a self-contained document that can be serialized and pushed as a morning notification.
- Quick Capture can work as a simple text input endpoint.
- Approval counts can be pushed as a badge.
- The dashboard's top-to-bottom layout maps naturally to a mobile scroll view.

Implementation is not in Phase 1. The data model supports it without changes.

## What the Dashboard Is NOT

- It is not a task manager. Task management (creation, editing, bulk operations) happens in the Tasks view.
- It is not a calendar. Full calendar views live in the Calendar section.
- It is not a workspace. Workspace-specific views live under their own navigation.
- It is not a feed. There is no infinite scroll, no social-style updates, no timeline of activity.
