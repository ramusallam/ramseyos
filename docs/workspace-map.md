# RamseyOS Workspace Map

## Domain Hierarchy

```
RamseyOS
├── Schools
│   ├── Sonoma Academy
│   │   ├── Teaching
│   │   │   ├── Lesson Planning
│   │   │   ├── Course Design
│   │   │   ├── Assessment Creation
│   │   │   └── Student Feedback & Grading
│   │   ├── Admin
│   │   │   ├── Department Leadership
│   │   │   ├── Chemistry Storage & Safety
│   │   │   ├── Parent & Community Communication
│   │   │   ├── Recommendation Letters
│   │   │   └── Grade & Comment Management
│   │   ├── Instructional Support Toolkit
│   │   │   ├── Curiosity Spark Generators
│   │   │   ├── Activity Generators
│   │   │   ├── Concept Development Tools
│   │   │   └── Instructional Resource Discovery
│   │   └── Resource Library
│   │       ├── Projects
│   │       ├── Lesson Activities
│   │       ├── Digital Tools & Applications
│   │       ├── Adaptive Technology Resources
│   │       ├── Laboratory Designs
│   │       └── Recurring Classroom Materials
│   │
│   └── Concordia
│       ├── Teaching
│       │   ├── Discussion Board Responses
│       │   ├── Instructor Feedback
│       │   └── Assignment Evaluation
│       └── Course Management
│           ├── Rubric Grading
│           ├── Course Refresh
│           ├── New Course Development
│           └── Curriculum Design
│
└── Consulting
    ├── Woven
    │   ├── Workshop Development
    │   ├── Strategy
    │   └── Invoicing
    │
    ├── Cycles of Learning
    │   ├── Blog Writing
    │   ├── Keynote Development
    │   └── Outreach
    │
    └── RamseyOS / App Development
        └── (This repo — development tracked externally)
```

## Workspace Registry Mapping

Each workspace maps to a directory under `src/workspaces/` and an entry in `config/workspaces.config.ts`.

| Workspace ID | Directory | Domain | Sub-areas |
|---|---|---|---|
| `sonoma` | `src/workspaces/sonoma/` | Schools | teaching, admin, toolkit, library |
| `concordia` | `src/workspaces/concordia/` | Schools | teaching, course-mgmt |
| `woven` | `src/workspaces/woven/` | Consulting | workshops, strategy, invoicing |
| `cycles` | `src/workspaces/cycles/` | Consulting | blog, keynotes, outreach |

## Workspace Boundaries

Each workspace:
- Has its own page routes under `src/app/(workspaces)/[workspace]/`
- Has its own components under `src/workspaces/[id]/components/`
- Declares its workflows in `config/workflows.config.ts` (tagged by workspace ID)
- Stores its data in Firestore collections namespaced by workspace ID
- Does **not** import from other workspaces

## Cross-Workspace Features

These shell features aggregate across all workspaces:

- **Today Dashboard** — pulls tasks, deadlines, and active workflows from all workspaces
- **Universal Inbox** — receives items tagged with any workspace
- **Approval Queue** — shows pending drafts from all workspace workflows
- **Tasks / Projects** — manages tasks that may belong to any workspace
- **Calendar** — shows events from all workspace contexts

## Future: RamseyOS / App Development Workspace

The app development workspace is not included in the initial build. Development work on RamseyOS itself is tracked in this repo's issues and roadmap, not inside the app.
