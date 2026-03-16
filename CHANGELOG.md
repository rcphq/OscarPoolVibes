# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **results:** Tied category winners — admins and results managers can mark a category as tied by supplying an optional `tiedWinnerId` alongside `winnerId` in `POST /api/results`. Both nominees get `isWinner = true`; any prediction matching either winner scores full points (runner-up match scores multiplied points). Database migration `20260316164202_add_tied_winner` adds nullable `tiedWinnerId` to `CategoryResult` and `Category`. (#100)
- **ui:** Home page carousel heading switches to "And the winners are…" per-category once a winner is recorded; categories without a winner continue to show "And the nominees are…"
- **ui:** Winning nominee row highlighted with gold shimmer animation, glow-pulse, and ★ badge (decorative, `aria-hidden`)

### Changed

- **scoring:** `calculateCategoryScore()` now accepts `tiedWinnerId: string | null`; OR-logic awards points when a prediction matches either tied winner. Non-tied categories behave identically to before.
- **types:** `SetResultRequest` has optional `tiedWinnerId`; `CategoryResultView` and `ConflictDetail` carry `tiedWinnerId`/`tiedWinnerName`; new `INVALID_TIED_NOMINEE` error code.
- **docs:** `SCHEMA.md` — `tiedWinnerId` fields documented in Category/Nominee/CategoryResult tables; scoring algorithm pseudocode updated with OR-logic; "Tied Categories" section with historical example added.
- **docs:** ADR-8 updated to reflect polling-based live leaderboard (`LeaderboardAutoRefresh`, 15s interval, tab-visibility pause) — was incorrectly described as "no real-time features"
- **docs:** Runner-up multiplier corrected to `0.6` (default) in `TESTING.md` and `USE_CASES.md` — was incorrectly documented as `0.5`
- **docs:** `LeaderboardAutoRefresh` and `ResultsEntryForm` added to component tree in `ARCHITECTURE.md`

---

## [0.3.0] - 2026-03-15

### Added

- **results:** Clear/unset a category winner â€" `DELETE /api/results` endpoint with optimistic concurrency control (`expectedVersion` required) to safely remove a result entered in error. Deletes the `CategoryResult` row, clears `Category.winnerId`, and resets `Nominee.isWinner` atomically in a transaction.
- **results:** â€œClearâ€ button in the results entry form next to each decided category â€" allows results managers and admins to undo a winner without leaving the page.
- **results:** `unsetResult()` library function in `src/lib/results/unset-result.ts` with permission checks, version conflict handling, and atomic cleanup.
- **results:** Types `UnsetResultRequest` and `UnsetResultResponse` in `src/types/results.ts`.
- **testing:** Unit tests for `unsetResult` â€" permission denied, version conflict, category not found, successful clear with DB cleanup assertions.
- **testing:** Route-level tests for `DELETE /api/results` â€" auth, validation, success, 409 CONFLICT, 403 UNAUTHORIZED, revalidation verification.

### Fixed

- **leaderboard:** Leaderboard page showed stale data after a results manager set a winner â€" `POST /api/results` was not calling `revalidatePath` after successful result writes. Now revalidates all pool leaderboard and detail pages for the ceremony.
- **results:** Extracted shared `revalidateCeremonyPools()` helper and `ERROR_STATUS_MAP` in the results API route to reduce duplication between POST and DELETE handlers.

### Changed

- **docs:** Updated `USE_CASES.md` â€" added R-4 (clear category winner), renumbered R-5/R-6, added â€œClear category winnersâ€ row to permission matrix, added â€œClear conflictâ€ to Results Errors table.
- **docs:** Updated `SCHEMA.md` â€" documented result clearing behavior, added version-match-on-clear to cross-entity validation table.
- **docs:** Updated `TESTING.md` â€" added clear/unset test cases to the Results API test matrix.

## [0.2.2] - 2026-03-14

### Fixed

- **docs:** README env vars corrected for Auth.js v5 — `NEXTAUTH_URL`/`NEXTAUTH_SECRET` replaced with `AUTH_URL`/`AUTH_SECRET`

### Added

- **docs:** Design System section in README documenting the Black Tie aesthetic, shadcn/ui, fonts, and motion preferences
- **docs:** `CHANGELOG.md` and design system spec (`docs/plans/2026-03-05-design-system.md`) added to README documentation table

## [0.2.1] - 2026-03-14

### Fixed

