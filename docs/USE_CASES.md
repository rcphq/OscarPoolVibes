# Use Cases by Role

Complete breakdown of all user-facing functionality in OscarPoolVibes, organized by role. Each role inherits the capabilities of the roles above it.

---

## Roles Overview

| Role | Scope | How Assigned |
|------|-------|--------------|
| **Visitor** | Global | Not logged in |
| **Authenticated User** | Global | Logged in via Google SSO / email magic-link |
| **Pool Member** | Per-pool | Joined a pool via invite link/code |
| **Results Manager** | Per-pool (grants ceremony-wide result-setting) | Granted by Pool Admin |
| **Pool Admin** | Per-pool | Created the pool (automatic) |

> **Note on Results Managers**: The RESULTS_MANAGER role is granted per-pool, but the permission it grants (setting winners) is **global per ceremony**. Having RESULTS_MANAGER in *any* pool for a ceremony lets you set winners for that ceremony. This is because Oscar winners are the same for everyone.

---

## 1. Visitor (Unauthenticated)

A user who has not signed in. Minimal access — just enough to understand the app and sign up.

| # | Use Case | Description | Route |
|---|----------|-------------|-------|
| V-1 | View landing page | See what OscarPoolVibes is, how it works, call-to-action to sign up | `/` |
| V-2 | Sign in / Sign up | Authenticate via Google SSO (primary) or email magic-link (fallback) | `/auth/signin` |
| V-3 | Follow invite link | Click a shared pool link; redirected to sign in, then auto-join the pool | `/pools/join?code=...` or `/pools/join?token=...` |

**Cannot**: view pools, make predictions, see leaderboards, or set results.

---

## 2. Authenticated User (No Pool Context)

A signed-in user operating outside of any specific pool. Can create/join pools and manage their account.

| # | Use Case | Description | Route |
|---|----------|-------------|-------|
| U-1 | View my pools | See a list of all pools I've created or joined | `/pools` |
| U-2 | Create a pool | Set pool name, select ceremony year, choose access type (open/invite-only) | `/pools/create` |
| U-3 | Join an open pool | Enter an invite code or follow a link to join an open pool directly | `/pools/join?code=...` |
| U-4 | Accept a pool invite | Follow an invite-only link with a unique token; validate email matches | `/pools/join?token=...` |
| U-5 | Decline a pool invite | Decline an explicit email invitation | `/pools/join?token=...` (decline action) |
| U-6 | View profile | See my display name, email, avatar | `/profile` |
| U-7 | Sign out | End the current session | (header action) |

**Constraints**:
- Free tier: up to 3 pools per ceremony year
- Pro tier: unlimited pools

---

## 3. Pool Member (MEMBER role)

A regular participant in a specific pool. Can make predictions and view results.

### 3a. Predictions

| # | Use Case | Description | Route |
|---|----------|-------------|-------|
| M-1 | View all categories | See every award category for the pool's ceremony year with nominees | `/pools/[id]/predict` |
| M-2 | Make predictions | For each category, select a first-choice and runner-up nominee | `/pools/[id]/predict` |
| M-3 | Edit predictions | Change picks at any time before predictions are locked | `/pools/[id]/predict` |
| M-4 | View my prediction summary | See all my picks at a glance (first-choice + runner-up per category) | `/pools/[id]/my-picks` |

**Constraints**:
- First choice and runner-up must be different nominees
- Cannot submit/edit predictions after `predictionsLocked = true` on the ceremony year
- One prediction per category per pool membership

### 3b. Leaderboard & Scoring

| # | Use Case | Description | Route |
|---|----------|-------------|-------|
| M-5 | View leaderboard | See all pool members ranked by total score (descending) | `/pools/[id]/leaderboard` |
| M-6 | View score breakdown | See per-category detail: which picks were correct, points earned | `/pools/[id]/leaderboard` (expanded view) |
| M-7 | View other members' picks | After predictions lock, see what everyone else picked | `/pools/[id]/leaderboard` |

**Scoring rules**:
- First-choice correct: full `pointValue` for the category
- Runner-up correct (first-choice wrong): `pointValue * runnerUpMultiplier` (default 0.5)
- Neither correct: 0 points
- Total score = sum across all categories

### 3c. Pool Information

| # | Use Case | Description | Route |
|---|----------|-------------|-------|
| M-8 | View pool details | See pool name, ceremony year, member list, access type | `/pools/[id]` |
| M-9 | View results | See which nominees won each category and who set each result | `/pools/[id]/results` |
| M-10 | Share pool link | Copy the pool's invite link/code to share with friends | `/pools/[id]` (copy action) |

**Cannot**: invite members (invite-only pools), edit pool settings, grant roles, set results, lock predictions.

---

## 4. Results Manager (RESULTS_MANAGER role)

A pool member trusted to enter ceremony results. Can set winners for any category in the ceremony. This role exists so the pool admin doesn't have to do it alone on Oscar night.

> Inherits all Pool Member capabilities.

| # | Use Case | Description | Route |
|---|----------|-------------|-------|
| R-1 | View results entry form | See all categories with current winner (if set) and who set it | `/results/[ceremonyYearId]` |
| R-2 | Set a category winner | Select the winning nominee for a category | `POST /api/results` |
| R-3 | Update a category winner | Change a previously set winner (e.g., correction) | `POST /api/results` (with `expectedVersion`) |
| R-4 | Handle result conflict | When another user already changed the result, see who changed it, what they set, and decide whether to override | Client-side conflict resolution UI |
| R-5 | View result audit trail | See who set each result and when it was last updated | `/results/[ceremonyYearId]` |

