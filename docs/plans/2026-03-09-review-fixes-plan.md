# 2026-03-09 Review Fixes Plan

## Goals

- Lock down global administration so pool creation does not grant ceremony-wide control.
- Ensure results permissions only apply to active pool members.
- Keep local verification focused on the main workspace without touching `.claude/worktrees`.
- Remove signed-out navigation dead ends and tighten pool settings validation.
- Clean up the current lint warnings in the main app workspace.

## Work Items

1. Add centralized auth helpers for cached session reads and site-admin checks.
2. Update admin page/actions to require configured site-admin email access.
3. Tighten results-permission queries and pool-permission APIs to require active memberships.
4. Fix signed-out homepage/header CTAs so they lead to reachable public flows.
5. Enforce valid `maxMembers` edits, including preventing caps below active membership.
6. Exclude `.claude/worktrees` from lint/test/git noise without deleting those folders.
7. Resolve the remaining main-workspace lint warnings and re-run verification.

## Verification

- `npm run lint`
- `npm run test:run`

## Notes

- Do not delete or modify `.claude/worktrees`; only exclude them from verification and git noise.
- Site admin access will be configured via `SITE_ADMIN_EMAILS` to avoid a schema migration for this pass.

