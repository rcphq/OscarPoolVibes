# Architecture Decisions

This document records key architectural choices for OscarPoolVibes and the reasoning behind them.

---

## ADR-1: Next.js App Router on Vercel Free Tier

**Decision**: Use Next.js 15 with the App Router, deployed to Vercel's Hobby tier.

**Context**: We need a full-stack framework that supports SSR, API routes, and static generation — all within free hosting limits. The pool creator (admin) needs server-side functionality; players mostly consume read-heavy pages.

**Note**: Next.js 15 changed default caching behavior (no-cache by default) and made `params`/`searchParams` async.

**Rationale**:
- App Router gives us React Server Components (RSC) — less client JS, faster pages
- Next.js 15 introduced improved React 19 support and better RSC patterns
- Vercel free tier: automatic deploys, preview URLs, serverless functions, edge network
- Hobby tier limits (15s function timeout, 100GB bandwidth) are fine for a small friend-group app
- ISR (Incremental Static Regeneration) can cache leaderboard pages to minimize DB hits

**Trade-offs**:
- Locked into Vercel for zero-config deploys (but Next.js is portable)
- 15s serverless timeout means we must keep DB queries fast

---

## ADR-2: Neon PostgreSQL with Prisma ORM

**Decision**: Use Neon's free-tier serverless PostgreSQL with Prisma as the ORM.

**Context**: We need a relational database (structured data: ceremonies, categories, nominees, predictions). It must be free and work well with serverless.

**Rationale**:
- Neon free tier: 0.5 GB storage, 1 compute endpoint, branching — plenty for this app
- Acquired by Databricks (2025), providing strong financial backing and long-term viability.
- Serverless driver (`@neondatabase/serverless`) works great in Vercel's serverless functions
- Prisma provides type-safe queries, auto-generated types, migration management
- PostgreSQL's relational model fits the data naturally (ceremony → categories → nominees)

**Alternatives considered**:
- **PlanetScale (MySQL)**: No free tier (removed April 2024). Cheapest plan $5/month. MySQL lacks some Postgres features. Not viable for free-tier constraint.
- **Supabase**: Also Postgres, but the extra BaaS features (realtime, auth) add complexity we don't need
- **SQLite / Turso**: Lighter, but less natural for relational joins and Vercel serverless
- **Drizzle ORM**: Considered as alternative to Prisma. More lightweight, better edge runtime support. Chose Prisma for its mature migration tooling, auto-generated types, and broader ecosystem.

---

## ADR-3: Scoring Computed at Read Time

**Decision**: Calculate scores on the fly rather than storing them in the database.

**Context**: When winners are announced, every prediction needs to be scored. We could pre-compute and store scores, or calculate them on demand.

**Rationale**:
- The data set is small (a pool of ~10-30 friends × ~24 categories = ~240-720 predictions)
- Computing scores is a simple loop with no heavy computation
- Avoids stale-score bugs — if a winner is corrected, scores are instantly accurate
- No need for background jobs or event-driven score updates

**Trade-offs**:
- The monetization plan (see `docs/MONETIZATION.md`) includes a Commissioner tier with 100+ member pools. At 100 members × 24 categories, scoring is still fast (~2,400 predictions). If pool sizes grow significantly beyond this, consider caching scores with ISR or materializing them on winner-set events.
- For now, simplicity wins

---

## ADR-4: Auth.js with Google SSO as Primary Auth

**Decision**: Use Auth.js v5 (next-auth) with Google OAuth as the primary login method, email magic-link as fallback.

**Context**: Users need accounts to join pools and make predictions. Auth must be free, simple, and familiar. Most users will be sharing invite links with friends — low-friction sign-up is critical.

**Rationale**:
- Google SSO is the lowest-friction option — most users already have a Google account
- One-click sign-in reduces drop-off when friends follow an invite link
- Auth.js v5 is the de-facto auth library for Next.js App Router
- Email magic-link as fallback for users who prefer not to use Google
- GitHub OAuth available as optional tertiary provider (useful for developer audiences)
- Session data stored in the DB via Prisma adapter — no external session store needed

