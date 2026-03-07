# Docs Directory — Claude Code Instructions

When working with files in this directory:

- These docs are the source of truth for RamseyOS architecture and conventions.
- Read the relevant doc before making changes that touch the area it covers.
- If a code change contradicts a doc, update the doc to match the new decision — do not leave docs stale.
- Keep docs concise and structural. No marketing language or aspirational content.
- Use TypeScript code blocks for type definitions and config examples.
- Use ASCII diagrams (not images) for architecture visuals.

## Doc Index

| File | Purpose |
| --- | --- |
| `architecture.md` | System layers, module communication, deployment |
| `workspace-map.md` | Full domain/workspace hierarchy, registry mapping |
| `data-model.md` | Firestore schema, TypeScript interfaces, collections |
| `ui-principles.md` | Layout, component conventions, interaction patterns |
| `prompting-protocol.md` | Prompt templates, model routing, review protocol |
| `roadmap-phase-1.md` | Current build priorities and milestone checklist |
