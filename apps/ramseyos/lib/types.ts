/**
 * RamseyOS — Canonical Type Exports
 *
 * This file re-exports every domain type from its source module.
 * Import types from here instead of reaching into individual lib files.
 *
 *   import type { Task, Project, LessonPlan } from "@/lib/types";
 */

// ── Shared / Core ──────────────────────────────────────────────
export type { Priority, OperationalStatus } from "./shared";

// ── Tasks ──────────────────────────────────────────────────────
export type { Task } from "./tasks";

// ── Projects ───────────────────────────────────────────────────
export type { ProjectStatus, Project } from "./projects";

// ── Captures ───────────────────────────────────────────────────
export type {
  CaptureSource,
  CaptureType,
  SourceMeta,
  CaptureInput,
} from "./captures";

// ── Lesson Plans ───────────────────────────────────────────────
export type {
  SparkStatus,
  LessonStatus,
  MaterialItem,
  LessonPlan,
  LessonPlanUpdate,
} from "./lesson-plans";

// ── Rubrics ────────────────────────────────────────────────────
export type {
  RubricStatus,
  RubricLevel,
  RubricCriterion,
  Rubric,
} from "./rubrics";

// ── Grading Jobs ───────────────────────────────────────────────
export type {
  IntakeMethod,
  GradingJobStatus,
  CriterionScore,
  AIGradingAnalysis,
  GradingJob,
} from "./grading-jobs";

// ── Drafts / Communications ────────────────────────────────────
export type {
  DraftStatus,
  GmailHandoffStatus,
  DraftItem,
} from "./drafts";

// ── Templates ──────────────────────────────────────────────────
export type { TemplateItem } from "./templates";

// ── Groups ─────────────────────────────────────────────────────
export type { GroupItem, GroupMember } from "./groups";

// ── Admin Templates ────────────────────────────────────────────
export type {
  AdminTemplate,
  AdminTemplateCategory,
  AdminItemStatus,
  AdminItem,
} from "./admin-templates";

// ── Life ───────────────────────────────────────────────────────
export type {
  LifeItemCategory,
  LifeItemStatus,
  LifeItemFrequency,
  LifeItem,
} from "./life";

// ── Weekly Review ──────────────────────────────────────────────
export type { WeeklyReview } from "./weekly-review";

// ── Knowledge ──────────────────────────────────────────────────
export type { KnowledgeType, KnowledgeEntry } from "./knowledge";

// ── Products ───────────────────────────────────────────────────
export type {
  ProductStatus,
  ProductCategory,
  Product,
} from "./products";

// ── Tools ──────────────────────────────────────────────────────
export type { ToolEnvironment, ToolItem } from "./tools";

// ── Vendors ────────────────────────────────────────────────────
export type { VendorItem } from "./vendors";

// ── Reflections ────────────────────────────────────────────────
export type { Reflection } from "./reflections";

// ── Workflows ──────────────────────────────────────────────────
export type { WorkflowStep, Workflow } from "./workflows";

// ── Daily Tasks ────────────────────────────────────────────────
export type { DailyTask } from "./daily-tasks";

// ── Orchestration ──────────────────────────────────────────────
export type {
  TimelineItemType,
  TimelineItem,
  LifeContextItem,
  DayMode,
  DailyPlan,
} from "./orchestration";

// ── Calendar ───────────────────────────────────────────────────
export type { CalendarEvent } from "./calendar";

// ── Standards ──────────────────────────────────────────────────
export type { Standard } from "./standards";

// ── Units ──────────────────────────────────────────────────────
export type { Unit } from "./units";

// ── Build Contexts ─────────────────────────────────────────────
export type { BuildContextCategory, BuildContext } from "./build-contexts";

// ── Recents ────────────────────────────────────────────────────
export type { RecentItem } from "./recents";

// ── Activity Log ───────────────────────────────────────────────
export type {
  ActivityAction,
  ActivityObjectType,
  ActivityEntry,
} from "./activity-log";
