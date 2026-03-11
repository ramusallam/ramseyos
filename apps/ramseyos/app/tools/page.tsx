"use client";

import Link from "next/link";

interface ToolItem {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
}

const CATEGORY_STYLE: Record<string, string> = {
  "teaching": "bg-sky-50 text-sky-600",
  "publishing": "bg-violet-50 text-violet-600",
  "accessibility": "bg-emerald-50 text-emerald-600",
  "simulation": "bg-amber-50 text-amber-600",
  "classroom": "bg-rose-50 text-rose-600",
};

const TOOLS: ToolItem[] = [
  {
    id: "spark-learning",
    title: "Spark Learning Inquiry Studio",
    description: "AI-powered inquiry lesson builder for science educators.",
    category: "teaching",
    url: "https://sparklearningstudio.ai",
  },
  {
    id: "cycles-blog",
    title: "Cycles of Learning Blog",
    description: "Research-backed writing on teaching, learning, and inquiry.",
    category: "publishing",
    url: "https://cyclesoflearning.com",
  },
  {
    id: "xbox-adaptive",
    title: "Xbox Adaptive Controller Emulator",
    description: "Accessibility controller emulator for inclusive classroom use.",
    category: "accessibility",
    url: "#",
  },
  {
    id: "chem-sim",
    title: "Chemistry Simulation",
    description: "Interactive molecular and reaction simulations for students.",
    category: "simulation",
    url: "#",
  },
  {
    id: "classroom-timer",
    title: "Classroom Timer",
    description: "Minimal timer and pacing tool for class activities.",
    category: "classroom",
    url: "#",
  },
];

export default function ToolsPage() {
  return (
    <div className="max-w-4xl px-8 pt-10 pb-20">
      {/* Header */}
      <header className="mb-10">
        <Link
          href="/"
          className="text-[11px] tracking-wide text-muted hover:text-foreground/60 transition-colors"
        >
          &larr; Today
        </Link>
        <h1 className="text-xl font-normal text-foreground mt-2">
          Tools &amp; Resources
        </h1>
        <p className="text-[13px] text-muted mt-1">
          Launch external tools and resources from one place.
        </p>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolItem }) {
  const isExternal = tool.url !== "#";

  return (
    <a
      href={tool.url}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group bg-surface rounded-xl border border-border p-5 shadow-card transition-all hover:shadow-card-hover hover:border-border-strong"
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
            CATEGORY_STYLE[tool.category] ?? "bg-gray-50 text-muted"
          }`}
        >
          {tool.category}
        </span>
        {isExternal && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-muted/30 group-hover:text-muted/60 transition-colors shrink-0"
          >
            <path
              d="M4.5 2H10v5.5M10 2L3 9"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <h3 className="text-[14px] font-medium text-foreground/90 mb-1 group-hover:text-foreground transition-colors">
        {tool.title}
      </h3>
      <p className="text-[12px] text-muted leading-relaxed">
        {tool.description}
      </p>
    </a>
  );
}
