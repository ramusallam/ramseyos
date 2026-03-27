/**
 * AI grading pipeline — prompt builder + stub.
 *
 * Builds real prompts for rubric-aligned grading. The actual model call
 * is a stub that returns mock analysis. When the Model Router is built,
 * replace `callModel()` with a real call.
 */

import type { RubricCriterion } from "./rubrics";
import type { AIGradingAnalysis, CriterionScore } from "./grading-jobs";

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

/* ── Stub model call ── */

async function callModel(_prompt: string): Promise<string> {
  // Stub — returns empty string. Replace with real Model Router call.
  return "";
}

/* ── Run grading analysis ── */

export async function runGradingAnalysis(params: {
  assignmentName: string;
  studentWork: string;
  criteria: RubricCriterion[];
}): Promise<AIGradingAnalysis> {
  const prompt = buildGradingPrompt(params);

  // Attempt real call (currently a stub)
  await callModel(prompt);

  // Return mock analysis until model router is live
  const criterionScores: CriterionScore[] = params.criteria.map((c) => {
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
