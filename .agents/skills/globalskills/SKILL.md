---
name: globalskills
description: Core engineering principles and best practices for maintaining code quality, security, accessibility, and developer experience across all development tasks.
---

# Global Skills & Engineering Guidelines

A comprehensive set of principles to guide implementation decisions across feature development, debugging, refactoring, and code reviews. These guidelines prioritize clarity, safety, and maintainability.

## Truthfulness and evidence

- Do not invent APIs, file paths, or repository context. If unsure, state uncertainty and ask for clarification.
- When making factual statements about standards or best practices, cite primary sources (official docs / standards / original papers).
- Prefer minimal changes that are easy to review; explain tradeoffs when multiple options exist.

## UI/UX behavior

- Design for clarity, consistency, and predictable navigation; avoid surprise UI state changes.
- Preserve user work: destructive actions require confirmation and should be undoable when feasible.
- Provide clear loading, empty, and error states; never leave the UI ambiguous.
- Always include keyboard support for interactive elements; do not trap focus.

## Accessibility (baseline)

- Use semantic HTML first; ARIA only when needed and only when correct.
- Maintain visible keyboard focus, sufficient target sizes, and sufficient contrast.
- Respect user preferences (reduced motion, increased contrast, dark mode) when the platform exposes them.

## Code readability and correctness

- Prefer small, composable functions and descriptive names.
- Avoid “clever” code; optimize for maintainability and debuggability.
- Add tests when behavior is non-trivial or bug-prone; update tests when changing behavior.

## File organization and edit safety

- Follow existing repository conventions first; don’t introduce new patterns without a clear win.
- Never commit secrets, credentials, or private keys.
- Avoid large refactors unrelated to the task; do not churn formatting unless explicitly requested.

## Security and privacy

- Collect/store the minimum data required; avoid logging sensitive data.
- Default to secure-by-design patterns: input validation, least privilege, safe defaults.
- Do not weaken security headers, authentication, or authorization without an explicit rationale and review plan.

## Automation and workflow

- Prefer automated checks (lint, typecheck, tests) runnable locally and in CI.
- Propose enforcement via CI + pre-commit hooks; keep developer feedback fast (<1–3 minutes for pre-commit).
