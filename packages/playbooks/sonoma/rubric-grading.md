# Rubric Grading Playbook

**Workspace:** Sonoma Academy
**Workflow ID:** `sonoma-rubric-grading`

## Purpose

Evaluate student work against a provided rubric. Produce structured feedback that is criterion-specific, constructive, and consistent with the rubric's scoring framework.

## Inputs

- **Student Work** — The student's submission (text, response, lab report, etc.).
- **Rubric** — The grading rubric with criteria, descriptors, and point values.
- **Course** — The course this assignment belongs to.
- **Assignment Name** — The name of the assignment being graded.

## Process

1. Read the rubric carefully and identify each criterion.
2. Evaluate the student work against each criterion independently.
3. Assign a score per criterion with a brief justification.
4. Write overall feedback that highlights strengths and areas for improvement.
5. Maintain a fair, encouraging, and specific tone throughout.

## Outputs

- A structured evaluation with per-criterion scores and written feedback in markdown.

## Notes

- Feedback should be actionable. Tell the student what to do differently, not just what was wrong.
- Scores must strictly follow the rubric. Do not invent criteria or adjust scales.
- The AI evaluation is always a draft. Ramsey reviews and adjusts scores and feedback before returning to students.
- For ambiguous student work, flag the ambiguity rather than guessing intent.
