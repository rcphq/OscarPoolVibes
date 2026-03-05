# CLAUDE.md — Agentic Coding Guidelines for OscarPoolVibes

## Project Overview

OscarPoolVibes is a Next.js 14 (App Router) web app for Oscar prediction pools. Users create/join pools, pick a first-choice and runner-up for each Academy Award category, and compete on a leaderboard. Hosted on Vercel free tier with Neon PostgreSQL.

## Tech Stack

- **Framework**: Next.js 14 with App Router (NOT Pages Router)
- **Language**: TypeScript — strict mode, no `any` types
- **Database**: PostgreSQL on Neon, managed via Prisma ORM
- **Auth**: NextAuth.js v4
- **Styling**: Tailwind CSS
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

### Scoring Logic

- Scoring rules live in `src/lib/scoring/`
- Each category has a `pointValue` (stored in DB, configurable per ceremony year)
- First-choice correct = full `pointValue`
- Runner-up correct = `pointValue * 0.5` (configurable multiplier)
- If the user's runner-up wins (but first choice doesn't), they get the runner-up multiplier
- Total score = sum of points across all categories

### Auth

- NextAuth config lives in `src/lib/auth/`
- Google OAuth is the primary login method (lowest friction for invite links)
- Email magic-link as fallback; optionally GitHub OAuth
- Env vars needed: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Protect pool-write and admin routes with middleware or server-side session checks

### Vercel Free Tier Constraints

- Serverless functions: 10s timeout (keep DB queries fast)
- Edge functions: consider for leaderboard if latency matters
- No cron jobs on free tier — use on-demand revalidation or ISR
- Bundle size: keep client JS minimal; heavy logic stays server-side
- Neon free tier: 0.5 GB storage, 1 compute endpoint — sufficient for this app

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
- **PoolMember** — a user's membership in a pool (users can be in multiple pools)
- **Prediction** — a user's first-choice and runner-up pick for a category
- **User** — authenticated user account

## Error Handling

- Use Next.js `error.tsx` boundaries for page-level errors
- Return structured error responses from API routes: `{ error: string, status: number }`
- Log errors server-side; do not expose stack traces to the client

## Environment Variables

Required in `.env.local`:
- `DATABASE_URL` — Neon Postgres connection string
- `NEXTAUTH_URL` — app base URL
- `NEXTAUTH_SECRET` — random secret for sessions
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
