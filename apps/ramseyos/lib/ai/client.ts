import type { AIResponse } from "./types";

/**
 * Client-side AI caller. Sends requests to /api/ai which handles
 * server-side model routing and API key management.
 */
export async function requestAI(params: {
  templateId?: string;
  variables?: Record<string, string>;
  taskType?: string;
  systemPrompt?: string;
  userPrompt?: string;
}): Promise<AIResponse> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: "AI request failed" }));
    throw new Error(data.error || `AI request failed: ${res.status}`);
  }

  return res.json();
}
