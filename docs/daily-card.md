# RamseyOS Daily Card

## What It Is

The Daily Card is a single day's operating plan. It answers the question: "What am I doing today, and in what order?" Every morning, RamseyOS assembles a Daily Card from four input categories, orders them intelligently, and presents the result as the primary view on the Today Dashboard.

The Daily Card is the centerpiece of RamseyOS's daily planning system.

## Four Input Categories

The Daily Card pulls items from exactly four sources:

### 1. Recurring Tasks

Tasks that repeat on a schedule: daily, specific weekdays, weekly, or monthly. Examples:
- Check and respond to parent emails (daily)
- Review AP Chemistry homework submissions (Mon/Wed/Fri)
- Submit Concordia discussion responses (weekly, Tuesdays)
- Process invoices (monthly, 1st)

Recurring tasks appear on the Daily Card automatically based on their recurrence rule. They don't need to be manually added each day.

### 2. Chosen Miscellaneous Tasks

One-off or floating tasks that the user explicitly chooses to work on today. These are pulled from the active task pool — tasks that exist but aren't tied to a specific date or recurrence. Examples:
- Write recommendation letter for Student X
- Review workshop outline draft
- Research new lab safety protocols

The user selects which miscellaneous tasks to commit to for the day, either the evening before or in the morning. The Daily Card does not auto-assign these.

### 3. Project Tasks

Tasks that belong to active projects and are either due today or chosen for today's progress. Examples:
- Draft Unit 5 assessment (AP Chem Redesign project)
- Outline Session 3 activities (Woven Workshop Series project)
- Write introduction section (Cycles blog post project)

Project tasks keep long-running work moving forward. The Daily Card can suggest project tasks based on deadlines and recent activity, but the user decides what to include.

### 4. Calendar Commitments

Time-bound events from the calendar: classes, meetings, office hours, workshops, deadlines. Examples:
- Period 2: AP Chemistry (9:00-10:15)
- Department meeting (11:00-12:00)
- Woven client call (2:00-3:00)

Calendar commitments are fixed anchors. They provide the time structure that all other items are scheduled around.

## How the Day Is Ordered

The Daily Card presents items in a recommended sequence, not just a flat list. Ordering follows these principles:

### Time-Anchored Items First

Calendar commitments with specific start times create the skeleton of the day. All other items are placed in the available time gaps.

### Morning Block

The first work block of the day (before the first calendar commitment) is reserved for high-priority and high-focus tasks. Reasoning: cognitive energy is highest in the morning.

Ordering within the morning block:
1. Morning intention / reflection (if enabled)
2. Highest-priority tasks (by priority flag and deadline proximity)
3. Deep work tasks (drafting, planning, creative work)

### Between-Commitment Gaps

Tasks are placed in gaps between calendar items based on:
- **Estimated duration** — match task size to gap size.
- **Context switching** — group tasks from the same workspace together when possible.
- **Deadline urgency** — tasks due today or overdue rise to the top of any gap.

### Afternoon and End-of-Day

The end of the day is reserved for:
- Lower-cognitive-load tasks (email, admin, quick replies)
- Recurring daily wrap-up tasks
- Evening reflection (if enabled)

### Overflow

If more tasks are committed than time allows, the Daily Card flags overflow items with a clear indicator. It does not silently drop tasks. The user can defer overflowed items to tomorrow or remove them.

## Completion Tracking

Each item on the Daily Card tracks its own completion status:

- `pending` — not started
- `in_progress` — actively working on it
- `done` — completed
- `skipped` — intentionally not done today
- `deferred` — moved to a future date

When an item is marked `done`:
- If it's a task, the underlying Task document's status is updated to `done`.
- If it's a recurring task, only today's instance is marked done. The task itself remains active for its next occurrence.
- If it's a calendar item, completion is informational (the event happened).

When an item is marked `deferred`:
- The item is removed from today's Daily Card.
- If it's a task, it reappears in the unscheduled task pool or is assigned to the specified future date.

## Daily Card Lifecycle

```text
1. ASSEMBLE (morning or night before)
   - Pull recurring tasks for this date
   - Pull calendar items for this date
   - User selects miscellaneous and project tasks
   - AI suggests ordering (user can reorder manually)

2. EXECUTE (throughout the day)
   - User works through the card
   - Marks items as done, in_progress, skipped, or deferred
   - New urgent items can be added mid-day

3. CLOSE (end of day)
   - Remaining pending items are flagged
   - User decides: defer to tomorrow, defer to later, or skip
   - Optional evening reflection entry is prompted
   - Completion stats are recorded on the Daily Card

4. ARCHIVE
   - The Daily Card becomes a historical record
   - Reflection entries reference it by date
   - Weekly reviews can aggregate Daily Card data
```

## Data Structure

The Daily Card document contains:

- **date** — the calendar date (document ID)
- **status** — `draft`, `active`, `closed`
- **items** — ordered array of daily card items, each with:
  - source type (recurring, miscellaneous, project, calendar)
  - reference ID (task ID or calendar item ID)
  - display title
  - scheduled time block (optional)
  - estimated duration (optional)
  - completion status
  - workspace ID
- **reflection** — optional reference to the day's reflection entries
- **stats** — completion counts (done, skipped, deferred) computed at close

See `specs/daily-card.schema.json` for the full schema.

## Mobile Delivery (Future)

The Daily Card is designed with future mobile delivery in mind:

- **Morning push notification** — a summary of the day's plan delivered at a configurable time.
- **Lightweight mobile view** — the Daily Card's ordered item list renders naturally as a mobile checklist.
- **Quick completion** — tapping an item marks it done without opening the full app.
- **Mid-day updates** — if the card changes (new items added, items deferred), the mobile view reflects it.

Implementation of mobile delivery is not in Phase 1. The data structure supports it by keeping the Daily Card self-contained — everything needed to render the day's plan is in one document.

## Integration with Reflection

The Daily Card connects to the reflection system:

- **Morning intention** — if a morning reflection entry exists for this date, its intention text can appear at the top of the Daily Card as context.
- **Evening review** — the evening reflection prompt can include the day's completion stats and list of accomplished items.
- **Weekly review** — aggregates Daily Card data across the week for pattern recognition.

## What the Daily Card Is NOT

- It is not a calendar app. It does not replace Google Calendar.
- It is not a task manager. Tasks live in their own collection. The Daily Card is a daily view into tasks.
- It is not generated entirely by AI. The user decides what goes on the card. AI helps with ordering and suggestions.
- It is not mandatory. If a day has no Daily Card, the system still works. Tasks and calendar items exist independently.
