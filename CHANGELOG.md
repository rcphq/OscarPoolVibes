# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1](https://github.com/rcphq/OscarPoolVibes/compare/oscar-pool-vibes-v0.1.0...oscar-pool-vibes-v0.1.1) (2026-03-06)


### Features

* **a11y:** add accessibility, SEO, and UX polish ([#28](https://github.com/rcphq/OscarPoolVibes/issues/28)) ([2281103](https://github.com/rcphq/OscarPoolVibes/commit/2281103ecb81b8b737b88c7b59d516e7bff68a40))
* **auth:** add Auth.js v5, seed data, auth UI ([#7](https://github.com/rcphq/OscarPoolVibes/issues/7)) ([6c888b0](https://github.com/rcphq/OscarPoolVibes/commit/6c888b052fc2fc5fbce9276812a2e0ec8a8291ba))
* **infra:** add PostHog analytics event tracking ([#27](https://github.com/rcphq/OscarPoolVibes/issues/27)) ([8a7730c](https://github.com/rcphq/OscarPoolVibes/commit/8a7730cd5e240bf1b33fd9fe913af458c100491e))
* **infra:** scaffold Next.js 15, Prisma 7, shadcn/ui ([#3](https://github.com/rcphq/OscarPoolVibes/issues/3)) ([d928864](https://github.com/rcphq/OscarPoolVibes/commit/d92886440b7146a4302adf31966eccb152887d31))
* **pools:** add demo pool, fix invite link, a11y/UX improvements ([#28](https://github.com/rcphq/OscarPoolVibes/issues/28)) ([090d5fc](https://github.com/rcphq/OscarPoolVibes/commit/090d5fc184abe2780cc6b314077f378a458e2d5b))
* **pools:** add pool management, invites, settings ([#9](https://github.com/rcphq/OscarPoolVibes/issues/9)) ([b2b6233](https://github.com/rcphq/OscarPoolVibes/commit/b2b6233194a8190c56c04cb6ff90cb96be3afcc0))
* **pools:** add predictions with form, summary, visibility ([#13](https://github.com/rcphq/OscarPoolVibes/issues/13)) ([e1d9aae](https://github.com/rcphq/OscarPoolVibes/commit/e1d9aaed8995af7539c5a4581337c85192c83475))
* **results:** add permissions management UI ([#20](https://github.com/rcphq/OscarPoolVibes/issues/20)) ([40884ee](https://github.com/rcphq/OscarPoolVibes/commit/40884eed95af04a6b89f093069737b3fef101384))
* **results:** add results entry, conflict resolution, admin ([#21](https://github.com/rcphq/OscarPoolVibes/issues/21)) ([3547041](https://github.com/rcphq/OscarPoolVibes/commit/3547041e7d3f04a0d880ff5270959b151f67d1ad))
* **scoring:** add scoring engine, leaderboard, winner animation ([#16](https://github.com/rcphq/OscarPoolVibes/issues/16)) ([c4d19c6](https://github.com/rcphq/OscarPoolVibes/commit/c4d19c67cec100863828ad584e9d533ec2c8d7c8))


### Bug Fixes

* **infra:** add prisma generate to build script ([#26](https://github.com/rcphq/OscarPoolVibes/issues/26)) ([34f4abc](https://github.com/rcphq/OscarPoolVibes/commit/34f4abcd6db7843eb327d73fae1b64e659f5dfdf))
* **infra:** demo, light mode, auth, security fixes ([#44](https://github.com/rcphq/OscarPoolVibes/issues/44)) ([e585c73](https://github.com/rcphq/OscarPoolVibes/commit/e585c73cfdd53e3b9b146c1d6ed9430378ae5362))
* **infra:** lightweight middleware, fix ESLint config ([#26](https://github.com/rcphq/OscarPoolVibes/issues/26)) ([c5c646c](https://github.com/rcphq/OscarPoolVibes/commit/c5c646c9b291f8aaf890fb015b34d823edef0bed))
* **infra:** Prisma 7, Neon adapter, header auth ([#26](https://github.com/rcphq/OscarPoolVibes/issues/26)) ([2d14081](https://github.com/rcphq/OscarPoolVibes/commit/2d14081c270b460b69cf29f3f2758ea6314ec590))
* **infra:** remove earlyAccess, fix ESLint imports ([#26](https://github.com/rcphq/OscarPoolVibes/issues/26)) ([d20ff32](https://github.com/rcphq/OscarPoolVibes/commit/d20ff329921315278946eaba4bb8c41c8e8e581b))
* **pools:** use query parameter for invite link URL ([#9](https://github.com/rcphq/OscarPoolVibes/issues/9)) ([8a80db0](https://github.com/rcphq/OscarPoolVibes/commit/8a80db00d71f5d86fc962d049318c8dd773c38a3))


### Documentation

* add design system, testing strategy, and pre-build fixes ([#1](https://github.com/rcphq/OscarPoolVibes/issues/1)) ([d5e54e9](https://github.com/rcphq/OscarPoolVibes/commit/d5e54e98706a08ac4432819848835c4ef18ff3f3))
* add design system, testing strategy, and pre-build fixes ([#1](https://github.com/rcphq/OscarPoolVibes/issues/1)) ([4413e95](https://github.com/rcphq/OscarPoolVibes/commit/4413e95b1f8e5365ed9eba666a2fd42328a4f0f5))
* **infra:** fix versions, add ADRs, exec plan ([#1](https://github.com/rcphq/OscarPoolVibes/issues/1)) ([a0a90d8](https://github.com/rcphq/OscarPoolVibes/commit/a0a90d8cbee05136dc94b83c0b5c110341c9eff4))
* **infra:** mark all phases complete in execution plan ([#25](https://github.com/rcphq/OscarPoolVibes/issues/25)) ([cf4b5a4](https://github.com/rcphq/OscarPoolVibes/commit/cf4b5a477d480311db09c7315c13d7a702df0f83))


### Tests

* **infra:** add integration tests, update docs ([#24](https://github.com/rcphq/OscarPoolVibes/issues/24)) ([9c0822f](https://github.com/rcphq/OscarPoolVibes/commit/9c0822ffc2a24f0f10c5dadd9201a70886342f59))


### Maintenance

* **infra:** add CI workflow for PR gating ([#27](https://github.com/rcphq/OscarPoolVibes/issues/27)) ([3de88a5](https://github.com/rcphq/OscarPoolVibes/commit/3de88a5ba2f34744086fd6e4825d033454746f91))
* **infra:** add proprietary license ([#27](https://github.com/rcphq/OscarPoolVibes/issues/27)) ([1f7dea5](https://github.com/rcphq/OscarPoolVibes/commit/1f7dea5e1042f9dbb974e0aff7ff4f325778c4fc))
* **infra:** add release-please automation ([#27](https://github.com/rcphq/OscarPoolVibes/issues/27)) ([7d90ac8](https://github.com/rcphq/OscarPoolVibes/commit/7d90ac8336030554a255a121212e1103356b181d))
* **infra:** pin typescript version to 5.9.3 ([8275714](https://github.com/rcphq/OscarPoolVibes/commit/82757148a9ac7f37626fa231fa1c96972fa1fcd2))

## [Unreleased]

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
