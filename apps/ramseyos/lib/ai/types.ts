// AI Backbone Types for RamseyOS

export type AIProvider = "claude" | "gemini";

export type AITaskType =
  | "reasoning"
  | "drafting"
  | "extraction"
  | "summarization"
  | "grading"
  | "planning";

export interface ModelAssignment {
  taskType: AITaskType;
  provider: AIProvider;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AIRequest {
  taskType: AITaskType;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  /** Override the default provider for this task type */
  providerOverride?: AIProvider;
}

export interface AIResponse {
  text: string;
  provider: AIProvider;
  model: string;
  tokensUsed?: number;
  durationMs: number;
  fromMock: boolean;
}

export interface AIError {
  message: string;
  provider: AIProvider;
  code?: string;
  retryable: boolean;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: "grading" | "communication" | "lesson-planning" | "reflection" | "general";
  taskType: AITaskType;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  description: string;
}
