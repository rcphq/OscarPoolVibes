# Feature Implementation Plan — Test Coverage: User Flows

**Overall Progress:** `0%`

## TLDR

Add test coverage for all major user flows: login/auth, creating pools, joining pools, making predictions, editing point values, locking predictions, setting results, and viewing results. The existing suite covers DB helpers, scoring logic, and a few components well — the gap is in server actions and API routes, which is where the actual user-flow logic lives.

## Critical Decisions

- **Framework**: Vitest (already in use) — no new tools needed
- **Mocking strategy**: Follow existing `vi.hoisted()` pattern for Prisma and Auth.js session mocking
- **Scope**: Unit tests for server actions and API routes; no E2E (Playwright not configured yet)
- **File layout**: Mirror existing `__tests__/` structure — new folders under `__tests__/app/`
- **Auth mock**: Mock `auth()` from `@/lib/auth/auth` to return fake sessions (or null for unauth tests)

---

## Tasks

- [ ] 🟥 **Step 0: Playwright Setup**
  - [ ] 🟥 Add `@playwright/test` as an explicit devDependency
  - [ ] 🟥 Create `playwright.config.ts` (baseURL: `http://localhost:3000`, chromium, `e2e/` test dir)
  - [ ] 🟥 Add `"test:e2e": "playwright test"` script to `package.json`
  - [ ] 🟥 Create `e2e/fixtures/` with a shared auth fixture (pre-authenticated session via `storageState`)

- [ ] 🟥 **Step 1: Auth / Login**
  - [ ] 🟥 `__tests__/app/auth/signin.test.tsx` — SignIn page renders Google + Magic Link buttons
  - [ ] 🟥 Test unauthenticated state redirects (middleware guard) via mocked `auth()`

- [ ] 🟥 **Step 2: Create Pool**
  - [ ] 🟥 `__tests__/app/pools/create/actions.test.ts`
  - [ ] 🟥 Happy path: authenticated user → creates pool + auto-joined as ADMIN → redirects
  - [ ] 🟥 Validation failure: name too short, missing ceremonyYearId, invalid accessType
  - [ ] 🟥 Unauthenticated: action returns auth error / redirects to signin

- [ ] 🟥 **Step 3: Join Pool**
  - [ ] 🟥 `__tests__/app/pools/join/actions.test.ts`
  - [ ] 🟥 `joinOpenPool`: valid code → member added → redirect
  - [ ] 🟥 `joinOpenPool`: invalid/unknown code → error
  - [ ] 🟥 `joinOpenPool`: unauthenticated → redirect to signin
  - [ ] 🟥 `joinViaInvite`: valid token + matching email → member added → redirect
  - [ ] 🟥 `joinViaInvite`: email mismatch → error
  - [ ] 🟥 `joinViaInvite`: already a member → no duplicate

- [ ] 🟥 **Step 4: Make Predictions**
  - [ ] 🟥 `__tests__/app/pools/[id]/predict/actions.test.ts`
  - [ ] 🟥 Happy path: saves all predictions for active member
  - [ ] 🟥 Locked: predictions locked → action rejects
  - [ ] 🟥 Not a member: returns auth/membership error
  - [ ] 🟥 Invalid: firstChoice === runnerUp → Zod validation error
  - [ ] 🟥 Unauthenticated: returns error

- [ ] 🟥 **Step 5: Edit Point Values (Pool Scoring Overrides)**
  - [ ] 🟥 `__tests__/app/pools/[id]/settings/scoring.test.ts`
  - [ ] 🟥 ADMIN can update per-category point value and runnerUpMultiplier
  - [ ] 🟥 Non-admin member gets permission denied
  - [ ] 🟥 Invalid values (negative points, multiplier > 1) → validation error

- [ ] 🟥 **Step 6: Lock Predictions (Admin Panel)**
  - [ ] 🟥 `__tests__/app/admin/actions.test.ts`
  - [ ] 🟥 `togglePredictionsLocked`: unlocked → locked
  - [ ] 🟥 `togglePredictionsLocked`: locked → unlocked
  - [ ] 🟥 Non-admin user → permission denied

- [ ] 🟥 **Step 7: Set / Lock Results**
  - [ ] 🟥 `__tests__/lib/results/set-result.test.ts`
  - [ ] 🟥 Happy path: ADMIN sets winner → Category + Nominee updated in transaction
  - [ ] 🟥 RESULTS_MANAGER can also set winner
  - [ ] 🟥 MEMBER cannot set winner → 403
  - [ ] 🟥 Optimistic concurrency: stale version → 409 conflict with current result details
  - [ ] 🟥 Invalid nominee (not in category) → 400
  - [ ] 🟥 `__tests__/app/api/results/route.test.ts`
  - [ ] 🟥 POST `/api/results` — delegates to set-result and returns correct HTTP codes

- [ ] 🟥 **Step 8: Show Results / Leaderboard**
  - [ ] 🟥 `__tests__/lib/results/get-results.test.ts`
  - [ ] 🟥 Returns all winners for a ceremony year
  - [ ] 🟥 Returns empty when no results set yet
  - [ ] 🟥 `__tests__/lib/db/predictions.test.ts` (extend existing)
  - [ ] 🟥 `getPredictionsByPool`: locked=true → returns all members' picks
  - [ ] 🟥 `getPredictionsByPool`: locked=false → returns only requesting user's picks

