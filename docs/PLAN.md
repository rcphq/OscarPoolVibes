# Implementation Plan

Phased delivery plan for OscarPoolVibes. Each phase is a working, deployable increment.

> **Implementation Status (as of March 2026)**: Phases 1 through 7 are **DONE**. The app has working auth, pool management, predictions, scoring, leaderboard, results entry with conflict detection, permissions management, admin panel, accessibility (skip link, error/loading boundaries, table semantics, axe tests, touch targets), SEO (sitemap, robots, OG image, JSON-LD, llms.txt, page metadata), and UX polish (theme toggle, toast notifications, AlertDialog confirmations). Phase 7.5 (comprehensive testing) and 8 (stretch) remain.

---

## Phase 1: Project Scaffolding & Database [DONE]

**Goal**: Bootable Next.js app with database connected and schema migrated.

- [x] Initialize Next.js 15 project with TypeScript, Tailwind, ESLint
- [x] Configure Prisma with Neon PostgreSQL
- [x] Write `prisma/schema.prisma` with all models (User, Account, Session, VerificationToken, CeremonyYear, Category, Nominee, Pool, PoolInvite, PoolMember, Prediction, CategoryResult)
- [x] Run initial migration
- [x] Create singleton Prisma client (`src/lib/db/client.ts`)
- [x] Create seed script with 2025/2026 ceremony data (real categories & nominees)
- [x] Verify deployment to Vercel connects to Neon
- [x] Create `.env.example` with all required environment variables
- [x] Set up Vitest and React Testing Library configuration
- [x] Create `tsconfig.json`, `next.config.ts`, and ESLint configuration

> See `docs/SCHEMA.md` for the full schema design and rationale.

**Deliverable**: `npm run dev` shows a Next.js welcome page; `npx prisma studio` shows seeded data.

---

## Phase 2: Authentication [DONE]

**Goal**: Users can sign up, sign in, and have a session.

- [x] Install and configure NextAuth.js with Prisma adapter
- [x] Set up Google OAuth provider (primary login method)
- [x] Set up email magic-link provider (Resend) as fallback
- [x] Optionally add GitHub OAuth provider
- [x] Create sign-in page (`src/app/auth/signin/page.tsx`) with Google SSO button prominently displayed
- [x] Add session provider to root layout
- [x] Create auth middleware to protect routes
- [x] Add user avatar/name display in header
- [x] Set up Resend for transactional emails (magic-link + pool invites)
- [x] Configure `RESEND_API_KEY` and `EMAIL_FROM` environment variables

> See `docs/ARCHITECTURE.md` ADR-4 for auth strategy rationale.

**Deliverable**: Users can log in via Google SSO (or email link) and see their name/avatar in the header.

---

## Phase 3: Pool Management [DONE]

**Goal**: Users can create and manage multiple pools with configurable access (open or invite-only).

- [x] Create pool listing page (`src/app/pools/page.tsx`) — shows all pools the user belongs to or has created
- [x] Create pool creation form (`src/app/pools/create/page.tsx`) — name, ceremony year, access type (open/invite-only)
- [x] Support multiple pools per user (create several, join several)
- [x] Implement invite code generation (nanoid, 8 chars) for all pools
- [x] **Open pools**: anyone with the invite link/code can join directly
- [x] **Invite-only pools**: pool creator sends invites by email; only invited users can join
- [x] Build invite management UI for pool creators (`src/app/pools/[id]/invites/page.tsx`)
  - [x] Send invites by entering email addresses
  - [x] View pending/accepted/declined invite statuses
  - [x] Resend or revoke pending invites
- [x] Generate shareable invite links:
  - Open pools: `/pools/join?code=ABC123` → immediate join after login
  - Invite-only pools: `/pools/join?token=<unique-token>` → validates invite + email match
- [x] Build pool detail page (`src/app/pools/[id]/page.tsx`) — members list, pool settings, link to predictions
- [x] Add copy-to-clipboard for invite link/code
- [x] Pool creator can edit pool settings (name, access type) after creation

> See `docs/USE_CASES.md` sections 2–3 and 5b for acceptance criteria.

**Deliverable**: Users can create multiple pools, choose open or invite-only access, send invite links, and friends can join via link or code.

---

## Phase 4: Predictions [DONE]

**Goal**: Users can make their first-choice and runner-up picks for every category.

- [x] Build prediction form component — for each category, two dropdowns (first choice, runner-up)
- [x] Validate that first choice != runner-up (client + server)
- [x] Create server action/API to save predictions (upsert by poolMember + category)
- [x] Show prediction summary page — all picks at a glance
- [x] Respect `predictionsLocked` flag — disable form when locked
- [x] Allow editing predictions until lock
- [x] Validate nominee belongs to the correct category (server-side)
- [x] Write unit tests for all prediction validation rules

