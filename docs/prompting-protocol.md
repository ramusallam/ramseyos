# RamseyOS Prompting Protocol

## Overview

All AI interactions in RamseyOS follow a structured protocol. No component or workflow calls an AI model directly. Every AI request flows through the Model Router using a registered prompt template.

## Request Flow

```
User Action
  → Workflow Engine (selects workflow step)
    → Prompt Template (loaded from config/prompts/)
      → Variable Interpolation (fills in context)
        → Model Router (selects provider based on config)
          → AI Provider API (Claude or Gemini)
            → Response
              → Workflow Engine (stores result, advances step)
                → Approval Queue (if review step)
```

## Prompt Template Structure

Each prompt template is a TypeScript file in `config/prompts/`:

```typescript
// config/prompts/sonoma-lesson-plan.ts
export const sonomaLessonPlan = {
  id: "sonoma-lesson-plan",
  label: "Sonoma Academy Lesson Plan Generator",
  modelAssignment: "reasoning",    // Key into models.config.ts
  systemPrompt: `You are an instructional design assistant for a high school
chemistry and physics teacher. You create detailed, inquiry-driven lesson plans
that emphasize student curiosity and conceptual understanding.`,
  userPromptTemplate: `Create a lesson plan for the following:

Topic: {{topic}}
Course: {{course}}
Duration: {{duration}}
Learning Objectives: {{objectives}}
Prior Knowledge: {{priorKnowledge}}

Include: warm-up activity, main investigation, student reflection, and assessment check.`,
  variables: ["topic", "course", "duration", "objectives", "priorKnowledge"],
};
```

## Variable Interpolation

Templates use `{{variableName}}` syntax. The Workflow Engine resolves variables from:

1. **User input** — form fields collected during the workflow step.
2. **Workflow context** — outputs from previous steps in the same workflow run.
3. **Knowledge Engine** — retrieved templates, rubrics, or examples.
4. **Memory Engine** — historical context relevant to the current task.

Variables are validated before the prompt is sent. Missing required variables cause the workflow to pause and request input.

## Model Assignment

The `modelAssignment` field on a prompt template is a key into `config/models.config.ts`:

```typescript
// config/models.config.ts
export const modelAssignments = {
  reasoning: {
    taskType: "reasoning",
    provider: "claude",
    model: "claude-opus-4-6",
    description: "Complex reasoning, planning, synthesis",
    temperature: 0.7,
  },
  drafting: {
    taskType: "drafting",
    provider: "claude",
    model: "claude-opus-4-6",
    description: "Nuanced writing, letters, responses",
    temperature: 0.8,
  },
  extraction: {
    taskType: "extraction",
    provider: "gemini",
    model: "gemini-2.5-pro",
    description: "Document analysis, multimodal, file processing",
    temperature: 0.3,
  },
  summarization: {
    taskType: "summarization",
    provider: "gemini",
    model: "gemini-2.5-pro",
    description: "Long context summarization, content digestion",
    temperature: 0.5,
  },
};
```

To swap a model: change the `provider` and `model` fields. No code changes required.

## Prompt Design Rules

### System Prompts

- State the assistant's role and domain clearly.
- Include constraints (tone, length, format) in the system prompt, not the user prompt.
- Keep system prompts under 500 words. Longer context goes into the user prompt as reference material.

### User Prompts

- Structure with clear sections and labels.
- Put variable content in clearly delimited blocks.
- End with an explicit instruction for the output format.
- Never ask the model to "be creative" or "surprise me." Be specific about what's needed.

### Output Format

- Specify the expected output format in the prompt (markdown, JSON, structured sections).
- For drafts that go to the Approval Queue, output should be ready-to-use text, not meta-commentary.
- If structured data is needed, request JSON and validate the response.

## Review Protocol

All AI outputs follow the Review Before Publish principle:

1. **Generate** — AI produces a draft via the workflow.
2. **Store** — Draft is saved as an Approval document.
3. **Review** — User sees the draft in the Approval Queue.
4. **Act** — User approves (finalizes), rejects (discards), or revises (edits manually, then approves).

No AI output is ever published, sent, or finalized without explicit user approval.

## Context Injection

Workflows can inject additional context into prompts:

- **Knowledge items** — rubrics, templates, examples pulled from the Knowledge Engine.
- **Memory entries** — past outputs or decisions from the Memory Engine.
- **File content** — documents or data extracted via the Integration Engine.

Context is injected into the user prompt template as additional sections, clearly labeled:

```
--- REFERENCE: Grading Rubric ---
{{rubricContent}}
--- END REFERENCE ---
```

## Error Handling

- If an AI call fails, the workflow step is marked as failed with the error.
- The workflow pauses, and the user is notified.
- Retries are manual — the user can re-run the failed step.
- No automatic retries or fallback models. Model assignment is intentional.

## Token and Cost Awareness

- Each AI call logs the token count (input + output) and the model used.
- This data is stored on the WorkflowRun document for visibility.
- No hard token limits in Phase 1, but the logging enables future budgeting.
