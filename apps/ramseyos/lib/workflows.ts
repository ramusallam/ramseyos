/**
 * Workflow pattern registry for RamseyOS.
 *
 * Defines the app's known repeatable workflows as data — not an engine.
 * Each workflow maps to real routes and describes its steps.
 *
 * Used by: dashboard Quick Launch, future playbook system.
 */

export interface WorkflowStep {
  label: string;
  route?: string;
}

export interface Workflow {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: "teach" | "work" | "ops";
  icon: string;
  entryRoute: string;
  steps: WorkflowStep[];
  /** Whether this workflow shows in the dashboard Quick Launch. */
  quickLaunch: boolean;
  /** Tags for matching relevant knowledge/playbook entries. */
  knowledgeTags: string[];
}

export const WORKFLOWS: Workflow[] = [
  {
    id: "quick-capture",
    name: "Quick Capture",
    shortName: "Capture",
    description: "Capture a thought, task, or idea and send it to your inbox for triage.",
    category: "work",
    icon: "M8 3.5v9M3.5 8h9",
    entryRoute: "/capture",
    steps: [
      { label: "Capture", route: "/capture" },
      { label: "Inbox", route: "/inbox" },
      { label: "Triage" },
      { label: "Task / Note / Idea" },
    ],
    quickLaunch: false,
    knowledgeTags: ["work", "capture"],
  },
  {
    id: "new-lesson-plan",
    name: "New Lesson Plan",
    shortName: "Lesson plan",
    description: "Create a lesson plan, attach materials, and connect to Spark Learning.",
    category: "teach",
    icon: "M3 2.5h10a1 1 0 011 1v9a1 1 0 01-1 1H3a1 1 0 01-1-1v-9a1 1 0 011-1z",
    entryRoute: "/lesson-plans",
    steps: [
      { label: "Create plan", route: "/lesson-plans" },
      { label: "Add materials" },
      { label: "Link Spark" },
      { label: "Deploy" },
    ],
    quickLaunch: true,
    knowledgeTags: ["teach", "lesson-planning", "spark", "pedagogy"],
  },
  {
    id: "draft-communication",
    name: "Draft Communication",
    shortName: "Draft comms",
    description: "Create a communication draft from a template, review, and hand off to Gmail.",
    category: "ops",
    icon: "M2 3h12a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4a1 1 0 011-1z",
    entryRoute: "/communications",
    steps: [
      { label: "Select template", route: "/communications" },
      { label: "Choose group" },
      { label: "Generate draft" },
      { label: "Review & edit" },
      { label: "Gmail handoff" },
    ],
    quickLaunch: true,
    knowledgeTags: ["ops", "communications"],
  },
  {
    id: "grade-with-rubric",
    name: "Grade with Rubric",
    shortName: "Grade",
    description: "Grade student work using a structured rubric. Requires desktop for webcam.",
    category: "teach",
    icon: "M2 2h12v12H2zM5 5.5h6M5 8h6M5 10.5h4",
    entryRoute: "/grading",
    steps: [
      { label: "Select rubric", route: "/rubrics" },
      { label: "Capture work", route: "/grading" },
      { label: "Score" },
      { label: "Record grade" },
    ],
    quickLaunch: true,
    knowledgeTags: ["teach", "grading"],
  },
  {
    id: "draft-recommendation",
    name: "Draft Recommendation",
    shortName: "Recommendation",
    description: "Generate a recommendation letter from student data and review before sending.",
    category: "ops",
    icon: "M3 3h10v2H3zM5 7h6M5 10h4",
    entryRoute: "/communications",
    steps: [
      { label: "Select student" },
      { label: "Generate draft" },
      { label: "Review & edit" },
      { label: "Export / send" },
    ],
    quickLaunch: true,
    knowledgeTags: ["ops", "communications"],
  },
  {
    id: "material-sourcing",
    name: "Material Sourcing",
    shortName: "Source materials",
    description: "Find materials, match to vendors, and create purchase requests.",
    category: "teach",
    icon: "M3 3h10a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z",
    entryRoute: "/materials",
    steps: [
      { label: "Identify need", route: "/materials" },
      { label: "Find vendor", route: "/vendors" },
      { label: "Create request", route: "/purchasing" },
      { label: "Track delivery" },
    ],
    quickLaunch: false,
    knowledgeTags: ["teach", "materials", "purchasing"],
  },
];

/** Get workflows that should appear in the dashboard Quick Launch. */
export function getQuickLaunchWorkflows(): Workflow[] {
  return WORKFLOWS.filter((w) => w.quickLaunch);
}

/** Get all workflows grouped by category. */
export function getWorkflowsByCategory(): Record<string, Workflow[]> {
  const groups: Record<string, Workflow[]> = {};
  for (const w of WORKFLOWS) {
    (groups[w.category] ??= []).push(w);
  }
  return groups;
}

/** Look up a single workflow by ID. */
export function getWorkflow(id: string): Workflow | undefined {
  return WORKFLOWS.find((w) => w.id === id);
}
