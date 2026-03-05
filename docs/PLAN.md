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
- [ ] Set up Google OAuth provider (primary login method)
- [ ] Set up email magic-link provider (Resend) as fallback
- [ ] Optionally add GitHub OAuth provider
- [ ] Create sign-in page (`src/app/auth/signin/page.tsx`) with Google SSO button prominently displayed
- [ ] Add session provider to root layout
- [ ] Create auth middleware to protect routes
- [ ] Add user avatar/name display in header

**Deliverable**: Users can log in via Google SSO (or email link) and see their name/avatar in the header.

---

## Phase 3: Pool Management

**Goal**: Users can create and manage multiple pools with configurable access (open or invite-only).

- [ ] Create pool listing page (`src/app/pools/page.tsx`) — shows all pools the user belongs to or has created
- [ ] Create pool creation form (`src/app/pools/create/page.tsx`) — name, ceremony year, access type (open/invite-only)
- [ ] Support multiple pools per user (create several, join several)
- [ ] Implement invite code generation (nanoid, 8 chars) for all pools
- [ ] **Open pools**: anyone with the invite link/code can join directly
- [ ] **Invite-only pools**: pool creator sends invites by email; only invited users can join
- [ ] Build invite management UI for pool creators (`src/app/pools/[id]/invites/page.tsx`)
  - [ ] Send invites by entering email addresses
  - [ ] View pending/accepted/declined invite statuses
  - [ ] Resend or revoke pending invites
- [ ] Generate shareable invite links (`/pools/join?token=<unique-token>`)
  - [ ] Open pool links go straight to join confirmation
  - [ ] Invite-only links validate the token and email match
- [ ] Build pool detail page (`src/app/pools/[id]/page.tsx`) — members list, pool settings, link to predictions
- [ ] Add copy-to-clipboard for invite link/code
- [ ] Pool creator can edit pool settings (name, access type) after creation

**Deliverable**: Users can create multiple pools, choose open or invite-only access, send invite links, and friends can join via link or code.

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

## Phase 6: Results Management & Permissions

**Goal**: Authorized users can manually set ceremony results with conflict prevention. Results are global per ceremony.

### 6a: Results Permission System
- [x] Add `RESULTS_MANAGER` role to `PoolMemberRole` enum
- [x] Implement permission check: ADMIN or RESULTS_MANAGER in any pool for the ceremony
- [x] API to grant/revoke `RESULTS_MANAGER` role (`POST /api/pools/[poolId]/permissions`)
- [x] API to list pool members with their roles (`GET /api/pools/[poolId]/permissions`)
- [ ] Build UI for pool admins to manage who can set results

### 6b: Setting Results with Conflict Prevention
- [x] `CategoryResult` model with `version` field for optimistic concurrency control
- [x] `setResult()` function: validates permission, checks nominee, detects version conflicts
- [x] API route `POST /api/results` — set winner with `expectedVersion` for conflict safety
- [x] API route `GET /api/results?ceremonyYearId=<id>` — get all results for a ceremony
- [x] Sync winners to `Category.winnerId` and `Nominee.isWinner` on result set
- [ ] Build results entry UI — dropdown per category, shows who last set each result
- [ ] Show conflict resolution UI when two users try to set different winners
- [ ] Add real-time or polling refresh to keep results UI in sync

### 6c: Admin / Ceremony Management
- [ ] Build admin page for managing ceremony years (`src/app/admin/page.tsx`)
- [ ] Add UI to lock/unlock predictions
- [ ] Add UI to create/edit categories and nominees (for future years)

**Deliverable**: Authorized users can enter winners during the ceremony with conflict detection; leaderboard updates on refresh.

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
4. Builds without errors (`npm run build`)
5. Deployed to Vercel preview and manually verified