> See `docs/USE_CASES.md` section 3a for acceptance criteria.

**Deliverable**: Users fill out their Oscar ballot within a pool. Picks persist across sessions.

---

## Phase 5: Scoring & Leaderboard [DONE]

**Goal**: After winners are set, display scores and rankings.

- [x] Implement scoring function in `src/lib/scoring/`
- [x] Write thorough unit tests for scoring edge cases
- [x] Build leaderboard page (`src/app/pools/[id]/leaderboard/page.tsx`)
- [x] Show per-category breakdown (which picks were correct)
- [x] Highlight correct first-choice (full points) and correct runner-up (partial points)
- [x] Sort members by total score descending, handle ties
- [x] Write tests for permission matrix — every role × action combination
- [x] Test tie-breaking logic in leaderboard sorting

> See `docs/USE_CASES.md` sections 3b and permission matrix for acceptance criteria.

**Deliverable**: After winners are entered, the leaderboard shows everyone's score and rank.

---

## Phase 6: Results Management & Permissions

**Goal**: Authorized users can manually set ceremony results with conflict prevention. Results are global per ceremony.

### 6a: Results Permission System [DONE]

- [x] Add `RESULTS_MANAGER` role to `PoolMemberRole` enum
- [x] Implement permission check: ADMIN or RESULTS_MANAGER in any pool for the ceremony
- [x] API to grant/revoke `RESULTS_MANAGER` role (`POST /api/pools/[poolId]/permissions`)
- [x] API to list pool members with their roles (`GET /api/pools/[poolId]/permissions`)
- [x] Build UI for pool admins to manage who can set results (`src/app/pools/[id]/permissions/page.tsx`)

### 6b: Setting Results with Conflict Prevention [DONE]

- [x] `CategoryResult` model with `version` field for optimistic concurrency control
- [x] `setResult()` function: validates permission, checks nominee, detects version conflicts
- [x] API route `POST /api/results` — set winner with `expectedVersion` for conflict safety
- [x] API route `GET /api/results?ceremonyYearId=<id>` — get all results for a ceremony
- [x] Sync winners to `Category.winnerId` and `Nominee.isWinner` on result set
- [x] Build results entry UI — dropdown per category, shows who last set each result (`src/app/results/[ceremonyYearId]/page.tsx`)
- [x] Show conflict resolution UI when two users try to set different winners (`src/components/results/ConflictDialog.tsx`)
- [x] Add polling refresh to keep results UI in sync (`src/components/results/ResultsPoller.tsx`)

### 6c: Admin / Ceremony Management [DONE]

- [x] Build admin page for managing ceremony years (`src/app/admin/page.tsx`)
- [x] Add UI to lock/unlock predictions
- [x] Add UI to create/edit categories and nominees (for future years)
- [x] Write integration tests for all results management flows
- [x] Write integration tests for permission grant/revoke
- [x] Test optimistic concurrency conflict scenarios

> See `docs/USE_CASES.md` sections 4–5 for acceptance criteria.

**Deliverable**: Full results management system with permissions UI, results entry with conflict detection and polling, and admin panel for ceremony/category/nominee management.

---

## Phase 7: Accessibility, SEO, and Polish

**Goal**: Production-quality user experience meeting WCAG 2.1 AA, optimized for search engines and AI crawlers.

### 7a: Accessibility (WCAG 2.1 AA) [DONE]
- [x] Audit all pages with axe-core and fix violations
- [x] Implement keyboard navigation for all interactive elements
- [x] Add ARIA labels and roles where semantic HTML is insufficient
- [x] Ensure color contrast meets AA standards (4.5:1 text, 3:1 UI)
- [x] Implement focus management for modals and dynamic content
- [ ] Test with screen readers (VoiceOver, NVDA) — deferred to Phase 7.5
- [x] Ensure touch targets are ≥ 44×44px on mobile
- [ ] Set up Lighthouse CI accessibility checks (target: ≥ 95) — deferred to Phase 7.5

### 7b: SEO & LLM/AI-Bot Optimization [DONE]
- [x] Add unique `<title>` and `<meta description>` to every page via Next.js `metadata` API
- [x] Implement Open Graph and Twitter Card meta tags (especially for pool invite links)
- [x] Add JSON-LD structured data (WebApplication, Organization) to key pages
- [x] Generate `sitemap.xml` via Next.js `sitemap.ts`
- [x] Create `robots.txt` with appropriate directives (`noindex` on user-specific pages)
- [x] Create `/llms.txt` manifest for AI crawler discoverability
- [ ] Implement clean URL slugs for pools — deferred (touches every route)
- [ ] Verify Core Web Vitals targets — deferred to Phase 7.5

