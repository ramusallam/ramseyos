# RamseyOS UI Principles

## Design Philosophy

RamseyOS is a productivity tool, not a showcase. The UI should feel like an operating system shell: fast, dense, and functional. Every pixel should serve a purpose. The interface should get out of the way and let work happen.

## Layout Structure

### Shell Layout

The shell is a persistent frame around all content:

```
┌──────────────────────────────────────────────┐
│  Top Bar: context breadcrumb, quick actions  │
├──────┬───────────────────────────────────────┤
│      │                                       │
│ Side │         Main Content Area             │
│ Nav  │                                       │
│      │                                       │
│      │                                       │
├──────┴───────────────────────────────────────┤
│  Status Bar (optional): active workflow info │
└──────────────────────────────────────────────┘
```

- **Side Nav:** Collapsed by default, shows icons for shell sections and workspaces. Expands on hover or click.
- **Top Bar:** Shows current location (workspace > sub-area > view), plus quick-access actions (new task, new inbox item).
- **Main Content Area:** Full width minus the nav. No fixed sidebars in content area — use slide-out panels when needed.
- **Status Bar:** Optional, shows active workflow progress or pending approvals count.

### Responsive Behavior

- **Desktop (1024px+):** Full shell layout with persistent side nav.
- **Tablet (768-1023px):** Collapsed nav, full content area.
- **Mobile (< 768px):** Bottom nav, stacked content. Mobile is secondary — optimize for desktop first, but don't break mobile.

## Component Principles

### Density

- Default to compact spacing. This is a power-user tool.
- Use `text-sm` as the base body size, `text-xs` for metadata and labels.
- Tables and lists should show many items without excessive whitespace.

### Color

- Neutral base: gray scale for structure and chrome.
- Each workspace gets a subtle accent color for identification (set in workspace config).
- Status colors: consistent across the app (green = done, amber = waiting, blue = active, red = failed/urgent).
- Dark mode from the start. Build dark-first, light as secondary.

### Typography

- System font stack (`font-sans` in Tailwind). No custom fonts.
- Headings: semibold, minimal size escalation (`text-lg` max for page titles).
- Body: regular weight. Use weight and color, not size, to create hierarchy.

### Cards and Surfaces

- Cards for discrete items (tasks, approvals, inbox items).
- Flat design — minimal shadows, use subtle borders for separation.
- No rounded corners larger than `rounded-md`.

### Forms and Inputs

- Inline editing where possible (click to edit a task title).
- Minimal modals. Use slide-out panels for forms that need context alongside existing content.
- Always show what will happen before it happens (preview before submit).

### Tables and Lists

- Default view for collections is a dense list or table, not cards.
- Sortable columns where applicable.
- Keyboard navigable.

## Interaction Patterns

### Navigation

- Workspace switching via side nav.
- Shell sections (Dashboard, Inbox, Queue, Tasks, Calendar, Settings) are top-level nav items.
- Within a workspace, sub-areas are secondary nav.
- URL structure mirrors navigation: `/dashboard`, `/inbox`, `/sonoma/teaching`, etc.

### Workflows

- Workflows are initiated from within a workspace or from the Tasks view.
- Multi-step workflows show a step indicator with current position.
- Each step renders its own input form or display.
- The final step always routes to the Approval Queue, never auto-publishes.

### Approval Queue

- List of pending drafts with preview.
- Actions: approve, reject, revise (opens editor).
- Approve = finalize. Reject = discard. Revise = edit and re-approve.

### Keyboard Shortcuts

- Plan for keyboard shortcuts from the start.
- `Cmd+K` or `/` for command palette (future).
- Arrow keys for list navigation.
- `Enter` to open, `Escape` to close panels.

## Technical Constraints

- **Tailwind CSS only.** No CSS modules, styled-components, or inline styles beyond Tailwind.
- **Server Components by default.** Client Components only where interactivity requires it.
- **No component library.** Build from Tailwind primitives. If a component library is needed later, evaluate then.
- **No animations** except functional transitions (panel open/close, loading states). No decorative motion.
- **Accessible.** Semantic HTML, ARIA labels on interactive elements, keyboard navigation support.