**Setup**:
- Requires Google Cloud Console OAuth 2.0 credentials (free)
- Env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`

**Trade-offs**:
- Google OAuth requires setting up a project in Google Cloud Console (one-time)
- Magic-link fallback requires a transactional email provider (Resend — verify current free tier limits at resend.com/pricing)
- No password-based login (by design — simpler, more secure)

---

## ADR-5: Open Pools vs Invite-Only Pools

**Decision**: Support two pool access types — **Open** (anyone with the link can join) and **Invite-Only** (pool creator must explicitly invite users by email).

**Context**: Some groups want a casual "share a link and anyone can join" experience, while others want tighter control over who's in the pool. Users should be able to create and participate in multiple pools.

**Rationale**:
- **Open pools**: The invite code/link is all that's needed. Share in a group chat, anyone who clicks joins. Low friction, great for casual groups.
- **Invite-only pools**: Pool creator enters email addresses to invite specific people. Invitees receive a link with a unique token. Only matching emails can join. Better for competitive or smaller groups.
- Both types generate a shareable link, but the link's behavior differs:
  - Open: `/pools/join?code=ABC123` → immediate join after login
  - Invite-only: `/pools/join?token=<unique-token>` → validates the invite before joining
- Users can belong to multiple pools (e.g., a work pool, a family pool, a film-nerd pool)
- Pool creators can switch a pool from invite-only to open (but not the reverse, to avoid locking out existing link-sharers)

**Trade-offs**:
- Invite-only adds a `PoolInvite` table and invite management UI
- Email invites require a transactional email provider (shared with magic-link auth)
- Open pools have a minor risk of uninvited joins if a code leaks (acceptable for this use case)

**Enforcement note**: The one-way access type transition (INVITE_ONLY → OPEN only) is enforced at the application layer in the pool-settings server action. The database enum allows both values. Add validation in `src/app/pools/[id]/settings` server action to reject OPEN → INVITE_ONLY transitions.

---

## ADR-6: Categories and Point Values Are Per-Ceremony

**Decision**: Categories, their point values, and runner-up multipliers are stored per ceremony year, not as global templates.

**Context**: Oscar categories change over time (categories get added, removed, renamed). Point values might be tuned between years.

**Rationale**:
- Full flexibility — each ceremony year is self-contained
- No complex "template inheritance" logic
- Seed scripts can copy last year's categories as a starting point
- Admin UI lets the pool creator adjust point values before locking predictions

**Trade-offs**:
- Slightly more data entry per year (mitigated by seed/copy scripts)

---

## ADR-7: Tailwind CSS for Styling

**Decision**: Use Tailwind CSS for all styling.

**Context**: Need a styling approach that's fast to iterate on and produces minimal CSS in production.

**Rationale**:
- Utility-first approach is fast for prototyping
- PurgeCSS (built-in) keeps the bundle tiny
- No runtime CSS-in-JS overhead
- Huge ecosystem of UI component libraries (shadcn/ui) built on Tailwind

**Alternatives considered**:
- **CSS Modules**: Scoped CSS, no runtime overhead. But slower iteration and more boilerplate than Tailwind utilities.
- **styled-components / Emotion**: Runtime CSS-in-JS adds JS bundle size and hydration overhead. Not ideal for RSC.
- **vanilla-extract**: Zero-runtime CSS-in-JS with type safety. Good option but smaller ecosystem and steeper learning curve.

**Trade-offs**:
- Utility classes can make markup verbose — mitigate with component extraction
- Team members need familiarity with Tailwind's class naming conventions

---

## ADR-8: No Real-Time Features (MVP)

**Decision**: The MVP will not include WebSocket or real-time updates. Leaderboard refreshes on page load.

**Context**: Real-time leaderboard updates during the ceremony would be nice but add significant complexity.

**Rationale**:
- Vercel free tier doesn't natively support persistent WebSocket connections
- The ceremony is a single evening — users can refresh the page
- ISR with short revalidation (e.g., 30s) gives a near-real-time feel without WebSockets
- Real-time can be added later (Vercel + Pusher/Ably free tier) if demand exists

---

## ADR-9: Multi-Pool Membership

**Decision**: Users can create multiple pools and be members of multiple pools simultaneously.

**Context**: Users have different social circles (coworkers, family, college friends) who may all want to run Oscar pools. Forcing one pool per user would limit engagement.

**Rationale**:
- The `PoolMember` join table already supports many-to-many between User and Pool
- A user's predictions are scoped to a specific pool (via `PoolMember`), so they can make different picks in different pools if desired
- The pool listing page shows all pools a user belongs to
- Pool creators have an ADMIN role on their pool; other members are MEMBER

**Trade-offs**:
- Users might need to fill out predictions multiple times if they're in many pools (could add "copy picks from another pool" later)
- Leaderboard is per-pool; no cross-pool ranking (by design — pools are independent)

---

## ADR-10: WCAG 2.1 AA Accessibility Target

**Decision**: Target WCAG 2.1 Level AA compliance for all user-facing pages.

**Context**: OscarPoolVibes is a consumer-facing social app. Invite links are shared broadly — users with disabilities must be able to participate fully. Additionally, accessibility compliance is increasingly a legal requirement and improves SEO.

**Rationale**:
- **Mobile-first design**: Invite links are shared via group chats (mobile). Oscar night participation happens on phones. Mobile-first is not a polish item — it's the primary platform.
- **Keyboard navigation**: All interactive elements (prediction dropdowns, leaderboard sorting, invite management) must work without a mouse
- **Screen readers**: Semantic HTML + ARIA ensures blind/low-vision users can make predictions and view scores
- **Color contrast**: Leaderboard highlights (correct/incorrect picks) must use color + icons/text, not color alone
- **Focus management**: Modal dialogs (invite confirmation, conflict resolution) must trap and restore focus
- **Touch targets**: Minimum 44×44px for all interactive elements on mobile

**Implementation**:
- Use semantic HTML (`<table>` for leaderboards, `<form>` for predictions, `<nav>` for navigation)
- Test every component with axe-core during development
- Lighthouse CI accessibility score ≥ 95 enforced in CI pipeline
- Manual screen reader testing (VoiceOver on macOS, NVDA on Windows) before each release

**Trade-offs**:
- Some design choices may be constrained by accessibility requirements (e.g., contrast ratios limit color palette)
- Development velocity slightly reduced by testing requirements — but catches issues early

---

## ADR-11: SEO & LLM/AI-Bot Crawler Optimization

**Decision**: Optimize all public-facing pages for search engine discoverability and AI/LLM crawler comprehension.

**Context**: OscarPoolVibes grows primarily through shared invite links, but organic search traffic ("oscar pool 2026", "oscar prediction game") is a significant acquisition channel. Additionally, AI-powered search (ChatGPT, Perplexity, Google AI Overviews) increasingly drives discovery, and these systems prefer structured, machine-readable content.

**Rationale**:
- **SSR by default**: React Server Components ensure search engines and AI crawlers see fully rendered content, not empty shells
- **Structured data (JSON-LD)**: Provide machine-readable metadata (WebApplication, Event schema) that AI systems can ingest for rich answers
- **`/llms.txt` manifest**: A plain-text file at the site root describing the app for AI crawlers (purpose, features, key URLs) — emerging standard for LLM discoverability
- **Clean URL structure**: Human-readable slugs (`/pools/oscar-2026-film-buffs`) improve both SEO and AI comprehension over opaque IDs
- **Open Graph / Twitter Cards**: Pool invite links shared on social media and messaging apps need rich previews to drive clicks
- **Core Web Vitals**: Google ranks pages by LCP, INP, CLS — server components + ISR keep scores high

**Implementation**:
- Next.js `metadata` API for all page-level meta tags (title, description, og:image)
- JSON-LD script tags on landing page, pool pages, and leaderboard pages
- `sitemap.xml` generated via Next.js App Router `sitemap.ts` convention
- `robots.txt` allowing all crawlers, with appropriate `noindex` on user-specific pages (predictions)
- `/llms.txt` with app description, feature list, and API surface
- ISR with 30-60s revalidation for leaderboard and results pages

**Trade-offs**:
- User-specific pages (my predictions, profile) should NOT be indexed — requires careful `noindex` / auth gating
- Rich meta tags require per-page configuration — more work but critical for social sharing of invite links
- `llms.txt` is an emerging convention, not a formal standard — low effort, high potential upside

---

## ADR-12: Comprehensive Testing Strategy

**Decision**: Implement a multi-layer testing strategy covering all scenarios, permissions, error states, and accessibility.

**Context**: OscarPoolVibes has complex permission logic (5 roles, ceremony-wide results), optimistic concurrency control, and time-sensitive features (prediction locking on Oscar night). Bugs during the ceremony are catastrophic — there's no "try again tomorrow."

**Rationale**:
- **Scoring correctness is paramount**: A scoring bug means wrong leaderboard rankings. 100% branch coverage on scoring functions.
- **Permission matrix is complex**: 5 roles × ~20 actions = 100 permission scenarios. Every cell in the permission matrix (see `docs/USE_CASES.md`) must have a corresponding test.
- **Concurrency**: Results entry with optimistic locking must be tested for conflict scenarios
- **Error states**: Every user-facing error (expired invite, pool full, locked predictions) must be tested
- **Accessibility**: Automated axe-core + Lighthouse CI catches regressions

**Test layers**:
1. **Unit tests (Vitest)**: Scoring logic, permission checks, validation helpers — pure functions
2. **Integration tests (Vitest + Prisma)**: API routes, server actions with real DB transactions (test database)
3. **Component tests (React Testing Library)**: Forms, leaderboard, prediction UI interactions
4. **E2E tests (Playwright)**: Full user journeys across roles (sign up → create pool → invite → predict → score → view leaderboard)
5. **Accessibility tests (axe-core + Lighthouse CI)**: Every page audited for WCAG 2.1 AA
6. **Visual regression tests (Playwright screenshots)**: Catch unintended UI changes

**Coverage targets**: See `docs/TESTING.md` for detailed requirements.

**Trade-offs**:
- E2E tests are slow — run only in CI, not on every save
- Test database must be seeded consistently — use transactional rollback pattern
- Visual regression tests produce false positives on font rendering differences across OS — use tolerance thresholds

---

## ADR-13: Soft Delete for Pools and Pool Members

**Decision**: Use `archivedAt` on Pool and `leftAt` on PoolMember instead of hard deletes.

**Rationale**:
- Preserves prediction history for leaderboard integrity
- Pool members who leave retain their predictions for scoring
- Archived pools are excluded from active listings but data remains intact
- Rejoin semantics: if `leftAt` is set, clear it on rejoin (predictions preserved)

---

## ADR-14: Prediction Visibility Rules

**Decision**: Other members' predictions are hidden until `predictionsLocked = true` on the ceremony year.

**Rationale**:
- Prevents copying picks from other members
- Server-side enforcement: API never returns others' picks before lock
- After lock, all picks are visible for comparison and discussion

---

## ADR-15: Zod for Input Validation

**Decision**: Use Zod v4 (`^4.3.6`) schemas for all user input validation at system boundaries.

**Context**: Zod v4 was released as a major version upgrade with performance improvements and some API changes. As a greenfield project we adopted v4 from the start.

**Rationale**:
- Type-safe validation with TypeScript inference
- Shared schemas between client and server
- Clear error messages for form validation
- Pairs well with server actions and API routes
- Significant performance improvements over Zod v3
- No migration burden — greenfield project started directly on v4

---

## ADR-16: "Black Tie" Design System

**Decision**: Use a Gold + Deep Navy color scheme ("Black Tie") with dark-mode-first approach.

**Context**: See `docs/plans/2026-03-05-design-system.md` for full specification.

**Rationale**:
- Oscar ceremony aesthetic — elegant, luxurious without being noisy
- shadcn/ui components with custom CSS tokens mapped to gold/navy palette
- Playfair Display (headings) + Inter (body) for typographic contrast
- WCAG 2.1 AA compliant contrast ratios

---

## ADR-17: Tailwind CSS v4 — CSS-First Configuration

**Decision**: Use Tailwind CSS v4 with CSS-first configuration via `@theme inline` in `globals.css`, not a `tailwind.config.ts` file.

**Context**: Tailwind CSS v4 introduced a new CSS-first configuration model. There is no `tailwind.config.ts` or `tailwind.config.js` in the project.

**Implementation**:
- Tailwind is loaded via `@import "tailwindcss"` in `src/app/globals.css`
- All custom theme tokens (colors, radii, fonts) are defined inside `@theme inline {}` in CSS
- PostCSS config (`postcss.config.mjs`) uses `@tailwindcss/postcss` plugin instead of the legacy `tailwindcss` plugin
- shadcn/ui integration uses `@import "shadcn/tailwind.css"` and `tw-animate-css`
- Gold scale and navy colors are registered as CSS custom properties inside `@theme inline`, making them available as Tailwind utilities (e.g., `bg-gold-500`, `text-navy`)

**Rationale**:
- Tailwind v4's CSS-first approach eliminates the JS config file, keeping all styling in one place
- Better alignment with the CSS ecosystem and CSS custom properties
- Simpler build pipeline (no JS config to process)

---

## ADR-18: Prisma 7 — Config File Required, No URL in Datasource

**Decision**: Use Prisma 7 with a `prisma.config.ts` file at the project root. The `datasource` block in `schema.prisma` omits the `url` property.

**Context**: Prisma 7 changed how database connections are configured. The `url` property is no longer specified in the `datasource` block of the schema file. Instead, connection configuration is managed through `prisma.config.ts` and environment variables.

**Implementation**:
- `prisma.config.ts` at project root with `defineConfig({ earlyAccess: true, schema: './prisma/schema.prisma' })`
- `prisma/schema.prisma` datasource block contains only `provider = "postgresql"` (no `url`)
- `DATABASE_URL` is read from environment variables by the Prisma engine at runtime
- Uses `@prisma/adapter-neon` (v7.4.2) for serverless-compatible connections

**Rationale**:
- Required by Prisma 7 — the old `url = env("DATABASE_URL")` pattern in the schema is removed
- `prisma.config.ts` provides a typed configuration surface for Prisma CLI and runtime settings
- `earlyAccess: true` enables Prisma 7 features that are still stabilizing

---


## Component Architecture

The following diagram shows the high-level component structure. Server components handle data fetching and auth; client components handle interactivity. See `CLAUDE.md` for coding conventions.

```
Layout (server)
├── Header (server) — nav, user avatar
├── Page Content
│   ├── Server Components — data fetching, auth checks
│   └── Client Components — forms, interactive UI
│       ├── PredictionForm — pick first/runner-up per category
│       ├── LeaderboardTable — sortable score table
│       └── PoolCard — pool summary with invite link
└── Footer (server)
```

**Guiding principle**: Server components by default. Only add `"use client"` for interactivity (forms, state, event handlers).