### 7c: UX Polish [DONE]
- [x] Add loading states (Suspense boundaries, skeleton loaders)
- [x] Add error boundaries (`error.tsx` files) for every route segment
- [ ] Mobile-responsive design pass — deferred to Phase 7.5
- [x] Add toast notifications for actions (saved, joined, error, etc.)
- [x] Light/dark theme support
- [ ] Favicon and branding assets — deferred
- [x] Add `og:image` generation for pool invite link previews

> See `docs/ARCHITECTURE.md` ADR-10 (accessibility), ADR-11 (SEO) for rationale.

**Deliverable**: A polished, accessible, SEO-optimized app ready for Oscar night.

---

## Phase 7.5: Comprehensive Testing

**Goal**: Full test coverage across all layers before launch.

### Unit Tests
- [ ] Scoring logic: 100% branch coverage (all point combinations, ties, edge cases)
- [ ] Permission checks: every role × action from the permission matrix
- [ ] Validation helpers: nominee-category consistency, first choice ≠ runner-up
- [ ] Invite token generation and validation logic

### Integration Tests
- [ ] All API routes: happy path, validation errors, auth failures, edge cases
- [ ] Server actions: prediction save, pool create/join, results set
- [ ] Database queries: scoring queries, leaderboard aggregation, invite lookup
- [ ] Optimistic concurrency: conflict detection and resolution for results

### Component Tests
- [ ] Prediction form: selection, validation, lock state, error display
- [ ] Leaderboard table: sorting, score display, correct/incorrect highlighting
- [ ] Pool management: create, join, invite, settings forms
- [ ] Auth flows: sign-in, sign-out, session display

### E2E Tests (Playwright)
- [ ] Full user journey: visitor → sign up → create pool → invite friend → predict → view leaderboard
- [ ] Invite flows: open pool join, invite-only token flow, expired invite
- [ ] Results entry: set winners, handle conflicts, verify leaderboard updates
- [ ] Error scenarios: pool full, predictions locked, invalid invite, auth failure
- [ ] Multi-pool: user in multiple pools with different picks

### Accessibility Tests
- [ ] axe-core audit on every page (zero violations)
- [ ] Lighthouse CI accessibility ≥ 95
- [ ] Keyboard-only navigation test for all flows
- [ ] Screen reader walkthrough of key journeys

### Performance Tests
- [ ] Core Web Vitals within targets on mobile 3G
- [ ] Leaderboard rendering with 100+ member pool (Commissioner tier)
- [ ] Concurrent results entry under load

> See `docs/TESTING.md` for the full testing strategy and tooling.

**Deliverable**: All tests passing, CI pipeline green, coverage targets met.

---

## Phase 8: Stretch Goals & Backlog (Post-MVP)

These are not required for launch but are natural extensions:

### Engagement & Social
- [ ] Real-time leaderboard updates during the ceremony (Pusher/Ably)
- [ ] Social sharing — post your score to Twitter/Instagram
- [ ] Email reminders before predictions lock
- [ ] In-app notifications when pool members join or predictions lock
- [ ] "Confidence picks" — let users mark a few categories they're most confident about (bonus multiplier)

### Data & Content
- [ ] Historical stats — "how did you do across years"
- [ ] Oscar data import script from an external API/Wikipedia
- [ ] Multiple scoring presets (casual, competitive, custom)
- [ ] Category descriptions and nominee details (trailers, clips, acceptance speeches)

### Pool Enhancements
- [ ] Pool chat / comments thread for trash talk during the ceremony
- [ ] Private vs public leaderboards (hide scores until ceremony ends)
- [ ] Pool templates — save a pool's scoring config and reuse it next year
- [ ] Bulk invite via CSV or contact list import
- [ ] Pool member roles (co-admin, viewer)

### Monetization (see `docs/MONETIZATION.md`)
- [ ] Premium tier implementation (Stripe integration)
- [ ] Larger pool sizes for paid users
- [ ] Custom branding / themes for paid pools
- [ ] Advanced analytics and historical stats for premium users
- [ ] Ad-supported free tier with ad-free premium option

---

## Definition of Done (per phase)

1. All listed tasks completed
2. Tests pass (`npm run test`)
3. Lint clean (`npm run lint`)
4. Accessibility audit clean (`npm run test:a11y`) — Phase 7+ only
5. Builds without errors (`npm run build`)
6. Deployed to Vercel preview and manually verified
7. Cross-referenced USE_CASES.md acceptance criteria verified
8. All bugs/issues discovered during the phase tracked as GitHub Issues
9. Phase-related GitHub Issues closed with linked PRs

> Applies to MVP phases (1–7.5). Phase 8 items are backlog/stretch.
> See `CLAUDE.md` (GitHub Issues Workflow) for issue creation and labeling conventions.
