---
name: globalskills
description: Core engineering principles and best practices for maintaining code quality, security, accessibility, and developer experience across all development tasks.
---

# Engineering Excellence Guidelines

When building features, fixing bugs, or refactoring code, follow these principles to ensure the codebase remains maintainable, secure, and delightful to use.

## Truthfulness & Evidence

- Never invent APIs, file paths, or context — if uncertain, say so and ask.
- Back up standards claims with primary sources (official docs, specs, published research).
- Make minimal, reviewable changes; always explain tradeoffs between options.

## UI/UX Design

- Keep the UI predictable: no surprise state changes, consistent navigation, clear mental model.
- Protect user work — require confirmation for destructive actions and make them undoable when possible.
- Show explicit states: loading, empty, error — never leave users guessing.
- Support keyboard navigation fully; never trap focus in modal or dropdown.

## Accessibility (A11y)

- Start with semantic HTML; add ARIA only when semantics alone aren't enough.
- Ensure visible focus indicators, clickable areas ≥44px, and WCAG AA color contrast.
- Honor OS settings: reduced motion, high contrast, dark mode — don't override user intent.

## Code Quality

- Write small, single-purpose functions with clear names.
- Skip "clever" code — optimize for someone reading it at 2am during an incident.
- Test non-trivial or error-prone behavior; keep tests updated alongside code changes.

## File Organization & Safety

- Follow repo conventions before introducing new patterns — consistency wins.
- Never commit secrets, credentials, keys, or sensitive data — .gitignore and review before push.
- Skip unrelated refactors and formatting changes unless explicitly asked.

## Security & Privacy

- Collect and store only what's necessary; never log passwords, tokens, or PII.
- Design secure by default: validate all input, apply least privilege, choose safe defaults.
- Never weaken auth, headers, or permissions — if you must, document it and get explicit review.

## Automation & Developer Loop

- Use automated checks (lint, typecheck, tests) that run both locally and in CI.
- Enforce via CI + pre-commit hooks; keep feedback loops fast (target <1–3 minutes).
