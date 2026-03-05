# CLAUDE.md — Agentic Coding Guidelines for OscarPoolVibes

## Project Overview

OscarPoolVibes is a Next.js 15 (App Router) web app for Oscar prediction pools. Users create/join pools, pick a first-choice and runner-up for each Academy Award category, and compete on a leaderboard. Hosted on Vercel free tier with Neon PostgreSQL.

## Tech Stack

- **Framework**: Next.js 15 with App Router (NOT Pages Router)
- **Language**: TypeScript — strict mode, no `any` types
- **Database**: PostgreSQL on Neon, managed via Prisma ORM
- **Auth**: Auth.js (next-auth v5) — App Router native
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Fonts**: Playfair Display (headings) + Inter (body) via `next/font`
- **Testing**: Vitest + React Testing Library
- **Hosting**: Vercel free tier

## Key Conventions

### File & Folder Structure

- App Router pages live in `src/app/`; use folder-based routing
- React components go in `src/components/` organized by domain (`ui/`, `pools/`, `leaderboard/`)
- Business logic goes in `src/lib/` (database helpers in `lib/db/`, scoring in `lib/scoring/`, auth in `lib/auth/`)
- Shared TypeScript types go in `src/types/`
- Prisma schema is at `prisma/schema.prisma`
- Tests mirror source structure inside `__tests__/`

### Code Style

- Use `function` declarations for React components, arrow functions for callbacks
- Prefer named exports over default exports
- Use server components by default; add `"use client"` only when needed
- Use server actions for mutations where possible; use API routes (`src/app/api/`) for external-facing endpoints
- Keep components small — extract when a file exceeds ~150 lines

### Database & Prisma

- Always run `npx prisma migrate dev --name <description>` after schema changes
- Use the singleton Prisma client from `src/lib/db/client.ts`
- Keep queries in dedicated files under `src/lib/db/` — do not scatter raw Prisma calls across components
- Index foreign keys and columns used in WHERE/ORDER BY clauses
- Use Neon's serverless driver (`@neondatabase/serverless`) to avoid cold-start connection overhead in Vercel serverless functions
- See `docs/SCHEMA.md` for the full schema, scoring algorithm, and indexing strategy

### Scoring Logic

Scoring rules are defined canonically in `docs/SCHEMA.md` (Scoring Algorithm section). Key points:

- Scoring rules live in `src/lib/scoring/`
- Scores are computed at read time, not stored (see `docs/ARCHITECTURE.md` ADR-3)
- See `docs/SCHEMA.md` for the pseudocode algorithm and edge cases

### Business Rules & Validation

These constraints must be enforced in application logic (not expressible in Prisma schema):

- **Nominee-category consistency**: `Prediction.firstChoiceId` and `Prediction.runnerUpId` must reference nominees belonging to `Prediction.categoryId`. Same for `CategoryResult.winnerId`.
- **First choice ≠ runner-up**: `Prediction.firstChoiceId != Prediction.runnerUpId`
- **Pool access type transition**: Pools can be switched from INVITE_ONLY → OPEN but NOT from OPEN → INVITE_ONLY (would lock out users who joined via link)
- **Predictions lock**: No prediction creates/updates when `CeremonyYear.predictionsLocked = true`
- **Results permission**: Only users with ADMIN or RESULTS_MANAGER role in at least one pool for the ceremony can set results

Validate these at the server action / API route level. Never trust client-side validation alone.

### Auth

- Auth.js (next-auth v5) config lives in `src/lib/auth/`
- Google OAuth is the primary login method (lowest friction for invite links)
- Email magic-link as fallback; optionally GitHub OAuth
- Env vars needed: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`
- Protect pool-write and admin routes with middleware or server-side session checks

### Vercel Free Tier Constraints

- Serverless functions: 15s timeout (Hobby plan) — keep DB queries fast
- Edge functions: consider for leaderboard if latency matters
- No cron jobs on free tier — use on-demand revalidation or ISR
- Bundle size: keep client JS minimal; heavy logic stays server-side
- Neon free tier: verify current limits at neon.tech/pricing (post-Databricks acquisition)

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (run before pushing to catch errors)
npm run lint         # ESLint
npm run test         # Vitest test suite
npx prisma studio    # Visual DB browser
npx prisma migrate dev --name <name>  # Create & apply migration
npm run seed         # Seed Oscar data
```

