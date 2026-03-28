import type { AIRequest, AIResponse, AITaskType, AIProvider } from "./types";
import { callProvider } from "./providers";
import { MODEL_ASSIGNMENTS } from "./config";

/**
 * RamseyOS Model Router
 *
 * The single entry point for all AI requests in the app.
 * Routes requests to the correct provider based on task type configuration.
 *
 * Usage:
 *   const response = await route({ taskType: "grading", systemPrompt: "...", userPrompt: "..." });
 */
export async function route(request: AIRequest): Promise<AIResponse> {
  const assignment = MODEL_ASSIGNMENTS[request.taskType];
  if (!assignment) {
    throw new Error(`[Model Router] Unknown task type: ${request.taskType}`);
  }

  console.log(`[Model Router] Routing ${request.taskType} → ${assignment.provider}/${assignment.model}`);
  return callProvider(request);
}

/**
 * Get the configured provider for a task type (for UI display purposes).
 */
export function getProviderForTask(taskType: AITaskType): { provider: AIProvider; model: string } {
  const assignment = MODEL_ASSIGNMENTS[taskType];
  return { provider: assignment.provider, model: assignment.model };
}

/**
 * Interpolate variables into a prompt template.
 * Variables use {{variableName}} syntax.
 */
export function interpolate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
