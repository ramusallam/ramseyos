# Rubric Feedback Playbook

**Workspace:** Concordia
**Workflow ID:** `concordia-rubric-feedback`

## Purpose

Evaluate graduate student assignments against course rubrics and generate detailed, constructive feedback. Feedback should support adult learners in improving their professional practice.

## Inputs

- **Student Submission** — The student's assignment text or content.
- **Rubric** — The course rubric with criteria and expectations.
- **Course Name** — The Concordia course.
- **Assignment Title** — The name of the assignment.

## Process

1. Parse the rubric and identify each criterion.
2. Evaluate the submission against each criterion.
3. Assign scores per criterion with clear rationale.
4. Write overall feedback that balances strengths with specific improvement areas.
5. Frame feedback in a way that respects graduate-level students as professional learners.

## Outputs

- Rubric-aligned feedback with per-criterion scores and constructive commentary in markdown.

## Notes

- Graduate students are adult professionals. Feedback tone should be collegial, not corrective.
- Scores must follow the rubric exactly. Do not adjust scales or add criteria.
- Point out connections between the student's work and real-world practice where relevant.
- All evaluations are drafts. Ramsey reviews and adjusts before returning to students.