## Testing Guidelines

- Write tests for scoring logic (pure functions, easy to test)
- Write tests for API route handlers
- Use React Testing Library for component interaction tests
- Mock Prisma client in tests using `vitest.mock`
- Run `npm run test` before committing

## Data Model Summary

See `docs/SCHEMA.md` for the full schema. Key entities:

- **CeremonyYear** — a single Oscar ceremony (e.g., 96th Academy Awards, 2024)
- **Category** — an award category for a given ceremony year
- **Nominee** — a nominated movie/person for a category
- **Pool** — a group of friends competing together for a ceremony year (open or invite-only)
- **PoolInvite** — explicit invitation to join an invite-only pool
- **PoolMember** — a user's membership in a pool (users can be in multiple pools; role: MEMBER, ADMIN, or RESULTS_MANAGER)
- **Prediction** — a user's first-choice and runner-up pick for a category
- **CategoryResult** — tracks who set each category's winner, with optimistic concurrency control for conflict prevention
- **User** — authenticated user account

See `docs/USE_CASES.md` for the complete breakdown of functionality by role (Visitor, User, Member, Results Manager, Admin), including error scenarios and lifecycle flows.

## Error Handling

- Use Next.js `error.tsx` boundaries for page-level errors
- Return structured error responses from API routes: `{ error: string, status: number }`
- Log errors server-side; do not expose stack traces to the client

## Accessibility (WCAG 2.1 AA)

- Use semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<table>`, etc.)
- All interactive elements must be keyboard-accessible with visible focus indicators
- All images need descriptive `alt` text; decorative images use `alt=""`
- Form inputs must have associated `<label>` elements (not just placeholders)
- Color must not be the only means of conveying information (use icons/text alongside)
- Minimum contrast: 4.5:1 for normal text, 3:1 for large text and UI components
- Focus management: trap focus in modals, restore focus on close
- Touch targets: minimum 44×44px for mobile
- ARIA attributes only when semantic HTML is insufficient — prefer native elements
- Test with axe-core in development; Lighthouse CI in the pipeline

See `docs/ARCHITECTURE.md` ADR-10 for the full strategy.

## Design System

See `docs/plans/2026-03-05-design-system.md` for the full design system specification.

- **Approach**: "Black Tie" — Gold + Deep Navy, dark-mode-first, elegant ceremony aesthetic
- **Component library**: shadcn/ui (Radix UI + Tailwind) — copy-paste components we own
- **Color tokens**: Gold scale (gold-50 through gold-900), navy, warm dark/light neutrals, semantic colors
- **Typography**: Playfair Display for headings, Inter for body. Load via `next/font` (self-hosted).
- **Icons**: Lucide React (1.5px stroke, tree-shakeable, currentColor)
- **Theme**: Dark default, light mode available. Respect `prefers-color-scheme` on first visit. Store preference in localStorage.
- **Motion**: `prefers-reduced-motion` must be respected — instant state change, no animation when set.
- **Responsive**: Equal-weight desktop + mobile. Breakpoints follow Tailwind defaults.

## SEO & LLM/AI-Bot Optimization

### SEO Fundamentals
- Every page needs a unique `<title>` and `<meta name="description">`
- Use Next.js `metadata` API (not manual `<Head>`) for meta tags
- Implement Open Graph and Twitter Card meta tags for social sharing (especially pool invite links)
- Use semantic heading hierarchy (one `<h1>` per page, logical nesting)
- Generate a `sitemap.xml` and `robots.txt` via Next.js App Router conventions
- Implement JSON-LD structured data for key pages (Organization, WebApplication)

### AI/LLM Crawler Optimization
- Serve a `/llms.txt` file at the root describing the app's purpose, key pages, and data structure for AI crawlers
- Use clean, descriptive URL slugs (e.g., `/pools/oscar-2026-film-buffs` not `/pools/clxyz123`)
- Ensure SSR delivers complete content — no client-only rendering for discoverable pages
- Structure content with clear headings and semantic markup that LLMs can parse
- Provide JSON-LD structured data that AI systems can ingest for rich understanding

### Performance (Core Web Vitals)
- LCP (Largest Contentful Paint): < 2.5s
- INP (Interaction to Next Paint): < 200ms
- CLS (Cumulative Layout Shift): < 0.1
- Keep client-side JS minimal; heavy logic stays server-side (RSC)
- Use `next/image` for optimized image loading
- Implement ISR for leaderboard and results pages

## Testing Requirements

All features must have corresponding tests before merge. See `docs/TESTING.md` for the full strategy.

### Coverage Targets
- **Scoring logic**: 100% branch coverage (pure functions, critical correctness)
- **Permissions**: 100% of permission matrix scenarios (see `docs/USE_CASES.md`)
- **API routes**: Every endpoint tested for happy path, validation errors, auth failures, and edge cases
- **Components**: Interaction tests for all forms and user-facing flows
- **E2E**: Full user journeys (sign up → create pool → predict → view leaderboard)
- **Accessibility**: Automated axe-core checks on every page; Lighthouse CI ≥ 95

### Test Conventions
- Test files mirror source structure inside `__tests__/`
- Use `describe` blocks matching the function/component under test
- Mock Prisma client in unit tests using `vitest.mock`
- Use MSW (Mock Service Worker) for API mocking in integration tests
- Run `npm run test` before committing; CI blocks merge on failure

## GitHub Issues Workflow

**All bugs, features, enhancements, and technical debt MUST be tracked as GitHub Issues.** Do not track work in local files, comments, or chat — use Issues as the single source of truth.

### When to Create Issues

- **Bug discovered** → Create issue with label `bug`, include reproduction steps
- **New feature planned** → Create issue with label `enhancement`, link to relevant USE_CASES.md section
- **Technical debt identified** → Create issue with label `tech-debt`
- **DECISION NEEDED comments in docs** → Create issue with label `decision`, reference the doc and line
- **Test gaps found** → Create issue with label `testing`, reference TESTING.md section
- **Accessibility violation** → Create issue with label `a11y`, include axe-core output

### Issue Format

```markdown
## Description
[Clear description of the bug/feature/task]

