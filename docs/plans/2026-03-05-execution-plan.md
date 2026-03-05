# Execution Plan: OscarPoolVibes Phases 1-6c

## Context

OscarPoolVibes has comprehensive documentation (CLAUDE.md, SCHEMA.md, USE_CASES.md, ARCHITECTURE.md, PLAN.md, design system spec) and some pre-written Phase 6 backend code (results API, permissions, set-result with OCC). However, no `package.json` exists — the project has never been initialized as a Next.js app. This plan takes us from zero to a fully functional app through Phase 6c (admin/ceremony management), using wave-based parallel execution with subagents and GitHub Issues for tracking.

**Existing code to preserve/migrate:**
- `prisma/schema.prisma` — complete but needs `archivedAt`, `leftAt`, `slug` fields and index cleanup
- `src/lib/results/` — set-result.ts, get-results.ts, permissions.ts, index.ts (uses Auth.js v4 API)
- `src/app/api/results/route.ts` — GET/POST (uses `getServerSession`, needs v5 migration)
- `src/app/api/pools/[poolId]/permissions/route.ts` — GET/POST (missing auth check on GET)
- `src/types/results.ts` — discriminated union types
- `src/lib/db/client.ts` — basic singleton (needs Neon adapter)
- `docs/plans/2026-03-05-design-system.md` — approved design system spec

**Known issues to fix during implementation:**
- ARCHITECTURE.md reverted to old values (Next.js 14, 10s timeout) — re-fix in Wave 0
- Auth.js v4 → v5 migration needed in existing API files
- Prisma client needs `@prisma/adapter-neon` serverless adapter
- GET `/api/pools/[poolId]/permissions` has no authorization check

---

## Wave 0: Documentation Fixes & GitHub Issues (Sequential, main context)

**Why sequential:** Creates GitHub Issues that all subsequent waves reference.

1. Re-fix ARCHITECTURE.md: Next.js 14→15, 10s→15s timeout, restore ADRs 10-12
2. Re-fix CLAUDE.md if reverted
3. Create all GitHub Issues for Phases 1-6c (see issue list below)

---

## Wave 1: Project Scaffolding (Phase 1)
**GitHub Issues: #2-#7 | Max 3 parallel subagents**

### Subagent 1A: Next.js Init + Core Config
- `npx create-next-app@latest` with TypeScript, Tailwind, App Router, src/ directory
- Configure `tsconfig.json` strict mode
- Install core deps: `prisma`, `@prisma/client`, `@prisma/adapter-neon`, `@neondatabase/serverless`
- Install dev deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
- Configure Vitest (`vitest.config.ts`)
- **Issue #2**: Project scaffolding & core config

### Subagent 1B: Prisma Schema & Database
- Update `prisma/schema.prisma`:
  - Add `archivedAt DateTime?` to Pool
  - Add `leftAt DateTime?` to PoolMember
  - Add `slug String? @unique` to Pool (optional, for friendly URLs)
  - Remove redundant indexes (CategoryResult.categoryId already unique, PoolInvite.token already unique, Nominee.categoryId covered by composite)
  - Add `@prisma/adapter-neon` to generator config
- Update `src/lib/db/client.ts` to use Neon serverless adapter
- Run `npx prisma migrate dev --name initial`
- **Issue #3**: Prisma schema updates & Neon adapter

### Subagent 1C: Design System Foundation (shadcn/ui + Theme)
- Install shadcn/ui: `npx shadcn@latest init`
- Configure CSS custom properties per `docs/plans/2026-03-05-design-system.md`
- Set up `next/font` with Playfair Display + Inter
- Install `lucide-react`
- Create base theme tokens (gold scale, navy scale, dark/light neutral tokens)
- Configure Tailwind `theme.extend` with design system colors/fonts
- **Issue #4**: Design system foundation (shadcn/ui, fonts, theme tokens)

**After Wave 1 merges:** Run `npm run dev` to verify app boots, `npx prisma studio` shows tables.

---

## Wave 2: Seed Data + Auth Setup (Phase 1 completion + Phase 2)
**GitHub Issues: #5-#9 | Max 3 parallel subagents**

