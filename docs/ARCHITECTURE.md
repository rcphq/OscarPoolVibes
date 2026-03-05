# Architecture Decisions

This document records key architectural choices for OscarPoolVibes and the reasoning behind them.

---

## ADR-1: Next.js App Router on Vercel Free Tier

**Decision**: Use Next.js 14 with the App Router, deployed to Vercel's free tier.

**Context**: We need a full-stack framework that supports SSR, API routes, and static generation — all within free hosting limits. The pool creator (admin) needs server-side functionality; players mostly consume read-heavy pages.

**Rationale**:
- App Router gives us React Server Components (RSC) — less client JS, faster pages
- Vercel free tier: automatic deploys, preview URLs, serverless functions, edge network
- Free tier limits (10s function timeout, 100GB bandwidth) are fine for a small friend-group app
- ISR (Incremental Static Regeneration) can cache leaderboard pages to minimize DB hits

**Trade-offs**:
- Locked into Vercel for zero-config deploys (but Next.js is portable)
- 10s serverless timeout means we must keep DB queries fast

---

## ADR-2: Neon PostgreSQL with Prisma ORM

**Decision**: Use Neon's free-tier serverless PostgreSQL with Prisma as the ORM.

**Context**: We need a relational database (structured data: ceremonies, categories, nominees, predictions). It must be free and work well with serverless.

**Rationale**:
- Neon free tier: 0.5 GB storage, 1 compute endpoint, branching — plenty for this app
- Serverless driver (`@neondatabase/serverless`) works great in Vercel's serverless functions
- Prisma provides type-safe queries, auto-generated types, migration management
- PostgreSQL's relational model fits the data naturally (ceremony → categories → nominees)

**Alternatives considered**:
- **PlanetScale (MySQL)**: Good free tier but MySQL lacks some Postgres features; Prisma supports both
- **Supabase**: Also Postgres, but the extra BaaS features (realtime, auth) add complexity we don't need
- **SQLite / Turso**: Lighter, but less natural for relational joins and Vercel serverless

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
- If pools grew to thousands of members, we'd want to cache or materialize scores
- For now, simplicity wins

---

## ADR-4: NextAuth.js with Google SSO as Primary Auth

**Decision**: Use NextAuth.js v4 with Google OAuth as the primary login method, email magic-link as fallback.

**Context**: Users need accounts to join pools and make predictions. Auth must be free, simple, and familiar. Most users will be sharing invite links with friends — low-friction sign-up is critical.

**Rationale**:
- Google SSO is the lowest-friction option — most users already have a Google account
- One-click sign-in reduces drop-off when friends follow an invite link
- NextAuth.js is the de-facto auth library for Next.js
- Email magic-link as fallback for users who prefer not to use Google
- GitHub OAuth available as optional tertiary provider (useful for developer audiences)
- Session data stored in the DB via Prisma adapter — no external session store needed

**Setup**:
- Requires Google Cloud Console OAuth 2.0 credentials (free)
- Env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

**Trade-offs**:
- Google OAuth requires setting up a project in Google Cloud Console (one-time)
- Magic-link fallback still requires a transactional email provider (Resend free tier: 100 emails/day)
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

## Component Architecture

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
