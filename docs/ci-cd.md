# CI/CD enforcement

This repository uses two GitHub Actions workflows:

- `CI` (`.github/workflows/ci.yml`)
- `Deploy` (`.github/workflows/deploy.yml`)

## CI gates (PR + main)

`CI` enforces these checks:

1. Install dependencies (`npm ci`)
2. Prisma migration drift check (`./scripts/check-prisma-migrations.sh`)
3. Prisma validation/generation (`prisma validate`, `prisma generate`)
4. Prisma migration apply/status check on ephemeral Postgres (`prisma migrate deploy`, `prisma migrate status`)
5. Lint (`npm run lint`)
6. Build (`npm run build`)
7. Tests (`npm run test:ci`)

## Migration safety rule

If `prisma/schema.prisma` changes in a PR, CI requires a migration file under:

- `prisma/migrations/<timestamp_name>/migration.sql`

Failing to include one will fail CI.

## Deploy flow

`Deploy` runs a preflight gate before any deployment:

- same quality checks as CI (lint/build/tests + Prisma checks)

Then:

- `deploy-staging`
  - runs automatically on push to `main`
  - also available via manual dispatch with `target=staging`
  - triggers `DEPLOY_STAGING_WEBHOOK_URL` if configured
- `deploy-production`
  - manual dispatch only with `target=production`
  - requires `DEPLOY_PRODUCTION_WEBHOOK_URL`
  - uses `production` GitHub Environment

## Required GitHub repository settings

Set these once in GitHub:

1. Branch protection for `main`
- Require pull request before merging
- Require status checks to pass
- Select checks from `CI` workflow
- Require at least one approval
- Restrict direct pushes to `main`

2. Environments
- Create `staging` and `production` environments
- Add required reviewers for `production` (manual approval gate)

3. Secrets
- `DEPLOY_STAGING_WEBHOOK_URL` (optional but recommended)
- `DEPLOY_PRODUCTION_WEBHOOK_URL` (required for production deploys)

## Notes

- `deploy-staging` is non-blocking when staging webhook is not configured (it skips trigger).
- `deploy-production` fails if production webhook is missing.
