# RamseyOS Phase 1 Roadmap: Foundation + Shell

## Goal

Establish the working application skeleton: project setup, shell UI, navigation, config system, and one end-to-end workflow proof of concept. No workspace features yet — just the infrastructure that all future features will build on.

## Phase 1 Milestones

### M1: Project Setup

- [ ] Initialize Next.js project with App Router and TypeScript
- [ ] Configure Tailwind CSS (dark mode first)
- [ ] Set up Firebase project (dev environment)
- [ ] Configure Firebase SDK (auth, Firestore, storage)
- [ ] Set up environment variables (`.env.local`)
- [ ] Configure Vercel project and first deploy
- [ ] Set up `tsconfig.json` path aliases (`@/` for `src/`)
- [ ] Create base directory structure per `CLAUDE.md`

### M2: Config System

- [ ] Create `config/workspaces.config.ts` with all four workspaces and sub-areas
- [ ] Create `config/models.config.ts` with initial model assignments
- [ ] Create `config/workflows.config.ts` with empty registry (populated in M5)
- [ ] Create shared TypeScript types in `src/types/`
- [ ] Validate that config types are consistent with data model types

### M3: Auth + Firebase Foundation

- [ ] Implement Firebase Auth sign-in (email/password, single user)
- [ ] Create auth context provider
- [ ] Add route protection (redirect to login if unauthenticated)
- [ ] Set up Firestore security rules (single-user lockdown)
- [ ] Create typed Firestore helpers in `src/lib/firebase/`
- [ ] Test basic Firestore read/write from the app

### M4: Shell UI

- [ ] Build shell layout: side nav + top bar + main content area
- [ ] Implement side nav with shell sections and workspace entries
- [ ] Build Today Dashboard page (empty state — placeholder structure)
- [ ] Build Universal Inbox page (empty state)
- [ ] Build Approval Queue page (empty state)
- [ ] Build Tasks page (empty state)
- [ ] Build Admin/Settings page (shows current config values)
- [ ] Set up URL routing: `/dashboard`, `/inbox`, `/queue`, `/tasks`, `/settings`
- [ ] Set up workspace routing: `/sonoma`, `/concordia`, `/woven`, `/cycles`
- [ ] Dark mode toggle in settings

### M5: Workflow Engine (Minimal)

- [ ] Build Model Router: reads `models.config.ts`, exposes `complete()` function
- [ ] Add API route for AI model calls (`/api/ai/complete`)
- [ ] Build prompt template loader: reads from `config/prompts/`, interpolates variables
- [ ] Build minimal Workflow Engine: can execute a single-step workflow
- [ ] Create one proof-of-concept workflow config (e.g., a simple draft generator)
- [ ] Create the matching prompt template
- [ ] Wire workflow execution to create an Approval document in Firestore
- [ ] Show the resulting approval in the Approval Queue page
- [ ] Implement approve/reject actions on approvals

### M6: Task System (Basic)

- [ ] Create task CRUD operations (Firestore)
- [ ] Build task list view on the Tasks page
- [ ] Add task creation form (title, workspace, priority, due date)
- [ ] Add status transitions (inbox → active → done)
- [ ] Show active tasks on the Today Dashboard
- [ ] Show task counts per workspace in the side nav

## What Phase 1 Does NOT Include

- No workspace-specific features or pages
- No Knowledge Engine implementation
- No Memory Engine implementation
- No Integration Engine (Google Drive, Calendar, etc.)
- No multi-step workflows (single step only in M5)
- No file uploads
- No mobile optimization
- No onboarding or tutorial flows

## Success Criteria

Phase 1 is complete when:

1. The app deploys to Vercel and loads behind auth.
2. The shell layout renders with working navigation across all sections.
3. Config files define workspaces and model assignments, and the app reads them.
4. A single proof-of-concept workflow can be triggered, calls an AI model via the Model Router, produces a draft, and surfaces it in the Approval Queue.
5. Tasks can be created, listed, and status-transitioned.
6. The Today Dashboard shows active tasks.

## Build Order

```
M1 (setup) → M2 (config) → M3 (auth) → M4 (shell) → M5 (workflow) → M6 (tasks)
```

Each milestone builds on the previous. Do not skip ahead. Complete and verify each milestone before starting the next.
