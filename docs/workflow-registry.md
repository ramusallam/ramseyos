# RamseyOS Workflow Registry

## What It Is

The Workflow Registry is the central catalog of every automated workflow in RamseyOS. Each workflow is a JSON definition file that declares what the workflow does, what it needs, what it produces, which AI model handles it, and how its output is reviewed.

The registry lives at `packages/workflows/definitions/`. Each file is a single workflow. All files conform to `packages/workflows/schemas/workflow-definition.schema.json`.

## Why RamseyOS Needs It

RamseyOS is config-driven. Workflow behavior should be declared, not coded. The registry provides:

- **Discoverability.** Any workflow can be found by scanning the definitions directory. The shell, dashboard, and admin panels read these definitions to populate workflow menus.
- **Consistency.** Every workflow follows the same structural contract: inputs, outputs, model assignment, review policy. This makes the Workflow Engine generic — it executes definitions rather than containing per-workflow logic.
- **Editability.** Changing a workflow's model, inputs, or review policy is a JSON edit, not a code change. This is critical for long-term solo maintainability.
- **Auditability.** The registry is version-controlled. The history of how workflows evolved is in git.

## Workflow Definition Fields

Each workflow definition JSON includes:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Unique kebab-case identifier (e.g., `sonoma-lesson-planning`) |
| `name` | string | Human-readable display name |
| `workspace` | string | Owning workspace ID (`sonoma`, `concordia`, `woven`, `cycles`) |
| `category` | string | Functional category within the workspace (e.g., `teaching`, `admin`, `writing`) |
| `description` | string | One-sentence summary of what this workflow does |
| `inputs` | array of objects | Required inputs: each has `name`, `type`, and `description` |
| `outputs` | array of objects | Expected outputs: each has `name`, `type`, and `description` |
| `aiTaskType` | string | The type of AI work (`reasoning`, `drafting`, `extraction`, `summarization`) |
| `preferredModel` | string | Default model assignment (e.g., `claude-opus`) |
| `fallbackModel` | string | Backup model if preferred is unavailable (e.g., `gemini-pro`) |
| `reviewRequired` | boolean | Whether output goes to Approval Queue before finalization |
| `playbook` | string | Relative path to the matching playbook markdown file |
| `status` | string | Lifecycle state: `draft`, `active`, `deprecated` |

## How Definitions Connect to the System

### Definitions to Playbooks

Each workflow definition has a `playbook` field pointing to a markdown file in `packages/playbooks/`. The playbook is human-readable guidance: purpose, process description, quality expectations, and notes. The definition is the machine-readable contract; the playbook is the human-readable companion.

### Definitions to AI Task Types

The `aiTaskType` field categorizes the cognitive work. This maps to model assignment groups in `config/models.config.ts`:

- `reasoning` — planning, synthesis, multi-step thinking (Claude Opus)
- `drafting` — writing, responding, composing (Claude Opus)
- `extraction` — pulling data from documents, images, files (Gemini)
- `summarization` — condensing long content (Gemini)

### Definitions to Models

`preferredModel` and `fallbackModel` are human-readable model labels. The Model Router resolves these to specific provider + model ID combinations using `config/models.config.ts`. Changing a model assignment means editing the definition JSON — no code changes.

### Definitions to Inputs and Outputs

`inputs` declares what data the workflow needs to start. The Workflow Engine uses this to generate input forms or validate programmatic triggers. `outputs` declares what the workflow produces, which determines what gets stored and what goes to the Approval Queue.

### Definitions to Review Policy

`reviewRequired: true` means the workflow's output is routed to the Approval Queue. The user must approve, reject, or revise before the output is finalized. This enforces the Review Before Publish principle for all AI-generated content.

## File Organization

```text
packages/
├── workflows/
│   ├── schemas/
│   │   └── workflow-definition.schema.json
│   └── definitions/
│       ├── sonoma-lesson-planning.json
│       ├── sonoma-rubric-grading.json
│       ├── sonoma-recommendation-letters.json
│       ├── concordia-discussion-board.json
│       ├── concordia-rubric-feedback.json
│       ├── woven-workshop-development.json
│       └── cycles-blog-writing.json
├── playbooks/
│   ├── sonoma/
│   │   ├── lesson-planning.md
│   │   ├── rubric-grading.md
│   │   └── recommendation-letters.md
│   ├── concordia/
│   │   ├── discussion-board.md
│   │   └── rubric-feedback.md
│   ├── woven/
│   │   └── workshop-development.md
│   └── cycles/
│       └── blog-writing.md
```

## Adding a New Workflow

1. Create a new JSON file in `packages/workflows/definitions/` conforming to the schema.
2. Create a matching playbook in `packages/playbooks/[workspace]/`.
3. Set `status` to `draft` until the workflow is tested.
4. The Workflow Engine and shell will discover it automatically from the definitions directory.