## Context
- Related doc: `docs/PLAN.md` Phase X
- Related use case: USE_CASES.md [section]
- Related ADR: ARCHITECTURE.md ADR-X

## Acceptance Criteria
- [ ] [Specific, testable criterion]
- [ ] [Tests pass]
- [ ] [Docs updated if needed]
```

### Labels

| Label | Use For |
|-------|---------|
| `bug` | Something is broken or incorrect |
| `enhancement` | New feature or improvement |
| `tech-debt` | Refactoring, cleanup, dependency updates |
| `decision` | Open design decision needing resolution |
| `testing` | Test coverage gaps or test infrastructure |
| `a11y` | Accessibility issues or improvements |
| `seo` | SEO or LLM discoverability improvements |
| `docs` | Documentation updates |
| `phase-1` through `phase-8` | Implementation phase tracking |

### Workflow Rules

1. **Before starting work**: Check for an existing issue. If none exists, create one first.
2. **During development**: Reference the issue number in commit messages (`fixes #42`, `relates to #15`).
3. **PR descriptions**: Always link the issue(s) being addressed.
4. **Discovered bugs during development**: Create a new issue immediately — don't just fix it silently. The issue creates an audit trail.
5. **Open decisions**: When you encounter a `<!-- DECISION NEEDED -->` comment in docs, create a `decision` issue to track resolution.
6. **Commit messages**: Use conventional commits with issue reference: `feat(pools): add invite management UI (#42)`, `fix(scoring): handle zero-multiplier edge case (#15)`

### Commit Message Format

```
<type>(<scope>): <description> (#<issue>)

Types: feat, fix, docs, test, refactor, chore, style, perf
Scopes: pools, scoring, auth, leaderboard, results, admin, a11y, seo, infra, ui, design
```

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` — Neon Postgres connection string
- `NEXTAUTH_URL` — app base URL (e.g., `http://localhost:3000`)
- `NEXTAUTH_SECRET` — random secret for sessions (`openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` — Google OAuth client ID (from Google Cloud Console)
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `RESEND_API_KEY` — Resend API key for transactional emails
- `EMAIL_FROM` — sender address for emails (e.g., `noreply@oscarpoolvibes.com`)

Optional:
- `GITHUB_ID` — GitHub OAuth app client ID
- `GITHUB_SECRET` — GitHub OAuth app client secret
