import type { AIProvider, AIResponse, AIRequest } from "./types";
import { MODEL_ASSIGNMENTS } from "./config";

/**
 * Call Claude API via fetch (server-side only).
 */
async function callClaude(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ text: string; tokensUsed?: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  const tokensUsed = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
  return { text, tokensUsed };
}

/**
 * Call Gemini API via fetch (server-side only).
 */
async function callGemini(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  maxTokens: number
): Promise<{ text: string; tokensUsed?: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const tokensUsed = data.usageMetadata?.totalTokenCount;
  return { text, tokensUsed };
}

/**
 * Generate a mock response for development/demo when no API key is available.
 */
function generateMockResponse(request: AIRequest): string {
  const mocks: Record<string, string> = {
    grading: "## AI Grading Analysis\n\nThis is a placeholder analysis. Configure ANTHROPIC_API_KEY to enable real AI grading.\n\n**Overall**: The student demonstrates understanding of core concepts with room for deeper analysis.\n\n**Strengths**: Clear structure, good use of terminology.\n\n**Areas for improvement**: Could provide more supporting evidence.",
    drafting: "## Draft\n\nThis is a placeholder draft. Configure your API key to enable AI-assisted drafting.\n\n[Your content would appear here with contextual suggestions based on your template and audience.]",
    planning: "## Lesson Plan Suggestion\n\nThis is a placeholder. Configure your API key to enable AI-assisted lesson planning.\n\n**Engage**: Start with a thought-provoking question.\n**Explore**: Hands-on investigation.\n**Explain**: Student-led discussion.\n**Elaborate**: Apply to new context.\n**Evaluate**: Formative check.",
    summarization: "## Weekly Summary\n\nThis is a placeholder summary. Configure your API key to enable AI-assisted reflection.\n\n[Your weekly patterns, accomplishments, and suggested focus areas would appear here.]",
    reasoning: "## Analysis\n\nThis is a placeholder analysis. Configure your API key to enable AI reasoning.\n\n[Detailed analysis would appear here.]",
    extraction: "## Extracted Information\n\nThis is a placeholder. Configure your API key to enable AI extraction.\n\n[Structured data would appear here.]",
  };
  return mocks[request.taskType] || mocks.reasoning;
}

/**
 * Route an AI request to the appropriate provider and return the response.
 * Falls back to mock if provider is not configured.
 */
export async function callProvider(request: AIRequest): Promise<AIResponse> {
  const assignment = MODEL_ASSIGNMENTS[request.taskType];
  const provider: AIProvider = request.providerOverride ?? assignment.provider;
  const model = assignment.model;
  const temperature = request.temperature ?? assignment.temperature;
  const maxTokens = request.maxTokens ?? assignment.maxTokens;

  // Check if we're on the server and have the key
  const hasKey =
    typeof window === "undefined" &&
    ((provider === "claude" && !!process.env.ANTHROPIC_API_KEY) ||
     (provider === "gemini" && !!process.env.GEMINI_API_KEY));

  if (!hasKey) {
    // Return mock response
    return {
      text: generateMockResponse(request),
      provider,
      model,
      durationMs: 0,
      fromMock: true,
    };
  }

  const start = Date.now();
  try {
    const callFn = provider === "claude" ? callClaude : callGemini;
    const result = await callFn(model, request.systemPrompt, request.userPrompt, temperature, maxTokens);
    return {
      text: result.text,
      provider,
      model,
      tokensUsed: result.tokensUsed,
      durationMs: Date.now() - start,
      fromMock: false,
    };
  } catch (err) {
    console.error(`[AI Provider Error] ${provider}:`, err);
    // Fallback to mock on error
    return {
      text: generateMockResponse(request) + "\n\n---\n*AI call failed — showing placeholder. Check API key and try again.*",
      provider,
      model,
      durationMs: Date.now() - start,
      fromMock: true,
    };
  }
}