### Subagent 2A: Seed Script
- Create `scripts/seed.ts` with 97th Academy Awards (2025) data
- All 23 categories with real nominees
- Configure `package.json` seed command
- **Issue #5**: Seed script with 2025 ceremony data

### Subagent 2B: Auth.js v5 Setup
- Install `next-auth@beta` (v5) + `@auth/prisma-adapter`
- Create `src/lib/auth/auth.ts` with Auth.js v5 config
- Set up Google OAuth provider
- Set up Resend email provider (magic link fallback)
- Create `src/app/api/auth/[...nextauth]/route.ts`
- Export `auth()`, `signIn()`, `signOut()` from auth config
- Create auth middleware (`src/middleware.ts`) protecting `/pools/*`, `/admin/*`, `/results/*`
- **Issue #6**: Auth.js v5 with Google OAuth + email magic link

### Subagent 2C: Auth UI + Layout
- Create root layout with session provider, fonts, theme
- Create `src/app/auth/signin/page.tsx` — Google SSO button (prominent), email magic link
- Create Header component with user avatar/name, sign-in/sign-out
- Apply "Black Tie" design system to layout (navy gradient, gold accents)
- **Issue #7**: Auth UI, layout, header with design system

**After Wave 2:** Users can sign in via Google, see their name in header, seed data visible in Prisma Studio.

---

## Wave 3: Pool Management (Phase 3)
**GitHub Issues: #8-#12 | Max 4 parallel subagents**

### Subagent 3A: Pool CRUD + DB Helpers
- Create `src/lib/db/pools.ts` — createPool, getPool, getUserPools, updatePool, archivePool
- Create `src/lib/db/pool-members.ts` — addMember, removeMember, getMembersWithRoles
- Generate invite codes with `nanoid` (8 chars)
- Enforce max-members atomically
- Soft-delete via `archivedAt`
- **Issue #8**: Pool CRUD database helpers

### Subagent 3B: Pool Pages (List + Create + Detail)
- `src/app/pools/page.tsx` — list user's pools (server component)
- `src/app/pools/create/page.tsx` — create pool form (client component)
- `src/app/pools/[id]/page.tsx` — pool detail (members, settings, invite link)
- Use shadcn/ui Card, Button, Input, Select components
- **Issue #9**: Pool pages (list, create, detail)

### Subagent 3C: Invite System
- Create `src/lib/db/invites.ts` — createInvite, acceptInvite, declineInvite, revokeInvite
- `src/app/pools/join/page.tsx` — handle both `?code=` (open) and `?token=` (invite-only)
- `src/app/pools/[id]/invites/page.tsx` — manage invites (admin only)
- Email sending via Resend for invite-only pools
- **Issue #10**: Invite system (open + invite-only flows)

### Subagent 3D: Pool Settings + Access Control
- `src/app/pools/[id]/settings/page.tsx` — edit name, access type (invite-only→open only)
- Copy-to-clipboard for invite link/code
- Server-side auth checks on all pool mutations
- **Issue #11**: Pool settings & access control

**After Wave 3:** Full pool management — create, join, invite, manage settings.

---

## Wave 4: Predictions (Phase 4)
**GitHub Issues: #13-#16 | Max 3 parallel subagents**

### Subagent 4A: Prediction Types + Server Actions
- Create `src/types/predictions.ts` — Zod schemas for prediction input validation
- Create `src/lib/db/predictions.ts` — upsert prediction, get predictions by member/pool
- Server action `src/app/pools/[id]/predict/actions.ts` — savePrediction
- Enforce: firstChoice != runnerUp, respect `predictionsLocked`, validate nominee belongs to category
- **Issue #13**: Prediction types, validation, server actions

### Subagent 4B: Prediction Form UI
- `src/app/pools/[id]/predict/page.tsx` — all categories with nominee dropdowns
- `src/components/pools/PredictionForm.tsx` — client component, two selects per category
- Auto-save or explicit save button
- Disabled state when `predictionsLocked = true`
- **Issue #14**: Prediction form UI

### Subagent 4C: Prediction Summary + Visibility
- `src/app/pools/[id]/my-picks/page.tsx` — summary of all picks at a glance
- Implement prediction visibility rule: other members' picks hidden until predictions locked
- Server-side enforcement (don't send others' picks in API response until locked)
- **Issue #15**: Prediction summary & visibility rules

