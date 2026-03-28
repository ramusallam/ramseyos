import type { ModelAssignment, AITaskType } from "./types";

/**
 * Model assignments — the source of truth for which model handles each task type.
 * Swappable without code changes: just edit these assignments.
 */
export const MODEL_ASSIGNMENTS: Record<AITaskType, ModelAssignment> = {
  reasoning: {
    taskType: "reasoning",
    provider: "claude",
    model: "claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: 4096,
  },
  drafting: {
    taskType: "drafting",
    provider: "claude",
    model: "claude-sonnet-4-20250514",
    temperature: 0.8,
    maxTokens: 4096,
  },
  extraction: {
    taskType: "extraction",
    provider: "gemini",
    model: "gemini-2.5-flash",
    temperature: 0.3,
    maxTokens: 2048,
  },
  summarization: {
    taskType: "summarization",
    provider: "gemini",
    model: "gemini-2.5-flash",
    temperature: 0.5,
    maxTokens: 2048,
  },
  grading: {
    taskType: "grading",
    provider: "claude",
    model: "claude-sonnet-4-20250514",
    temperature: 0.4,
    maxTokens: 4096,
  },
  planning: {
    taskType: "planning",
    provider: "claude",
    model: "claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: 4096,
  },
};

/**
 * Check if a provider API key is configured.
 * Keys are server-side only — accessed via API routes.
 */
export function isProviderConfigured(provider: "claude" | "gemini"): boolean {
  if (typeof window !== "undefined") return false; // client-side can't check
  if (provider === "claude") return !!process.env.ANTHROPIC_API_KEY;
  if (provider === "gemini") return !!process.env.GEMINI_API_KEY;
  return false;
}
