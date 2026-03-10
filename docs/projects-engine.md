# RamseyOS Projects Engine

## What is a Project?

A Project in RamseyOS is a sustained effort with a clear goal. It groups related tasks under a shared purpose and belongs to a specific workspace.

Examples:
- **AP Chemistry Unit 5 Redesign** (Sonoma → Teaching)
- **Concordia Fall Course Refresh** (Concordia → Course Management)
- **Woven Q2 Workshop Series** (Woven → Workshops)
- **Spark Learning MVP** (RamseyOS / App Development)
- **Family Summer Planning** (Personal)

A project is not a tag or a folder. It represents a defined scope of work that has a beginning, an arc of tasks, and an eventual completion.

## How Projects Differ from Captures and Tasks

| Object | Purpose | Lifespan |
|---|---|---|
| **Capture** | Raw thought, dropped into the Inbox | Minutes to hours — triaged quickly |
| **Task** | Single unit of work to complete | Hours to days |
| **Project** | Group of tasks toward a shared goal | Days to months |

Captures become tasks during triage. Tasks become part of projects during planning. Projects provide the "why" that individual tasks lack on their own.

## How Projects Relate to Tasks

Every task can optionally belong to one project via a `projectId` field on the task document. This is the primary association and the one used for day-to-day queries.

For richer querying (e.g., "show all tasks added to this project this week"), a separate `projectMemberships` collection stores explicit membership records with timestamps. This is a secondary index, not the source of truth — the task's `projectId` field is authoritative.

**Relationship rules:**
- A task belongs to zero or one project
- A project has zero or many tasks
- Projects do not nest inside other projects — keep it flat
- Tasks can exist without a project (standalone tasks are valid)
- Moving a task between projects updates both the task's `projectId` and creates a new membership record

## Project Lifecycle

Projects move through a simple status lifecycle:

```
active → paused → active → completed → archived
```

| Status | Meaning |
|---|---|
| `active` | Work is happening — tasks appear in planning views |
| `paused` | Intentionally on hold — tasks remain but are deprioritized |
| `completed` | Goal achieved — no new tasks expected |
| `archived` | Hidden from active views — retained for reference |

## How Projects Connect to the Daily Orchestration Engine

When the Daily Card is assembled each morning, the system considers:

1. **Active projects** — surfaces tasks from active projects based on priority and due dates
2. **Project balance** — ensures no single project dominates the day (unless intentional)
3. **Stale projects** — flags active projects with no task activity in the past week
4. **Project deadlines** — if a project has a `targetDate`, tasks within it get elevated priority as the date approaches

This is how RamseyOS prevents important long-term work from being crowded out by urgent but less meaningful tasks.

## Why Projects Are Necessary

Without projects, RamseyOS is a task list. With projects, it becomes an orchestration system.

Specifically, projects enable:

1. **Context grouping** — "Show me everything related to the Woven workshop" is only possible if tasks are grouped
2. **Progress tracking** — knowing that 14 of 20 tasks are done tells you the project is 70% through
3. **Daily planning intelligence** — the Daily Card can pull from projects to ensure sustained progress, not just reactive task completion
4. **Review and reflection** — weekly reviews can assess project-level progress, not just task-level completion
5. **Workspace organization** — projects sit within workspaces, giving the domain hierarchy a concrete middle layer between "workspace" and "task"

## Schema References

- **Project:** `specs/project.schema.json`
- **Project Membership:** `specs/project-membership.schema.json`
- **Task (with projectId):** `specs/tasks.schema.json`

## What This Engine Does NOT Include (Yet)

- Project creation UI — deferred to a future session
- Task-to-project assignment UI — deferred
- Project dashboard / detail page — deferred
- Sub-projects or nested hierarchies — intentionally excluded (keep it flat)
- Multi-user project sharing — `owner` field exists for future use
- AI-powered project planning — deferred to the Workflow Engine integration
