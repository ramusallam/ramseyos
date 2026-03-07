# RamseyOS Data Model

## Overview

All structured data lives in Firestore. Collections are organized by domain entity, not by workspace. Workspace isolation is achieved through a `workspaceId` field on documents.

## Core Types

### User

Single-user system, but structured for proper auth patterns.

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Timestamp;
}
```

### Workspace

Declared in config, not stored in Firestore. The config is the source of truth.

```typescript
interface WorkspaceConfig {
  id: string;                    // "sonoma" | "concordia" | "woven" | "cycles"
  label: string;                 // Display name
  domain: "schools" | "consulting";
  subAreas: SubAreaConfig[];
  icon: string;                  // Icon identifier
  color: string;                 // Theme color
}

interface SubAreaConfig {
  id: string;                    // "teaching" | "admin" | "toolkit" | etc.
  label: string;
  description: string;
}
```

### Task

```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: "inbox" | "active" | "waiting" | "done" | "archived";
  priority: "high" | "medium" | "low";
  workspaceId: string;
  subAreaId: string;
  projectId?: string;
  dueDate?: Timestamp;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Project

```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  status: "active" | "paused" | "completed" | "archived";
  workspaceId: string;
  subAreaId: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### InboxItem

Captures anything that enters the system before it's been processed.

```typescript
interface InboxItem {
  id: string;
  content: string;
  source: "manual" | "email" | "integration" | "ai";
  workspaceId?: string;          // May be unassigned on capture
  processedAt?: Timestamp;
  createdAt: Timestamp;
}
```

### Approval

AI-generated drafts awaiting user review.

```typescript
interface Approval {
  id: string;
  workflowId: string;
  workflowRunId: string;
  workspaceId: string;
  title: string;
  content: string;               // The draft output
  context: Record<string, any>;  // Input data that produced this draft
  status: "pending" | "approved" | "rejected" | "revised";
  reviewedAt?: Timestamp;
  createdAt: Timestamp;
}
```

### WorkflowRun

A single execution of a workflow.

```typescript
interface WorkflowRun {
  id: string;
  workflowId: string;           // References workflow config
  workspaceId: string;
  status: "running" | "awaiting_review" | "completed" | "failed";
  currentStep: number;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  startedAt: Timestamp;
  completedAt?: Timestamp;
}
```

### WorkflowConfig

Declared in config files, not Firestore.

```typescript
interface WorkflowConfig {
  id: string;
  label: string;
  description: string;
  workspaceId: string;
  subAreaId: string;
  steps: WorkflowStepConfig[];
  tags: string[];
}

interface WorkflowStepConfig {
  id: string;
  label: string;
  type: "ai_generate" | "user_input" | "review" | "transform";
  promptTemplateId?: string;     // References a prompt template file
  modelAssignment?: string;      // Key into models.config.ts
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
}
```

### ModelAssignment

Declared in config.

```typescript
interface ModelAssignmentConfig {
  taskType: string;              // "reasoning" | "drafting" | "extraction" | etc.
  provider: "claude" | "gemini";
  model: string;                 // Specific model ID
  description: string;
  maxTokens?: number;
  temperature?: number;
}
```

### PromptTemplate

Stored as individual files in `config/prompts/`.

```typescript
interface PromptTemplate {
  id: string;
  label: string;
  systemPrompt: string;
  userPromptTemplate: string;    // Supports {{variable}} interpolation
  variables: string[];           // Expected variable names
  modelAssignment: string;       // Key into models.config.ts
}
```

### MemoryEntry

Long-term memory records.

```typescript
interface MemoryEntry {
  id: string;
  workspaceId: string;
  subAreaId?: string;
  type: "decision" | "output" | "context" | "preference";
  content: string;
  metadata: Record<string, any>;
  tags: string[];
  createdAt: Timestamp;
}
```

### KnowledgeItem

Reusable knowledge artifacts.

```typescript
interface KnowledgeItem {
  id: string;
  workspaceId: string;
  type: "template" | "example" | "rubric" | "playbook" | "resource";
  title: string;
  content: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Firestore Collections

```
/users/{uid}
/tasks/{taskId}
/projects/{projectId}
/inbox/{itemId}
/approvals/{approvalId}
/workflowRuns/{runId}
/memory/{entryId}
/knowledge/{itemId}
```

All collections use flat structure with `workspaceId` field for filtering. Firestore composite indexes will be created as query patterns emerge.

## Indexing Strategy

Start with these composite indexes:

- `tasks`: `workspaceId` + `status` + `dueDate`
- `tasks`: `status` + `priority` + `createdAt`
- `approvals`: `status` + `createdAt`
- `workflowRuns`: `workspaceId` + `status`
- `inbox`: `processedAt` (null = unprocessed)
- `memory`: `workspaceId` + `type` + `createdAt`

## Conventions

- All documents include `createdAt` and `updatedAt` timestamps.
- IDs are auto-generated by Firestore unless there's a reason for deterministic IDs.
- Deleted items are soft-deleted via `status: "archived"` where applicable.
- No deeply nested subcollections. Keep the structure flat and query with indexes.
