# RamseyOS Structural Review — March 2026

## 1. Current Repo Structure Summary

The repo is organized as a loose monorepo with a Next.js app nested inside `apps/ramseyos/`. Here's the actual state of what exists on disk (excluding `node_modules`, `.next`, and `.git`):

```
/
├── CLAUDE.md                         # Claude Code instructions (well-written)
├── README.md                         # Empty
├── package.json                      # Root — only firebase + firebase-admin
├── next-step.md                      # Session planning note
├── session-01-notes.md               # Session log
├── ramseyos-master-architecture-v1.md  # Original architecture vision
│
├── docs/                             # 11 architecture docs (strong)
│   ├── architecture.md
│   ├── core-objects.md
│   ├── daily-card.md
│   ├── data-model.md
│   ├── prompting-protocol.md
│   ├── roadmap-phase-1.md
│   ├── shell-navigation.md
│   ├── today-dashboard.md
│   ├── ui-principles.md
│   ├── workflow-registry.md
│   └── workspace-map.md
│
├── specs/                            # 11 JSON schemas
│   ├── approval-item.schema.json
│   ├── calendar-item.schema.json
│   ├── daily-card.schema.json
│   ├── dashboard-view.schema.json
│   ├── dashboard-widget.schema.json
│   ├── project.schema.json
│   ├── quick-capture-entry.schema.json
│   ├── reflection-entry.schema.json
│   ├── resource-item.schema.json
│   ├── tasks.schema.json
│   └── workflow-run.schema.json
│
├── packages/
│   ├── ai/                           # Empty
│   ├── core/                         # Empty
│   ├── integrations/                 # Empty
│   ├── ui/                           # Empty
│   ├── playbooks/                    # 7 markdown playbooks (real content)
│   │   ├── sonoma/
│   │   ├── concordia/
│   │   ├── woven/
│   │   └── cycles/
│   └── workflows/
│       ├── schemas/workflow-definition.schema.json
│       └── definitions/              # 7 workflow JSON definitions (real content)
│
├── skills/                           # Empty
│
└── apps/ramseyos/                    # Next.js application
    ├── app/
    │   ├── layout.tsx                # Root layout (dark mode, Geist fonts)
    │   ├── page.tsx                  # Today Dashboard (static prototype)
    │   ├── quick-capture.tsx         # Quick Capture component (functional)
    │   ├── inbox/page.tsx            # Inbox page (functional, reads Firestore)
    │   ├── globals.css               # Custom properties + Tailwind theme
    │   └── favicon.ico
    ├── lib/
    │   ├── firebase.ts               # Client SDK init
    │   └── firebase-admin.ts         # Empty file
    ├── package.json                  # App deps: Next 16, React 19, Firebase, Tailwind 4
    ├── tsconfig.json
    └── public/                       # Default Next.js SVGs
```

**What exists and works:** The documentation layer is thorough. The workflow definitions and playbooks are real, well-structured content. Quick Capture writes to Firestore. The Inbox reads from Firestore in real time. The Today Dashboard is a static visual prototype with hardcoded data. The design system (globals.css) is clean and intentional.

**What doesn't exist yet:** No `config/` directory. No `src/` directory. No engines. No types. No components directory. No auth. No shell layout. None of the directory structure described in CLAUDE.md actually exists in the application code yet.

---

## 2. Inconsistencies and Early Structural Problems

### The planned structure doesn't match the actual structure

CLAUDE.md describes a flat Next.js project with `src/app/`, `src/components/`, `src/engines/`, `src/workspaces/`, `src/lib/`, `src/types/`, and a top-level `config/` directory. The actual app lives inside `apps/ramseyos/` — a monorepo nesting pattern. This means every path reference in CLAUDE.md is wrong relative to where code actually lives. When Claude Code follows the instructions in CLAUDE.md, it will create files in the wrong place.

**Fix now:** Decide which structure you're using. Either move everything out of `apps/ramseyos/` into the root (simpler for a solo project), or update CLAUDE.md to reflect the `apps/ramseyos/` nesting. The flat structure is recommended — you don't need a monorepo wrapper for a single app.

### Duplicate dependency management

Firebase is installed at both the root `package.json` and inside `apps/ramseyos/package.json`. The root `package.json` has no `name`, no `scripts`, no `workspaces` config — it's not set up as a proper monorepo. The app has its own `package-lock.json` and `node_modules`, while the root also has `node_modules`.

**Fix now:** If you go flat (recommended), delete the root `package.json` and `package-lock.json`, move everything under `apps/ramseyos/` to the root, and keep one `package.json`.

### Empty placeholder directories

