# Implementation Plan

Phased delivery plan for OscarPoolVibes. Each phase is a working, deployable increment.

---

## Phase 1: Project Scaffolding & Database

**Goal**: Bootable Next.js app with database connected and schema migrated.

- [ ] Initialize Next.js 14 project with TypeScript, Tailwind, ESLint
- [ ] Configure Prisma with Neon PostgreSQL
- [ ] Write `prisma/schema.prisma` with all models (User, CeremonyYear, Category, Nominee, Pool, PoolMember, Prediction)
- [ ] Run initial migration
- [ ] Create singleton Prisma client (`src/lib/db/client.ts`)
- [ ] Create seed script with 2024/2025 ceremony data (real categories & nominees)
- [ ] Verify deployment to Vercel connects to Neon

**Deliverable**: `npm run dev` shows a Next.js welcome page; `npx prisma studio` shows seeded data.

---

## Phase 2: Authentication

**Goal**: Users can sign up, sign in, and have a session.

- [ ] Install and configure NextAuth.js with Prisma adapter
- [ ] Set up email magic-link provider (Resend)
- [ ] Optionally add GitHub OAuth provider
- [ ] Create sign-in page (`src/app/auth/signin/page.tsx`)
- [ ] Add session provider to root layout
- [ ] Create auth middleware to protect routes
- [ ] Add user avatar/name display in header

**Deliverable**: Users can log in via email link and see their name in the header.

---

## Phase 3: Pool Management

**Goal**: Users can create pools, generate invite codes, and join pools.

- [ ] Create pool page (`src/app/pools/page.tsx`) — list user's pools
- [ ] Create pool creation form (`src/app/pools/create/page.tsx`)
- [ ] Implement invite code generation (nanoid, 8 chars)
- [ ] Create join-by-code page (`src/app/pools/join/page.tsx`)
- [ ] Build pool detail page (`src/app/pools/[id]/page.tsx`) — shows members, link to predictions
- [ ] Add shareable invite link with copy-to-clipboard

**Deliverable**: Users can create a pool, share the invite code, and friends can join.

---

## Phase 4: Predictions

**Goal**: Users can make their first-choice and runner-up picks for every category.

- [ ] Build prediction form component — for each category, two dropdowns (first choice, runner-up)
- [ ] Validate that first choice != runner-up (client + server)
- [ ] Create server action/API to save predictions (upsert by poolMember + category)
- [ ] Show prediction summary page — all picks at a glance
- [ ] Respect `predictionsLocked` flag — disable form when locked
- [ ] Allow editing predictions until lock

**Deliverable**: Users fill out their Oscar ballot within a pool. Picks persist across sessions.

---

## Phase 5: Scoring & Leaderboard

**Goal**: After winners are set, display scores and rankings.

- [ ] Implement scoring function in `src/lib/scoring/`
- [ ] Write thorough unit tests for scoring edge cases
- [ ] Build leaderboard page (`src/app/pools/[id]/leaderboard/page.tsx`)
- [ ] Show per-category breakdown (which picks were correct)
- [ ] Highlight correct first-choice (full points) and correct runner-up (partial points)
- [ ] Sort members by total score descending, handle ties

**Deliverable**: After winners are entered, the leaderboard shows everyone's score and rank.

---

## Phase 6: Admin / Winner Management

**Goal**: A pool creator (or site admin) can manage ceremony data and reveal winners.

- [ ] Build admin page for managing ceremony years (`src/app/admin/page.tsx`)
- [ ] Add UI to set winner for each category
- [ ] Add UI to lock/unlock predictions
- [ ] Add UI to create/edit categories and nominees (for future years)
- [ ] Role-based access: only pool creator or admin can access these pages

**Deliverable**: Admin can enter winners during the ceremony; leaderboard updates on refresh.

---

## Phase 7: Polish & UX

**Goal**: Make the app feel good to use.

- [ ] Add loading states (Suspense boundaries, skeleton loaders)
- [ ] Add error boundaries (`error.tsx` files)
- [ ] Mobile-responsive design pass
- [ ] Add og:image and meta tags for sharing pool invite links
- [ ] Add toast notifications for actions (saved, joined, etc.)
- [ ] Light/dark theme support
- [ ] Favicon and branding

**Deliverable**: A polished, shareable app ready for Oscar night.

---

## Phase 8: Stretch Goals (Post-MVP)

These are not required for launch but are natural extensions:

- [ ] Real-time leaderboard updates during the ceremony (Pusher/Ably)
- [ ] Historical stats — "how did you do across years"
- [ ] Oscar data import script from an external API/Wikipedia
- [ ] Social sharing — post your score to Twitter/Instagram
- [ ] Email reminders before predictions lock
- [ ] Multiple scoring presets (casual, competitive, custom)

---

## Definition of Done (per phase)

1. All listed tasks completed
2. Tests pass (`npm run test`)
3. Lint clean (`npm run lint`)
4. Builds without errors (`npm run build`)
5. Deployed to Vercel preview and manually verified
