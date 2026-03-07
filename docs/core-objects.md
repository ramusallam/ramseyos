# RamseyOS Core Objects

## Overview

These are the foundational data objects that power the RamseyOS shell and daily planning system. Each object maps to a Firestore collection and a JSON schema in `specs/`. Together they form the backbone of task management, daily planning, workflow execution, resource management, and personal reflection.

## Objects

### Task

**Collection:** `/tasks/{taskId}`
**Schema:** `specs/tasks.schema.json`

A Task is the atomic unit of work in RamseyOS. Tasks represent anything that needs to be done — from grading a set of papers to sending an email to preparing a workshop segment.

**Role in the system:**
- Tasks are the primary items that populate the Today Dashboard and Daily Card.
- Every task belongs to a workspace and optionally to a project.
- Tasks have three scheduling flavors: recurring (repeats on a schedule), dated (has a specific due date), or floating (no date, picked manually).
- Tasks flow through statuses: `inbox` (captured, not yet committed), `active` (committed to doing), `waiting` (blocked on something external), `done`, `archived`.
- The Daily Card pulls from active and recurring tasks to build each day's plan.

### Project

**Collection:** `/projects/{projectId}`
**Schema:** `specs/project.schema.json`

A Project groups related tasks under a shared goal. Projects represent sustained efforts like "AP Chemistry Unit 5 Redesign" or "Woven Q2 Workshop Series."

**Role in the system:**
- Projects provide structure above individual tasks.
- Each project belongs to a workspace and sub-area.
- Projects have a status lifecycle: `active`, `paused`, `completed`, `archived`.
- The Daily Card can pull project-level tasks to ensure ongoing projects get daily attention.
- Projects do not contain nested sub-projects. Keep it flat.

### Daily Card

**Collection:** `/dailyCards/{date}`
**Schema:** `specs/daily-card.schema.json`

The Daily Card is the single most important object in RamseyOS's daily planning system. It represents one day's plan — a structured, ordered list of what to do today, assembled from four input sources.

**Role in the system:**
- One Daily Card per calendar date. The document ID is the date string (`2026-03-07`).
- Assembles items from: recurring tasks, chosen miscellaneous tasks, project tasks, and calendar commitments.
- Items are ordered intelligently based on time blocks, deadlines, and priority.
- Tracks completion status per item throughout the day.
- Serves as the primary view on the Today Dashboard.
- Designed for future mobile delivery (push notification with the day's plan each morning).

See [docs/daily-card.md](daily-card.md) for the full Daily Card specification.

### Calendar Item

**Collection:** `/calendarItems/{itemId}`
**Schema:** `specs/calendar-item.schema.json`

A Calendar Item represents a time-bound commitment: a class period, a meeting, a workshop session, or a deadline. Calendar Items can be synced from external calendars (Google Calendar) or created manually.

**Role in the system:**
- Calendar Items provide the fixed time structure that the Daily Card builds around.
- They have a start time, end time, and optional location.
- They can be tagged with a workspace for context.
- The Daily Card uses calendar items as anchors: tasks are scheduled in the gaps between commitments.
- Future integration: two-way sync with Google Calendar via the Integration Engine.

### Workflow Run

**Collection:** `/workflowRuns/{runId}`
**Schema:** `specs/workflow-run.schema.json`

A Workflow Run is a single execution of a workflow definition. When a user triggers "Generate Lesson Plan" or "Draft Discussion Response," the system creates a Workflow Run to track that execution.

**Role in the system:**
- Links back to a workflow definition ID in `packages/workflows/definitions/`.
- Tracks execution status: `running`, `awaiting_review`, `completed`, `failed`.
- Stores inputs (what the user provided) and outputs (what the AI produced).
- When a run reaches a review step, it creates an Approval document.
- Logs model used and token counts for cost awareness.
- The Approval Queue reads from workflow runs with `awaiting_review` status.

### Resource Item

**Collection:** `/resources/{resourceId}`
**Schema:** `specs/resource-item.schema.json`

A Resource Item is a reusable instructional asset: a lab design, a project template, a lesson activity, a digital tool reference, or a classroom material.

**Role in the system:**
- Populates the Sonoma Academy Resource Library.
- Resources are tagged by type, subject, course, and topic for searchability.
- Resources can be linked to lesson plans and workflows — when planning a lesson, relevant resources surface automatically.
- Resources are workspace-scoped but can be shared across workspaces (a lab design from Sonoma could inform a Woven workshop).
- Resources are not AI-generated content. They are curated artifacts that persist and get reused.

### Reflection Entry

**Collection:** `/reflections/{entryId}`
**Schema:** `specs/reflection-entry.schema.json`

A Reflection Entry captures personal reflection, intention-setting, and journaling. Reflections are tied to specific dates and optionally to workspaces or projects.

**Role in the system:**
- Supports a daily reflection practice: morning intention, evening review, or freeform journaling.
- Each entry has a type: `morning-intention`, `evening-review`, `freeform`, `weekly-review`.
- Morning intentions can feed into the Daily Card as context for prioritization.
- Evening reviews can reference the day's Daily Card to reflect on what was accomplished.
- Reflections are private and never processed by AI unless explicitly requested.
- Future: weekly review entries could summarize patterns across daily reflections.

## Object Relationships

```text
Project ──has many──→ Task
Task ──appears on──→ Daily Card (as a daily card item)
Calendar Item ──appears on──→ Daily Card (as a daily card item)
Workflow Run ──produces──→ Approval (in Approval Queue)
Workflow Run ──references──→ Workflow Definition (in packages/workflows/)
Resource Item ──linked to──→ Task or Workflow Run (via tags/IDs)
Reflection Entry ──references──→ Daily Card (by date)
Daily Card ──references──→ Reflection Entry (morning intention)
```

## What Is NOT a Core Object (Yet)

These are intentionally deferred:

- **Inbox Item** — defined in `docs/data-model.md` but not prioritized for Phase 1 schemas. The Universal Inbox will use a simplified task with `status: "inbox"` initially.
- **Approval** — will be derived from Workflow Run data rather than a separate collection in Phase 1.
- **Knowledge Item** — deferred until the Knowledge Engine is built.
- **Memory Entry** — deferred until the Memory Engine is built.