`packages/ai/`, `packages/core/`, `packages/integrations/`, `packages/ui/`, and `skills/` are all empty. They were presumably created during an early planning session but serve no purpose yet and create confusion about where code should go. The `packages/` naming implies a monorepo with publishable packages, which conflicts with the single-app architecture described in the docs.

**Fix now:** Delete empty directories. Let the structure emerge from real code, not from anticipated structure.

### `specs/` and `packages/workflows/schemas/` overlap

JSON schemas live in two places: `specs/` at the root and `packages/workflows/schemas/`. The `specs/` schemas describe Firestore document shapes (tasks, approvals, etc.) while the workflow schema describes workflow definitions. Having two schema locations with different conventions will become confusing.

**Fix now:** Consolidate into one location. A single `schemas/` or `specs/` directory at the root (or inside the app) is cleaner than splitting them.

### Firestore collection naming mismatch

The data model doc defines an `InboxItem` type and says the collection is `/inbox/{itemId}`. But Quick Capture writes to a `"captures"` collection, and the Inbox page reads from `"captures"`. The data model also defines an `InboxItem` with fields like `source`, `workspaceId`, and `processedAt` — but Quick Capture writes `{ text, status, createdAt }` with none of those fields. The schema and the code have already diverged.

**Fix now:** Either update the data model to match what you're actually building (a `captures` collection with the current shape), or update Quick Capture to write `InboxItem` documents to the `inbox` collection. The longer you wait, the more orphaned data accumulates in Firestore.

### The Today Dashboard is fully hardcoded

`page.tsx` contains hardcoded items like "Review AP Chemistry homework", "Period 2 — AP Chemistry", etc. These are realistic but static. The component also defines 7 inline sub-components (`Section`, `SectionLabel`, `Badge`, `CardItem`, `ActionButton`, `Approval`) that will need to be extracted as the app grows. This is fine for a prototype, but the hardcoded data violates the CLAUDE.md rule: "Do not create mock data or placeholder content."

**Guidance:** This is acceptable for a visual proof of concept, but flag it clearly (a comment at the top like `// PROTOTYPE: hardcoded data, will be replaced with Firestore reads`) so future sessions don't mistake it for real implementation.

### `firebase-admin.ts` is empty

The file exists but contains no code. It's imported nowhere. This is a dead file that will confuse future sessions.

**Fix now:** Delete it until you actually need server-side Firebase Admin (which you will for API routes in M5).

---

## 3. Recommendations for Keeping the System Scalable

### Flatten the structure now, before more code exists

This is the single highest-impact change. With only 4 source files, moving from `apps/ramseyos/` to the root is trivial now and painful later. A solo-developer Next.js app doesn't benefit from monorepo nesting. Every file path, every import, every CLAUDE.md reference gets simpler.

### Create the `src/` directory structure incrementally

CLAUDE.md describes `src/engines/`, `src/workspaces/`, `src/components/`, etc. Don't create these as empty directories. Instead, create each directory when you write its first file. This keeps the repo honest — every directory contains real code.

### Establish a shared types file early

The data model doc defines `Task`, `InboxItem`, `Approval`, `WorkflowRun`, etc. as TypeScript interfaces. These should exist as actual `.ts` files that the app imports — not just documentation. Create `src/types/` with the core types from `data-model.md` so that Quick Capture, Inbox, and all future features share the same type definitions.

### Keep the `config/` directory for app config only

The current plan puts workflow definitions, prompt templates, model assignments, and workspace config all under `config/`. This makes sense. But `packages/workflows/definitions/` and `packages/playbooks/` currently hold workflow content outside this boundary. Decide where workflow definitions live: either in `config/workflows/` (matching CLAUDE.md) or in `packages/workflows/` (matching current reality). Don't maintain both locations.

### Use Firestore security rules from the start

The roadmap mentions this in M3, but even before auth is implemented, set up basic Firestore rules that lock the database to authenticated users. Right now the `captures` collection is presumably open, which is fine for dev but easy to forget.

---

## 4. Naming and Folder Organization Improvements

### Rename `packages/` to avoid monorepo confusion

The `packages/` directory currently holds playbooks and workflow definitions — these aren't packages in the npm sense. Rename to `content/` or move the contents into `config/`:

```
config/
├── workflows/           # Workflow JSON definitions
├── playbooks/           # Markdown playbooks
├── prompts/             # Prompt templates (future)
├── workspaces.config.ts
├── models.config.ts
└── workflows.config.ts
```

This aligns content with the config-driven philosophy described in the architecture docs.

### Rename `specs/` to `schemas/`

"Specs" is vague. These are JSON schemas. Call them that.

### Move loose root files into `docs/`

`ramseyos-master-architecture-v1.md`, `session-01-notes.md`, and `next-step.md` are documentation and session artifacts sitting at the repo root. Move them:

