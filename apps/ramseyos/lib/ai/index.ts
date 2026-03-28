// RamseyOS AI Backbone — Public API
// Import from @/lib/ai for all AI operations

export type {
  AIProvider,
  AITaskType,
  AIRequest,
  AIResponse,
  AIError,
  ModelAssignment,
  PromptTemplate,
} from "./types";

export { route, getProviderForTask, interpolate } from "./router";
export { getPromptTemplate, getTemplatesByCategory, listTemplates } from "./prompts";
export { MODEL_ASSIGNMENTS, isProviderConfigured } from "./config";
export { requestAI } from "./client";
