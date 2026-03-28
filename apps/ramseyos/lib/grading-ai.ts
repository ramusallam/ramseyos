/**
 * AI grading pipeline — prompt builder + real AI backbone integration.
 *
 * Builds rubric-aligned prompts and routes them through the AI backbone.
 * Falls back to mock analysis if the AI response can't be parsed.
 */

import type { RubricCriterion } from "./rubrics";
import type { AIGradingAnalysis, CriterionScore } from "./grading-jobs";
import { requestAI } from "@/lib/ai/client";

/* ── Prompt builder ── */

export function buildGradingPrompt(params: {
  assignmentName: string;
  studentWork: string;
  criteria: RubricCriterion[];
}): string {
  const criteriaBlock = params.criteria
    .map(
      (c) =>
        `Criterion: ${c.label} (${c.maxPoints} pts)\n` +
        `Description: ${c.description}\n` +
        `Levels:\n` +
        c.levels.map((l) => `  - ${l.label} (${l.points} pts): ${l.description}`).join("\n")
    )
    .join("\n\n");

  return `You are an expert teacher grading student work against a structured rubric.

Assignment: ${params.assignmentName}

RUBRIC:
${criteriaBlock}

STUDENT WORK:
${params.studentWork}

For each criterion, provide:
1. A score (integer within the level range)
2. Brief reasoning for the score
3. Specific, constructive feedback for the student

Then provide:
- Overall feedback (2-3 sentences, warm and constructive)
- Key strengths (bullet points)
- Areas for improvement (bullet points)
- Confidence level (high/medium/low) based on how clearly the work maps to criteria`;
}

/* ── Mock fallback ── */

function buildMockAnalysis(criteria: RubricCriterion[]): AIGradingAnalysis {
  const criterionScores: CriterionScore[] = criteria.map((c) => {
    const midLevel = c.levels[Math.floor(c.levels.length / 2)] ?? c.levels[0];
    return {
      criterionId: c.id,
      criterionLabel: c.label,
      score: midLevel?.points ?? Math.round(c.maxPoints * 0.7),
      maxPoints: c.maxPoints,
      reasoning: "AI analysis pending — model router not yet connected.",
      feedback: "Detailed feedback will appear once AI grading is fully enabled.",
    };
  });

  const totalScore = criterionScores.reduce((s, c) => s + c.score, 0);
  const totalPossible = criterionScores.reduce((s, c) => s + c.maxPoints, 0);

  return {
    criterionScores,
    totalScore,
    totalPossible,
    overallFeedback:
      "This is a placeholder analysis. Connect the Model Router to enable AI-powered grading with detailed, rubric-aligned feedback.",
    strengths: ["Placeholder — real strengths analysis pending"],
    improvements: ["Placeholder — real improvement suggestions pending"],
    confidence: "low",
  };
}

/* ── Run grading analysis ── */

export async function runGradingAnalysis(params: {
  assignmentName: string;
  studentWork: string;
  criteria: RubricCriterion[];
}): Promise<AIGradingAnalysis> {
  const criteriaBlock = params.criteria
    .map(
      (c) =>
        `Criterion: ${c.label} (${c.maxPoints} pts)\n` +
        `Description: ${c.description}\n` +
        `Levels:\n` +
        c.levels.map((l) => `  - ${l.label} (${l.points} pts): ${l.description}`).join("\n")
    )
    .join("\n\n");

  try {
    const response = await requestAI({
      templateId: "grading-rubric-analysis",
      variables: {
        assignmentName: params.assignmentName,
        rubricCriteria: criteriaBlock,
        studentWork: params.studentWork,
      },
    });

    // Try to parse structured JSON from the AI response
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as AIGradingAnalysis;
      // Validate minimum expected shape
      if (
        Array.isArray(parsed.criterionScores) &&
        typeof parsed.totalScore === "number" &&
        typeof parsed.overallFeedback === "string"
      ) {
        return parsed;
      }
    }

    // AI responded but not parseable JSON — fall back to mock
    console.warn("[Grading AI] Response was not parseable JSON, using mock fallback");
    return buildMockAnalysis(params.criteria);
  } catch (err) {
    console.error("[Grading AI] AI request failed, using mock fallback:", err);
    return buildMockAnalysis(params.criteria);
  }
}
