# Production Readiness TODO

This checklist tracks production-hardening work identified during the deep audit.

## 1) Database and Query Performance

- [x] Add Prisma indexes for high-frequency filters/sorts used by API routes.
- [x] Create and apply migration for new indexes.
- [x] Validate migration status and schema sync in local DB.

## 2) API Scalability

- [x] Add pagination to admin list endpoints:
  - [x] `/api/admin/users`
  - [x] `/api/admin/clients`
  - [x] `/api/admin/invites`
  - [x] `/api/admin/properties`
  - [x] `/api/admin/consultations`
  - [x] `/api/admin/interest-requests`
  - [x] `/api/admin/advisors`
  - [x] `/api/admin/price-updates`
- [x] Include pagination metadata (`page`, `limit`, `total`, `hasMore`) in responses.

## 3) Input Validation and Contract Safety

- [x] Add Zod validation for write endpoints and remove unchecked `request.json() as ...` flows.
- [x] Normalize and validate query parameters (`page`, `limit`, `status`, etc.).
- [x] Return consistent 400 payloads for validation failures.

## 4) Rate-Limit Lifecycle

- [x] Add stale `RateLimitBucket` cleanup strategy.
- [x] Ensure cleanup runs continuously without requiring manual jobs.

## 5) Runtime and Container Hardening

- [x] Replace Dockerfile with multi-stage production image.
- [x] Run app as non-root user in container.
- [x] Use deterministic/pinned base images where possible.
- [x] Pin service image versions in `docker-compose`.
- [x] Add healthchecks for Postgres and Valkey.
- [x] Fix Postgres data volume path.

## 6) Tooling and CI Standards

- [x] Migrate lint script off deprecated `next lint` to ESLint CLI.
- [x] Add CI workflow for lint/build/basic tests.
- [x] Ensure scripts are deterministic (`npm ci` in CI).

## 7) Developer Experience and Documentation

- [x] Repair malformed `README.md` content and command blocks.
- [x] Document production env vars and startup flow.
- [x] Add/update `.env.example` with required variables.
- [x] Add cache + rate-limit operational notes.

## 8) Verification

- [x] `npm run lint` passes.
- [x] `npm run build` passes.
- [x] Custom route/cache checks pass.
- [x] Prisma validation + migration status pass.

## 9) Database Ops Maturity

- [x] Add repeatable backup command with retention (`npm run db:backup`).
- [x] Add restore command with explicit destructive confirmation (`npm run db:restore`).
- [x] Document rollback/runbook process in `docs/database-ops.md`.
- [x] Add DB monitoring snapshot command (`npm run db:monitor`).
- [ ] Roll out managed DB alerting dashboards in infra (outside app repo).

## 10) Observability Completeness

- [x] Add structured JSON logging utility and wire critical auth/admin/client error paths.
- [x] Add machine-readable health endpoint for DB/cache (`/api/system/health`).
- [x] Add request correlation IDs across middleware/API/Sentry tags (`x-request-id`).
- [x] Propagate correlation/request IDs through email/notification async actions.
- [x] Add Prometheus metrics endpoint and local alerting stack baseline (`/api/system/metrics` + `docker-compose.monitoring.yml`).
- [ ] Add external metrics dashboards + paging alerts in infra (outside app repo).
- [ ] Propagate correlation/request IDs through future queue/worker pipelines.
