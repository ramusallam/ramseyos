# RamseyOS Architecture

## System Overview

RamseyOS is a monolithic Next.js application with a modular internal architecture. It runs as a single deployment on Vercel, with Firebase providing authentication, database (Firestore), and file storage.

```
┌─────────────────────────────────────────────────┐
│                   Shell (UI)                     │
│  Dashboard │ Inbox │ Queue │ Tasks │ Cal │ Admin │
├─────────────────────────────────────────────────┤
│                 Workspaces                       │
│   Sonoma  │  Concordia  │  Woven  │  Cycles     │
├─────────────────────────────────────────────────┤
│                  Engines                         │
│  Workflow │ Knowledge │ Integration │ Memory     │
│                 Model Router                     │
├─────────────────────────────────────────────────┤
│               Infrastructure                     │
│     Firebase  │  Vercel  │  External APIs        │
└─────────────────────────────────────────────────┘
```

## Layers

### Shell Layer

The shell is the top-level UI that persists across all views. It provides navigation, the Today Dashboard, Universal Inbox, Approval Queue, Tasks/Projects, Calendar, and Admin/Settings. The shell is workspace-agnostic — it surfaces items from all workspaces through unified views.

### Workspace Layer

Each workspace (Sonoma, Concordia, Woven, Cycles) is a self-contained module with its own pages, components, and workflow configurations. Workspaces do not import from each other. They interact with engines through defined APIs.

### Engine Layer

Engines are shared services that workspaces consume:

- **Workflow Engine** — Executes multi-step workflows defined in config. A workflow is a sequence of steps, each with a prompt template, model assignment, and input/output schema. The engine manages state transitions and draft creation.
- **Knowledge Engine** — Stores and retrieves structured knowledge: templates, examples, rubrics, playbooks. Workspaces register their knowledge sources; the engine provides query and retrieval.
- **Integration Engine** — Handles external system communication: Google Drive, Google Calendar, email APIs, file storage. Each integration is a provider with a standard interface.
- **Memory Engine** — Records decisions, outputs, and context over time. Provides recall for workflows that benefit from historical context (e.g., "how did I grade this type of assignment last time?").
- **Model Router** — Reads model assignment config and routes AI requests to the appropriate provider (Claude API, Gemini API). Exposes a single `complete()` interface that engines and workflows call.

### Infrastructure Layer

- **Firebase Auth** — User authentication (single user, but structured for auth patterns).
- **Firestore** — Primary database for all structured data.
- **Firebase Storage** — File uploads and attachments.
- **Vercel** — Hosting, edge functions, deployment.
- **External APIs** — Google Workspace, AI model providers.

## Key Architectural Decisions

### 1. Monorepo, not microservices

RamseyOS is one person's tool. A single Next.js app with clear internal module boundaries is simpler to maintain, deploy, and debug than distributed services. If a module grows too large, it can be extracted later.

### 2. Config-driven workflows

Workflow definitions live in TypeScript config files, not in component code. This means:
- New workflows can be added by writing config, not new pages.
- Prompt templates are separate files that can be edited independently.
- Model assignments can be changed without touching workflow logic.

### 3. Firestore as single database

Firestore provides real-time sync, offline capability (useful for future desktop wrapper), and requires zero server management. The schema is document-oriented, matching the workspace/workflow model naturally.

### 4. Server Components + API Routes

Next.js App Router server components handle data fetching. API routes handle mutations and AI model calls. Client components are used only where interactivity requires it (forms, real-time updates).

### 5. No ORM

Firestore doesn't benefit from an ORM. Data access uses a thin typed wrapper around the Firebase SDK, with TypeScript interfaces defining document shapes.

### 6. AI calls go through the Model Router

No component or workflow calls an AI API directly. All requests go through the Model Router, which:
- Looks up the model assignment for the task type
- Formats the request for the target provider
- Returns a normalized response

This ensures model swaps require only config changes.

## Module Communication

```
Workspace ──→ Workflow Engine ──→ Model Router ──→ AI Provider
                    │
                    ├──→ Knowledge Engine ──→ Firestore
                    │
                    └──→ Memory Engine ──→ Firestore

Shell ──→ reads from Firestore (tasks, inbox items, approvals)
Shell ──→ Workflow Engine (to trigger workflows)
```

Workspaces never call AI providers directly. The Workflow Engine orchestrates all multi-step processes. The Shell reads shared collections (tasks, inbox, approvals) that engines write to.

## Deployment

- **Production:** Vercel, automatic deploys from `main` branch.
- **Preview:** Vercel preview deployments on pull requests.
- **Environment:** Firebase project per environment (dev, prod) configured via `.env`.