**After Wave 4:** Users can make predictions, edit until locked, view their picks.

---

## Wave 5: Scoring & Leaderboard (Phase 5)
**GitHub Issues: #17-#20 | Max 3 parallel subagents**

### Subagent 5A: Scoring Engine + Tests
- Create `src/lib/scoring/calculate-score.ts` — pure function, no DB deps
- Create `src/lib/scoring/calculate-leaderboard.ts` — aggregates scores across categories
- Handle edge cases: no winner set, missing predictions, ties
- Write comprehensive unit tests (aim for 100% coverage on scoring)
- Use existing scoring algorithm from SCHEMA.md
- **Issue #17**: Scoring engine (pure functions + unit tests)

### Subagent 5B: Leaderboard UI
- `src/app/pools/[id]/leaderboard/page.tsx` — server component
- `src/components/leaderboard/LeaderboardTable.tsx` — ranked members, scores, expandable per-category breakdown
- Highlight correct first-choice (gold) and correct runner-up (silver)
- Handle ties (same rank for same score)
- Design system: navy header, gold accents for winners
- **Issue #18**: Leaderboard UI with per-category breakdown

### Subagent 5C: Winner Reveal Animation
- `src/components/ui/WinnerReveal.tsx` — gold shimmer + subtle confetti for correct picks
- Respect `prefers-reduced-motion`
- 1-2 second duration, non-blocking
- **Issue #19**: Winner reveal animation (reduced-motion safe)

**After Wave 5:** Leaderboard shows scores, per-category breakdown, winner animations.

---

## Wave 6: Auth.js v4→v5 Migration + Existing Code Fixes (Phase 6a/6b prep)
**GitHub Issues: #20-#22 | Max 2 parallel subagents**

### Subagent 6A: Migrate Existing API Code to Auth.js v5
- Update `src/app/api/results/route.ts`: `getServerSession` → `auth()`
- Update `src/app/api/pools/[poolId]/permissions/route.ts`: add auth check on GET, migrate to v5
- Update `src/lib/results/permissions.ts`: migrate session handling
- Update `src/lib/results/set-result.ts`: verify Prisma import paths work with new client
- **Issue #20**: Migrate existing Phase 6 code to Auth.js v5

### Subagent 6B: Permissions UI (Phase 6a)
- `src/app/pools/[id]/permissions/page.tsx` — admin-only page
- Show pool members with their roles
- Grant/revoke RESULTS_MANAGER via existing API
- **Issue #21**: Permissions management UI

**After Wave 6:** Existing results/permissions code compiles and works with Auth.js v5.

---

## Wave 7: Results Entry UI + Admin (Phase 6b + 6c)
**GitHub Issues: #23-#26 | Max 3 parallel subagents**

### Subagent 7A: Results Entry UI
- `src/app/results/[ceremonyYearId]/page.tsx` — results entry form
- Dropdown per category, shows current winner + who set it + when
- Uses existing `POST /api/results` with `expectedVersion` for OCC
- **Issue #23**: Results entry UI

### Subagent 7B: Conflict Resolution UI
- Conflict detection: when 409 returned, show who changed it and what they set
- User can accept existing result or override (sending new version)
- Polling/refresh to keep results in sync (30s interval or manual refresh)
- **Issue #24**: Result conflict resolution UI + polling

### Subagent 7C: Admin / Ceremony Management (Phase 6c)
- `src/app/admin/page.tsx` — ceremony management
- Lock/unlock predictions toggle
- Create/edit categories and nominees (for future ceremony years)
- Protected by admin role check
- **Issue #25**: Admin page (ceremony management, prediction locking)

**After Wave 7:** Full Phase 6c complete — results entry with conflict handling, admin ceremony management.

---

## Wave 8: Integration Testing & Polish
**GitHub Issues: #26-#27 | Max 2 parallel subagents**

### Subagent 8A: Integration Tests
- API route tests for results, permissions, pools, predictions
- Component tests for key forms (PredictionForm, LeaderboardTable)
- E2E smoke test: create pool → join → predict → set winner → view leaderboard
- **Issue #26**: Integration & component tests

