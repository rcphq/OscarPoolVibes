# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **docs:** v0.2.0 implementation plan with tiered scoring, invite sharing, pre-results leaderboard, and What If? simulator (#48, #49, #50, #51, #52, #53)

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
- **auth:** Sign-in layout redirects authenticated users server-side (defense-in-depth) (#46)
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