**Conflict prevention flow**:
1. Client loads results, receives `version` for each category
2. Client sends update with `expectedVersion`
3. If version matches: update succeeds, version increments
4. If version differs: **409 Conflict** — response includes who changed it, what they set, and the current version
5. User reviews the conflict and can choose to override (sending the new version) or accept the existing result

**Constraints**:
- Must be RESULTS_MANAGER or ADMIN in at least one pool for the ceremony
- Cannot grant/revoke roles to others
- Cannot edit pool settings

---

## 5. Pool Admin (ADMIN role)

The pool creator. Has full control over pool settings, membership, and permissions. Automatically has results-setting permission.

> Inherits all Pool Member + Results Manager capabilities.

### 5a. Pool Configuration

| # | Use Case | Description | Route |
|---|----------|-------------|-------|
| A-1 | Edit pool settings | Change pool name, access type (invite-only → open only) | `/pools/[id]/settings` |
| A-2 | Set max members | Optionally cap the number of pool members | `/pools/[id]/settings` |

### 5b. Member & Invite Management

| # | Use Case | Description | Route |
|---|----------|-------------|-------|
| A-3 | Invite users by email | Send email invitations for invite-only pools | `/pools/[id]/invites` |
| A-4 | View invite statuses | See pending, accepted, declined, expired invites | `/pools/[id]/invites` |
| A-5 | Resend an invite | Re-send a pending invite email | `/pools/[id]/invites` |
| A-6 | Revoke an invite | Cancel a pending invite before it's accepted | `/pools/[id]/invites` |
| A-7 | View member list | See all current pool members with their roles | `/pools/[id]/members` |

### 5c. Permissions Management

| # | Use Case | Description | Route |
|---|----------|-------------|-------|
| A-8 | Grant Results Manager | Promote a MEMBER to RESULTS_MANAGER so they can set ceremony winners | `POST /api/pools/[poolId]/permissions` |
| A-9 | Revoke Results Manager | Demote a RESULTS_MANAGER back to MEMBER | `POST /api/pools/[poolId]/permissions` |
| A-10 | View member permissions | See which members can manage results | `GET /api/pools/[poolId]/permissions` |

### 5d. Ceremony Administration

| # | Use Case | Description | Route |
|---|----------|-------------|-------|
| A-11 | Lock predictions | Set `predictionsLocked = true` to freeze all picks (typically before ceremony starts) | `/admin` |
| A-12 | Unlock predictions | Re-open predictions (e.g., ceremony postponed) | `/admin` |
| A-13 | Set results | Set/update winners for each category (same as Results Manager) | `/results/[ceremonyYearId]` |

**Constraints**:
- Cannot switch access type from open → invite-only (would lock out people who already joined via link)
- Cannot remove themselves as admin (pool always has a creator)

---

## Permission Matrix

Summary of what each role can do:

| Action | Visitor | User | Member | Results Mgr | Admin |
|--------|---------|------|--------|-------------|-------|
| Sign in / sign up | x | — | — | — | — |
| Create pool | | x | x | x | x |
| Join pool | | x | x | x | x |
| View pool list | | x | x | x | x |
| View categories & nominees | | | x | x | x |
| Make/edit predictions | | | x | x | x |
| View leaderboard | | | x | x | x |
| View score breakdown | | | x | x | x |
| View results | | | x | x | x |
| Share pool link | | | x | x | x |
| Set category winners | | | | x | x |
| Update category winners | | | | x | x |
| Handle result conflicts | | | | x | x |
| View result audit trail | | | | x | x |
| Edit pool settings | | | | | x |
| Invite users (invite-only) | | | | | x |
| Manage invites | | | | | x |
| Grant/revoke Results Mgr | | | | | x |
| Lock/unlock predictions | | | | | x |

---

## Cross-Cutting Concerns

### Multi-Pool Behavior
- A user can be in **multiple pools** simultaneously (work, family, film nerds)
- Predictions are **per-pool** — a user can make different picks in different pools
- Roles are **per-pool** — a user can be ADMIN of one pool and MEMBER of another
- Results are **per-ceremony** — setting a winner in one pool sets it for all pools in that ceremony year

### Ceremony Lifecycle

```
1. SETUP        → Ceremony year created, categories & nominees populated
2. PREDICTIONS  → Users join pools and make their picks
3. LOCKED       → predictionsLocked = true; no more edits
4. LIVE         → Winners announced; Results Managers / Admins enter results
5. COMPLETE     → All categories have winners; leaderboard is final
```

### Free Tier Limits (from Monetization Strategy)
- 3 pools per ceremony year
- 25 members per pool
- Standard scoring only
- Basic leaderboard

### Pro Tier Unlocks
- Unlimited pools
- Advanced analytics (pick distribution, head-to-head)
- Custom pool branding
- Historical stats
- Export results
- Custom scoring rules

### Commissioner Tier Unlocks
- 100+ member pools
- Commissioner dashboard
- Embeddable leaderboard widget
- Per-category lock/unlock
- Multi-year archive