### Subagent 8B: Documentation Updates
- Update PLAN.md — mark completed phases
- Update ARCHITECTURE.md with any new ADRs discovered during implementation
- Verify CLAUDE.md is current
- **Issue #27**: Documentation updates post-implementation

---

## GitHub Issue Summary

| # | Title | Phase | Wave | Status |
|---|-------|-------|------|--------|
| #3 | Project scaffolding & core config | 1 | 1 | DONE |
| #4 | Prisma schema updates & Neon adapter | 1 | 1 | DONE |
| #5 | Design system foundation (shadcn/ui, fonts, theme) | 1 | 1 | DONE |
| #6 | Seed script with 2025 ceremony data | 1 | 2 | DONE |
| #7 | Auth.js v5 with Google OAuth + email magic link | 2 | 2 | DONE |
| #8 | Auth UI, layout, header with design system | 2 | 2 | DONE |
| #9 | Pool CRUD database helpers | 3 | 3 | |
| #10 | Pool pages (list, create, detail) | 3 | 3 | |
| #11 | Invite system (open + invite-only flows) | 3 | 3 | |
| #12 | Pool settings & access control | 3 | 3 | |
| #13 | Prediction types, validation, server actions | 4 | 4 | |
| #14 | Prediction form UI | 4 | 4 | |
| #15 | Prediction summary & visibility rules | 4 | 4 | |
| #16 | Scoring engine (pure functions + unit tests) | 5 | 5 | |
| #17 | Leaderboard UI with per-category breakdown | 5 | 5 | |
| #18 | Winner reveal animation (reduced-motion safe) | 5 | 5 | |
| #19 | Migrate existing Phase 6 code to Auth.js v5 | 6 | 6 | DONE (early, in Wave 2) |
| #20 | Permissions management UI | 6a | 6 | |
| #21 | Results entry UI | 6b | 7 | |
| #22 | Result conflict resolution UI + polling | 6b | 7 | |
| #23 | Admin page (ceremony management, prediction locking) | 6c | 7 | |
| #24 | Integration & component tests | - | 8 | |
| #25 | Documentation updates post-implementation | - | 8 | |

---

## Key Files to Create/Modify

**New files (by wave):**
- W1: `package.json`, `vitest.config.ts`, `tailwind.config.ts`, `src/lib/db/client.ts` (rewrite), CSS theme tokens
- W2: `scripts/seed.ts`, `src/lib/auth/auth.ts`, `src/middleware.ts`, `src/app/auth/signin/page.tsx`, `src/app/layout.tsx`, `src/components/ui/Header.tsx`
- W3: `src/lib/db/pools.ts`, `src/lib/db/pool-members.ts`, `src/lib/db/invites.ts`, pool page files
- W4: `src/types/predictions.ts`, `src/lib/db/predictions.ts`, prediction page files
- W5: `src/lib/scoring/calculate-score.ts`, `src/lib/scoring/calculate-leaderboard.ts`, leaderboard page files
- W6: Permissions page, migrated API files
- W7: Results entry pages, admin page

**Modified files:**
- `prisma/schema.prisma` — add archivedAt, leftAt, remove redundant indexes (W1)
- `src/lib/db/client.ts` — add Neon adapter (W1)
- `src/app/api/results/route.ts` — v4→v5 auth migration (W6)
- `src/app/api/pools/[poolId]/permissions/route.ts` — add GET auth + v5 migration (W6)
- `src/lib/results/*.ts` — verify imports work with new setup (W6)
- `docs/ARCHITECTURE.md` — re-fix version references (W0)

---

## Verification Strategy

**Per-wave checks:**
- `npm run build` — must pass (no TypeScript errors)
- `npm run lint` — must be clean
- `npm run test` — all tests pass
- Manual verification of the wave's deliverable

**End-to-end smoke test (Wave 8):**
1. Sign in with Google
2. Create an open pool for 2025 ceremony
3. Share invite link, join from second account
4. Both users make predictions for all categories
5. Lock predictions
6. Set winners for 3-4 categories via results UI
7. Verify leaderboard shows correct scores
8. Test conflict resolution (two users set different winners)
9. Admin page: unlock/re-lock predictions, edit category

**Commit convention:** `feat(scope): description (#issue-number)` per `scripts/commit-msg` hook