- [ ] 🟥 **Step 9: Permissions API**
  - [ ] 🟥 `__tests__/app/api/pools/permissions/route.test.ts`
  - [ ] 🟥 GET `/api/pools/[poolId]/permissions`: ADMIN gets member list
  - [ ] 🟥 GET — catches known missing auth check bug (expect 401 for unauthenticated)
  - [ ] 🟥 POST — grant RESULTS_MANAGER: ADMIN can grant, MEMBER cannot
  - [ ] 🟥 POST — revoke RESULTS_MANAGER: works correctly

- [ ] 🟥 **Step 10: Pool Settings Actions**
  - [ ] 🟥 `__tests__/app/pools/[id]/settings/actions.test.ts`
  - [ ] 🟥 `updatePoolSettings`: ADMIN updates name/accessType
  - [ ] 🟥 `archivePoolAction`: ADMIN soft-deletes pool (sets archivedAt)
  - [ ] 🟥 `removeMemberAction`: ADMIN removes a member; cannot remove self
  - [ ] 🟥 `changeMemberRoleAction`: ADMIN can promote to RESULTS_MANAGER, not to ADMIN
  - [ ] 🟥 `leavePoolAction`: member leaves (sets leftAt)
  - [ ] 🟥 Non-admin attempting any of the above → permission denied

---

---

## E2E Tests (Playwright)

These match the 6 spec files documented in `docs/TESTING.md`. They run against a live dev server with a seeded test database.

- [ ] 🟥 **Step 11: E2E — Auth** (`e2e/auth.spec.ts`)
  - [ ] 🟥 Sign-in page renders Google + Magic Link buttons
  - [ ] 🟥 Unauthenticated user is redirected from protected routes to `/auth/signin`
  - [ ] 🟥 Sign out clears session and redirects to home

- [ ] 🟥 **Step 12: E2E — Pools** (`e2e/pools.spec.ts`)
  - [ ] 🟥 Authenticated user can create a pool and is redirected to pool page
  - [ ] 🟥 User can join a pool via invite code
  - [ ] 🟥 User can leave a pool

- [ ] 🟥 **Step 13: E2E — Predictions** (`e2e/predictions.spec.ts`)
  - [ ] 🟥 Member can submit predictions before lock
  - [ ] 🟥 Prediction form is disabled / hidden after predictions are locked
  - [ ] 🟥 Member can view their locked-in picks on `/my-picks`

- [ ] 🟥 **Step 14: E2E — Results** (`e2e/results.spec.ts`)
  - [ ] 🟥 RESULTS_MANAGER can navigate to `/results/{ceremonyYearId}` and set a winner
  - [ ] 🟥 Conflict UI appears when stale version is submitted
  - [ ] 🟥 MEMBER gets redirected / sees permission denied on results page

- [ ] 🟥 **Step 15: E2E — Leaderboard** (`e2e/leaderboard.spec.ts`)
  - [ ] 🟥 Leaderboard shows members ranked by score after results are set
  - [ ] 🟥 Member scores update when additional results are added

- [ ] 🟥 **Step 16: E2E — Invites** (`e2e/invites.spec.ts`)
  - [ ] 🟥 Admin can send an email invite
  - [ ] 🟥 Invite link navigates to join flow and adds member to pool
  - [ ] 🟥 Admin can revoke a pending invite

---

## Key Files to Modify / Create

**Unit / Integration (Vitest):**

| New Test File | Covers |
|---|---|
| `__tests__/app/auth/signin.test.tsx` | `src/app/auth/signin/page.tsx` |
| `__tests__/app/pools/create/actions.test.ts` | `src/app/pools/create/actions.ts` |
| `__tests__/app/pools/join/actions.test.ts` | `src/app/pools/join/actions.ts` |
| `__tests__/app/pools/[id]/predict/actions.test.ts` | `src/app/pools/[id]/predict/actions.ts` |
| `__tests__/app/pools/[id]/settings/actions.test.ts` | `src/app/pools/[id]/settings/actions.ts` |
| `__tests__/app/pools/[id]/settings/scoring.test.ts` | Pool scoring override logic |
| `__tests__/app/admin/actions.test.ts` | `src/app/admin/actions.ts` |
| `__tests__/lib/results/set-result.test.ts` | `src/lib/results/set-result.ts` |
| `__tests__/lib/results/get-results.test.ts` | `src/lib/results/get-results.ts` |
| `__tests__/app/api/results/route.test.ts` | `src/app/api/results/route.ts` |
| `__tests__/app/api/pools/permissions/route.test.ts` | `src/app/api/pools/[poolId]/permissions/route.ts` |

**Extend existing (Vitest):**
- `__tests__/lib/db/predictions.test.ts` — add locked/unlocked visibility cases

**New E2E (Playwright):**

| New File | Flow |
|---|---|
| `playwright.config.ts` | Config: baseURL, chromium, `e2e/` dir |
| `e2e/fixtures/auth.ts` | Shared authenticated session fixture |
| `e2e/auth.spec.ts` | Login, redirect, sign-out |
| `e2e/pools.spec.ts` | Create, join, leave pool |
| `e2e/predictions.spec.ts` | Submit picks, lock enforcement, view picks |
| `e2e/results.spec.ts` | Set winner, conflict UI, permission gate |
| `e2e/leaderboard.spec.ts` | Score display after results |
| `e2e/invites.spec.ts` | Send invite, join via link, revoke invite |

---

## Verification

- **Unit tests**: `npm run test:run` after each step — all new tests should pass
- **E2E tests**: `npm run test:e2e` requires `npm run dev` running with a seeded test database
- The GET `/api/pools/[poolId]/permissions` auth bug (Step 9) will produce an intentionally failing test — it goes green once the missing auth check is added to the route