- **ui:** Home page heading and body text used hardcoded `text-white` / `text-zinc-300` — replaced with semantic tokens (`text-foreground`, `text-foreground/80`) so they render correctly in light mode
- **a11y:** `OddsBadge` now has `aria-label` (e.g. "Polymarket: 55%, Kalshi: 52%") so screen readers announce odds meaningfully; separator dot marked `aria-hidden`
- **a11y:** Admin "Edit date" button restores focus when the inline edit form closes
- **predictions:** `PredictionForm` localStorage access wrapped in `try/catch` — prevents crash in browsers with storage disabled or in restricted incognito mode
- **predictions:** `PredictionForm` initial selections now built inside the `useState` initializer — avoids unnecessary object reconstruction on every re-render
- **predictions:** Trigger-badge odds lookup uses a pre-built `Map<id, nominee>` instead of repeated `.find()` calls — O(1) per lookup across all categories
- **predictions:** Switch `id` for "Never tell me the odds" toggle now uses React `useId()` — safe if the component is ever rendered more than once per page
- **admin:** `updateCeremonyDate` server action validates the date string before `new Date()` — returns a clear error instead of an opaque Prisma failure on malformed input
- **admin:** Categories table in `CeremonyYearCard` now sorts a shallow copy (`[...categories].sort(...)`) instead of mutating the prop array in place
- **ui:** `HeroBackground` re-randomizes particle positions on window resize — particles were previously stuck outside the new canvas bounds after resize or mobile rotation
- **odds:** Polymarket probability calculation now clamps to `[0, 100]` before storing — defensive guard against markets that return pre-scaled values
- **odds:** Fuzzy nominee name matching now requires a minimum 5-char token and limits word-count difference to ≤ 3 — prevents short names (e.g. "lily") from incorrectly merging with unrelated nominees
- **leaderboard:** Uses `getCachedSession()` instead of `auth()` directly — consistent with the rest of the app, avoids a redundant session store round-trip

### Added

- **ui:** Compact ceremony countdown badge in site header — responsive (days+hours on mobile, +minutes on tablet, +name and seconds on desktop); hidden on home page which has its own full countdown. Only shown when active ceremony has a date set and it hasn't passed.
- **ui:** `getActiveCeremony()` DB helper in `src/lib/db/ceremonies.ts` — centralises the `isActive` ceremony lookup used by both the header and home page

## [0.2.0] - 2026-03-14

### Added

- **predictions:** "Never Tell Me the Odds" toggle on the prediction form — off by default; when enabled, fetches Polymarket and Kalshi prediction market odds and displays them inline next to each nominee in the selectors. Preference persisted in `localStorage`. API route at `/api/odds` cached 15 minutes.
- **admin:** Edit ceremony date/time inline from the admin panel — admins can update `ceremonyDate` on existing ceremonies without recreating them
- **admin:** Ceremony cards now display full date, time, and timezone so the auto-lock hour is visible at a glance
- **ui:** Cinematic home page — animated gold particle background (`HeroBackground`) and live countdown clock when an active ceremony has a date set
- **ui:** Leaderboard post-lock view — gold-bordered card wrapper with backdrop blur, ambient glow, and rank badges (Crown / Medal)
- **predictions:** Auto-lock — predictions are blocked 1 hour before `ceremonyDate` (server-enforced in action + page render); works alongside the existing manual `predictionsLocked` flag

### Changed

- **scoring:** Best Original Score moved to Tier 3 (30 pts), Best Sound moved to Tier 4 (15 pts) — corrects tier assignments in defaults, seed data, and demo data

### Fixed

