# RamseyOS — Claude Code Instructions

## Project Overview

RamseyOS is a personal AI operating system for one person's professional life (educator, consultant, researcher, developer). It is a web-first app deployed on Vercel with Firebase backend, built solo in Claude Code.

**Stack:** Next.js (App Router) + TypeScript + Firebase + Tailwind CSS + Vercel
**Repo root:** This directory is the monorepo root.

## Architecture Rules

- **Modular boundaries.** Every workspace, engine, and shell component is a self-contained module. Do not create cross-module imports except through defined engine APIs.
- **Config over hardcoding.** Workflow behavior, prompt templates, model assignments, and policies live in config files or Firestore documents — never hardcoded in components.
- **Review before publish.** AI-generated outputs always produce drafts for user review. Never auto-publish or auto-send.
- **Web-first, desktop-ready.** Build for the browser. Avoid APIs that require Node.js or Electron. A desktop wrapper may come later.
- **No premature abstraction.** Write concrete code. Do not create utility libraries, base classes, or framework layers until a pattern repeats at least three times.

## Directory Structure

```
/
├── CLAUDE.md              # This file — root instructions for Claude Code
├── docs/                  # Architecture docs, roadmap, data model
├── config/                # App-wide config: workflows, models, workspaces
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/
│   │   ├── shell/         # Shell UI: dashboard, inbox, calendar, etc.
│   │   └── shared/        # Shared UI primitives (button, card, modal)
│   ├── engines/
│   │   ├── workflow/      # Workflow Engine
│   │   ├── knowledge/     # Knowledge Engine
│   │   ├── integration/   # Integration Engine
│   │   ├── memory/        # Memory Engine
│   │   └── model-router/  # AI Model Router
│   ├── workspaces/
│   │   ├── sonoma/        # Sonoma Academy workspace modules
│   │   ├── concordia/     # Concordia workspace modules
│   │   ├── woven/         # Woven workspace modules
│   │   └── cycles/        # Cycles of Learning workspace modules
│   ├── lib/               # Shared utilities (Firebase client, auth, etc.)
│   └── types/             # Shared TypeScript types
├── public/
└── tests/
```

## Coding Conventions

- **TypeScript** for all source files. Strict mode. No `any` unless unavoidable.
- **Named exports** only. No default exports except Next.js pages/layouts.
- **File naming:** `kebab-case.ts` for files, `PascalCase` for components.
- **One component per file.** Colocate component-specific types in the same file.
- **Tailwind CSS** for styling. No CSS modules, no styled-components.
- **Config files** use TypeScript (`*.config.ts`) so they get type checking.

## Config-Driven Patterns

These objects are defined in `config/` and loaded at runtime:

- **Workspace registry** (`config/workspaces.config.ts`) — declares all workspaces, their sub-areas, and metadata.
- **Workflow registry** (`config/workflows.config.ts`) — declares all workflow definitions: steps, prompts, model assignments.
- **Model assignments** (`config/models.config.ts`) — maps task types to AI models. Must be manually swappable.
- **Prompt templates** (`config/prompts/`) — one file per prompt template, referenced by workflow configs.

## AI Model Rules

- Claude Opus: reasoning, nuanced writing, workflow planning, complex synthesis.
- Gemini: extraction, multimodal processing, file-heavy tasks, long context.
- Model assignments are declared in config, never hardcoded in engine logic.
- The Model Router reads config to determine which model handles each task.
- All assignments must be swappable without code changes.

## Domain Structure

**Top-level domains:** Schools, Consulting
**Schools:** Sonoma Academy, Concordia
**Consulting:** Woven, Cycles of Learning, RamseyOS/App Dev

Each domain maps to a workspace directory under `src/workspaces/`.

## Shell Components

The shell is the primary daily interface:

- Today Dashboard — priorities, tasks, deadlines, active workflows
- Universal Inbox — capture for ideas, tasks, notes, requests
- Approval Queue — AI drafts awaiting user review
- Tasks / Projects — structured task and project management
- Calendar — scheduling integration
- Admin / Settings — config panels for workflows, models, prompts

## Working With This Repo

- Read `docs/architecture.md` for system design decisions.
- Read `docs/workspace-map.md` for the full workspace hierarchy.
- Read `docs/data-model.md` for Firestore schema and core types.
- Read `docs/ui-principles.md` for layout and component conventions.
- Read `docs/prompting-protocol.md` for how prompts and AI interactions work.
- Read `docs/roadmap-phase-1.md` for current build priorities.

## Commit Conventions

- Prefix commits: `feat:`, `fix:`, `docs:`, `config:`, `refactor:`, `test:`
- Keep commits focused — one logical change per commit.
- Do not commit generated files, `.env`, or Firebase credentials.

## What NOT to Do

- Do not build features that aren't on the current phase roadmap.
- Do not install packages without checking if an existing dependency covers the need.
- Do not create mock data or placeholder content — use real config structures.
- Do not add comments explaining obvious code. Only comment non-obvious decisions.
- Do not create README files in subdirectories unless explicitly asked.