```
docs/
├── architecture/
│   ├── master-architecture-v1.md
│   └── architecture.md
├── sessions/
│   └── session-01-notes.md
└── ...existing docs...
```

Or simply move them into `docs/` flat if you don't want subdirectories yet.

### Standardize the component location

Quick Capture lives at `app/quick-capture.tsx` — a client component sitting directly in the `app/` directory alongside page routes. Next.js convention (and CLAUDE.md) says components go in `src/components/`. Even before you create the full structure, move it to `components/shell/quick-capture.tsx` or `components/capture/quick-capture.tsx`.

---

## 5. Risks That Could Create Technical Debt

### Risk: The documentation layer outpaces the code layer

You have 11 detailed architecture docs, 11 JSON schemas, 7 workflow definitions, 7 playbooks, and a comprehensive CLAUDE.md. You have 4 source files. The documentation describes a system that doesn't exist yet, with specifics about how engines communicate, how the model router works, how prompt templates interpolate variables. If the actual implementation diverges from these specs (which it will — it always does), the docs become misleading. Future Claude Code sessions will follow stale instructions.

**Mitigation:** After each milestone, review the docs that relate to what you just built and update them to match reality. Treat docs as living documents, not upfront specs.

### Risk: Workflow definitions are JSON but prompts are planned as TypeScript

The workflow definitions in `packages/workflows/definitions/` are JSON files. The prompting protocol doc shows prompt templates as TypeScript files in `config/prompts/`. The workflow definition references a `playbook` path (markdown) but has no field for `promptTemplate`. These three content types (JSON definitions, TypeScript prompts, markdown playbooks) are loosely coupled by convention but have no enforced relationship. As workflows multiply, keeping these three artifacts in sync will require discipline.

**Mitigation:** Consider whether workflow definitions should reference prompt template IDs explicitly, and whether a single validation script can check that every workflow definition has a matching prompt and playbook.

### Risk: No TypeScript path aliases resolve correctly

`tsconfig.json` defines `"@/*": ["./*"]` which maps `@/lib/firebase` to `./lib/firebase` relative to the app root (`apps/ramseyos/`). This works now because source files are in the app directory. But CLAUDE.md describes paths like `src/lib/` and `src/engines/` — if you create a `src/` directory, the path alias needs updating. This kind of small misalignment causes confusing import errors.

**Mitigation:** When you flatten the repo structure, update tsconfig paths to match (likely `"@/*": ["./src/*"]`).

### Risk: No error boundaries or loading states

The Inbox page has a basic loading state, but there's no error handling if the Firestore connection fails, if the user isn't authenticated, or if the query returns unexpected data. Quick Capture has a `try/finally` but silently swallows errors. As more features are added, silent failures will make debugging difficult.

**Mitigation:** Establish an error handling pattern now — even a simple toast or inline error message — so future features follow the pattern.

### Risk: Client-side Firestore with no auth gate

Quick Capture and Inbox both use the client-side Firebase SDK to read/write Firestore directly. There's no auth check in the app. This works for local dev, but the moment you deploy, the database is either open to anyone or blocked to everyone (depending on Firestore rules). The roadmap puts auth in M3, but features that write to Firestore already exist (M1).

**Mitigation:** This is the natural next priority. Don't add more Firestore-connected features until auth exists.

### Risk: The `"captures"` collection creates an early data silo

Quick Capture writes to `captures` with `{ text, status, createdAt }`. The data model defines `inbox` with `{ content, source, workspaceId, processedAt, createdAt }`. If users start capturing real data into `captures` during dev, that data won't match the schema when you build the real inbox. You'll either need a migration or you'll lose the early data.

**Mitigation:** Either align Quick Capture to the `InboxItem` schema now (writing to `inbox` collection with the documented fields), or accept that `captures` is throwaway dev data.

---

## Summary of Priority Actions

Ordered by impact and urgency:

1. **Flatten the repo** — move `apps/ramseyos/` contents to root, eliminate the monorepo wrapper
2. **Update CLAUDE.md** to match the actual (post-flatten) directory structure
3. **Align Quick Capture** with the `InboxItem` data model (or document the divergence)
4. **Create `src/types/`** with the core TypeScript interfaces from the data model doc
5. **Consolidate schema locations** — merge `specs/` and `packages/workflows/schemas/` into one place
6. **Delete empty directories** — `packages/ai/`, `packages/core/`, `packages/integrations/`, `packages/ui/`, `skills/`, `firebase-admin.ts`
7. **Move loose root files** into `docs/`
8. **Add a prototype comment** to the Today Dashboard so future sessions know it's hardcoded