- **testing:** Playwright e2e test suite — `playwright.config.ts`, `test:e2e` npm script, auth fixture scaffold, and 6 spec files covering auth, pools, predictions, results, leaderboard, and invites
- **testing:** Vitest unit/integration tests for all major server actions and API routes: `createPoolAction`, `joinOpenPool`, `joinViaInvite`, `savePredictions`, `togglePredictionsLocked`, `updatePoolSettings`, `archivePoolAction`, `removeMemberAction`, `changeMemberRoleAction`, `leavePoolAction`
- **testing:** `setResult` unit tests — first-creation, update, optimistic-concurrency CONFLICT, UNAUTHORIZED, INVALID_NOMINEE error paths
- **testing:** `getResultsByCeremony` / `getResultByCategory` unit tests — empty state, display order, winner fields
- **testing:** `GET /api/results` and `POST /api/results` route tests — auth, validation, success, 409 CONFLICT, 403 UNAUTHORIZED, 400 INVALID_NOMINEE, null-user 401
- **testing:** `GET /api/pools/[poolId]/permissions` and `POST` route tests — auth, role enforcement, grant/revoke
- **leaderboard:** What If? simulator now available before predictions lock — ADMIN and RESULTS_MANAGER can simulate outcomes at any time (#80)
- **pools:** Ballot completion status card on pool detail page — tri-segment progress bar (complete / in-progress / not started) with stagger animation and stat chips (#62)
- **pools:** Share/copy ballot status as PNG — Web Share API on mobile, clipboard on desktop, anchor download fallback (#62)
- **pools:** `getPoolCompletionStats` — short-circuit when `totalCategories === 0` to avoid classifying all members as "complete" (#62)
- **pools:** Ballot completion wrapper div conditionally rendered to avoid phantom `mb-6` margin when card returns null (#62)
- **pools:** `PoolCompletionCard` share guard uses `useRef` instead of `useState` in `useCallback` deps — prevents stale-closure double-invocation (#62)
- **pools:** Share fallback uses `atob()` base64 decode instead of `fetch(data:)` for CSP compatibility (#62)
- **pools:** Share download anchor appended/removed from DOM before `.click()` for Firefox compatibility (#62)

## [0.1.3] - 2026-03-10

### Added

- **pools:** Invite sharing — WhatsApp, X/Twitter, and Copy Link buttons inline + post-create dialog (#50)
- **results:** "Enter Results" button on pool detail page for ADMIN and RESULTS_MANAGER roles (#49)
- **leaderboard:** Pre-results view showing own completion stats with sealed badges for other members (#52)
- **leaderboard:** "What If?" admin simulator — pick hypothetical winners, see simulated leaderboard (#53)
- **scoring:** 4-tier point system: 180/90/30/15 with 0.6x runner-up multiplier (#51)
- **infra:** Extract category DB queries into `src/lib/db/categories.ts` (#52)

### Fixed

- **pools:** Invite Link card buttons overflow on desktop — wrap with `flex-wrap` (#55)
- **pools:** Restore invite code pill above share buttons in Invite Link card (#55)
- **auth:** Admin page/actions restricted to `SITE_ADMIN_EMAILS` — pool creation no longer grants ceremony-wide admin (#54)
- **auth:** Results and pool permissions require active membership (`leftAt IS NULL`) (#54)
- **pools:** `maxMembers` validation enforces floor at current active member count (#54)
- **pools:** Disabled accessType select now submits value via hidden input (#48)
- **leaderboard:** Replace hardcoded gray tokens with semantic color tokens in LeaderboardTable (#52)
- **leaderboard:** Derive `isSimulating` from state instead of separate setter (review fix)
- **results:** `ResultsPoller` ref-sync `useEffect` was missing a dependency array, running on every render (#33)
- **results:** `ConflictDialog` focus restore and `dialog.close()` are now owned by the cleanup function — prevents a stuck modal backdrop on unmount-while-open and eliminates the double-restoration when closing normally (#34)
- **auth:** Removed `signin/layout.tsx` server-side redirect to `/pools` — it ignored `callbackUrl`, breaking pool invite link flows; middleware already handles the redirect correctly (#46)
- **pools:** `InviteShareDialog` was not passing `inviteCode` through to `InviteShareButtons`, causing a TypeScript build error (#50)
- **pools:** `InviteShareDialog` prop renamed `open` → `defaultOpen` to clarify uncontrolled initial state

### Security

- **infra:** Added `Strict-Transport-Security` (HSTS, 2-year max-age, includeSubDomains, preload) to all responses (#39)
- **infra:** Added `X-XSS-Protection: 1; mode=block` to all responses (#39)

### Style

- **ui:** `WinnerReveal` runner-up state replaced hardcoded `gray-300`/`gray-800` with semantic tokens (`border-border`, `bg-muted/30`, `bg-secondary`, `text-secondary-foreground`) — renders correctly in both light and dark modes (#45)

## [0.1.2] - 2026-03-06

### Added

- **ui:** Link demo from homepage ("Try Demo" CTA), header nav (unauthenticated users), and pools empty state (#44)
- **auth:** Middleware redirects authenticated users away from `/auth/signin` to `/pools` or `callbackUrl` (#46)
- **auth:** Sign-in page honors `callbackUrl` query parameter instead of hardcoding `/pools` (#46)
- **auth:** Homepage CTA changes to "My Pools" → `/pools` when logged in (#46)
- **infra:** Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (#39)
- **design:** Semantic color token style guide in CLAUDE.md for agentic contributors

### Fixed

- **design:** Demo components use semantic color tokens — light mode now works correctly (#45)
- **auth:** Sign-in page correctly reads `callbackUrl` from query params (#46)
- **auth:** Middleware `startsWith("/")` no longer bypasses all auth checks (#35)
- **pools:** Permissions GET requires ADMIN role — fixes IDOR leaking member PII (#36)
- **pools:** Permissions POST validated with Zod schema (#37)
- **results:** Results POST validated with Zod schema, status fallback for unknown error codes (#37)
- **pools:** `revokeInvite` verifies invite belongs to the specified pool (#41)
- **pools:** `changeMemberRole` restricted to MEMBER/RESULTS_MANAGER only (#46)
- **auth:** `callbackUrl` in pool join redirect now URL-encoded (#32)
- **results:** ResultsPoller uses ref pattern to prevent infinite re-render loop (#33)
- **a11y:** ConflictDialog restores focus to previously focused element on close (#34)
- **ui:** ResultsReveal "One by One" button now has visible hover feedback
- **ui:** Rivals PRNG guards against zero non-winner edge case
- **infra:** Fix `Function` type ESLint errors in pool tests

### Changed

- **infra:** Pin `next-auth` to exact beta version `5.0.0-beta.30` (remove `^` caret) (#42)
- **infra:** Add `dotenv` to devDependencies (used by seed script)

## [0.1.1] - 2026-03-06

### Features

- **a11y:** Add skip link, error boundaries, loading skeletons, table semantics, axe tests (#28)
- **seo:** Add sitemap, robots.txt, manifest, OG image, JSON-LD, llms.txt, page metadata (#29)
- **ui:** Add theme toggle (dark/light/system), toast notifications, AlertDialog confirmations, touch targets (#30)
- **ui:** Swap `<img>` to `next/image` for optimized avatar loading
- **ui:** Add `<main>` semantic landmark for skip link target
- **ui:** Add interactive demo pool with 97th Academy Awards data (`/demo`)
  - Predict → envelope transition → results reveal → leaderboard flow
  - 7 AI rivals with deterministic seeded predictions
  - Animated score count-up, bar charts, category breakdown
  - localStorage persistence for predictions

### Fixed

- **pools:** Fix invite link 404 — use query parameter (`?code=`) instead of path segment (#9)
- **pools:** Fix stale PostHog ref in `CopyInviteLink` useCallback deps
- **ui:** Fix 6 incorrect Oscar winners and 1 fabricated nominee in demo data
- **a11y:** Fix EnvelopeTransition `onComplete` re-fire on parent render (ref pattern)
- **a11y:** Fix skip button contrast (gray-600 → gray-400) and add focus ring
- **a11y:** Add `prefers-reduced-motion` coverage for all animation keyframes
- **a11y:** Replace `<label>` with `<fieldset>`/`<legend>` in PredictionForm
- **a11y:** Add disabled reason to nominee buttons via `aria-label`
- **a11y:** Remove redundant `role="table"` on native `<table>`

### Changed

- **infra:** Pin TypeScript to 5.9.3
- **infra:** Move `prisma` CLI to devDependencies
- **scoring:** Import `MAX_POSSIBLE_POINTS` constant instead of recomputing
- **ui:** Memoize `allScores`/`userRank` in Leaderboard, wrap handlers in `useCallback`

## [0.1.0] - 2026-03-05

### Features

- **infra:** Add PostHog analytics event tracking (#27)
- **results:** Add results entry, conflict resolution, admin controls (#21)
- **results:** Add permissions management UI (#20)
- **scoring:** Add scoring engine, leaderboard, winner animation (#16)
- **pools:** Add predictions with form, summary, visibility (#13)
- **pools:** Add pool management, invites, settings (#9)
- **auth:** Add Auth.js v5, seed data, auth UI (#7)
- **infra:** Scaffold Next.js 15, Prisma 7, shadcn/ui (#3)

### Bug Fixes

- **infra:** Lightweight middleware, fix ESLint config (#26)
- **infra:** Remove earlyAccess, fix ESLint imports (#26)
- **infra:** Add prisma generate to build script (#26)
- **infra:** Prisma 7, Neon adapter, header auth (#26)

### Tests

- **infra:** Add integration tests, update docs (#24)

### Documentation

- **infra:** Mark all phases complete in execution plan (#25)
- **infra:** Fix versions, add ADRs, exec plan (#1)
- Add design system, testing strategy, and pre-build fixes (#1)

### Other Changes

- Add comprehensive use cases document organized by role
- Add results management system with permissions and conflict prevention
- Add multi-pool support, invite system, Google SSO, monetization strategy, and DB alternatives
- Add project documentation, folder structure, and agentic coding guidelines
