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

## ADR-4: NextAuth.js for Authentication

**Decision**: Use NextAuth.js v4 with email magic-link as the primary login method.

**Context**: Users need accounts to join pools and make predictions. Auth must be free and simple.

**Rationale**:
- NextAuth.js is the de-facto auth library for Next.js
- Email magic-link requires no third-party OAuth setup (good for getting started)
- GitHub OAuth can be added as an optional secondary provider
- Session data stored in the DB via Prisma adapter — no external session store needed

**Trade-offs**:
- Magic-link requires a transactional email provider (Resend free tier: 100 emails/day — sufficient)
- No password-based login (by design — simpler, more secure)

---

## ADR-5: Invite-Code Pool Joining

**Decision**: Pools are joined via a unique invite code (short alphanumeric string), not by searching/browsing.

**Context**: Pools are private groups of friends. We need a simple way to invite people.

**Rationale**:
- Invite codes are simple to share (text, link)
- No need for a "discover pools" feature — keeps the app focused
- The invite URL format: `/pools/join?code=ABC123`
- Codes are generated server-side (nanoid, 8 chars) and unique

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
