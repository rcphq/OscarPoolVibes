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

> **Visibility rule**: Other members' picks are hidden until `predictionsLocked = true`. This prevents copying. After lock, all picks become visible to all pool members. This is enforced at the API/server-action level — the predictions query filters based on lock status.

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
| R-4 | Clear a category winner | Remove a winner entered in error, reverting the category to "not yet announced" | `DELETE /api/results` (with `expectedVersion`) |
| R-5 | Handle result conflict | When another user already changed the result, see who changed it, what they set, and decide whether to override | Client-side conflict resolution UI |
| R-6 | View result audit trail | See who set each result and when it was last updated | `/results/[ceremonyYearId]` |

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
| A-11 | Lock predictions | Set `predictionsLocked = true` to freeze all picks (typically before ceremony starts) | `/admin` (ceremony-scoped action, applied to the active ceremony year) |
| A-12 | Unlock predictions | Re-open predictions (e.g., ceremony postponed) | `/admin` (ceremony-scoped action, applied to the active ceremony year) |
| A-13 | Set results | Set/update winners for each category (same as Results Manager) | `/results/[ceremonyYearId]` |

> **Scope note**: `predictionsLocked` is a field on `CeremonyYear`, making it **ceremony-wide** (affects all pools for that ceremony). Any Pool Admin can lock predictions, but the lock applies globally. This is intentional — Oscar predictions should lock at the same time for everyone to prevent information leakage.

**Decision**: Any Pool Admin can lock predictions for the entire ceremony. This is acceptable because: (1) pool admins are trusted users who created pools, (2) the unlock action is also available so mistakes can be reversed, and (3) adding a separate "Site Admin" role adds complexity not justified for a friend-group app. If abuse becomes an issue, restrict to a site-admin role later.

**Constraints**:
- Cannot switch access type from open → invite-only (would lock out people who already joined via link)
- Cannot remove themselves as admin (pool always has a creator)

---

## 6. Pool Lifecycle Actions

These actions apply across roles and handle pool membership changes and cleanup.

### 6a. Member Self-Service

| # | Use Case | Description | Route |
|---|----------|-------------|-------|
| L-1 | Leave a pool | Member voluntarily exits a pool. Predictions are retained for historical leaderboard accuracy but marked as "left." | `/pools/[id]` (leave action) |
| L-2 | View pool history | After leaving, a user can still view the pool's final leaderboard (read-only) if they were a member when the ceremony completed | `/pools/[id]/leaderboard` |

**Constraints**:
- Pool Admin cannot leave their own pool (must transfer admin first or delete the pool)
- Leaving does not delete predictions — leaderboard history is preserved
- A user who left can rejoin if the pool is still open or they receive a new invite

### 6b. Admin Pool Management

| # | Use Case | Description | Route |
|---|----------|-------------|-------|
| L-3 | Remove a member | Admin kicks a member from the pool. Member's predictions are retained for leaderboard history. | `/pools/[id]/members` (remove action) |
| L-4 | Transfer admin role | Admin transfers the ADMIN role to another member, demoting themselves to MEMBER | `/pools/[id]/settings` |
| L-5 | Archive a pool | Admin archives a pool. The pool is hidden from all listings and no new joins or predictions are allowed. All data (predictions, invites, memberships, scores) is preserved for historical reference. | `/pools/[id]/settings` (archive action) |

**Constraints**:
- Remove member: cannot remove yourself (use "leave" instead)
- Transfer admin: the target must be an existing pool member
- Archive pool: requires typing the pool name to confirm. Sets `Pool.archivedAt` timestamp. Archived pools are excluded from default queries but remain accessible for historical leaderboard viewing.

### 6c. Account Management

| # | Use Case | Description | Route |
|---|----------|-------------|-------|
| L-6 | Delete account | User permanently deletes their account and all associated data (predictions, memberships, created pools). Requires confirmation. | `/profile/delete` |
| L-7 | Export my data | User downloads all their data (profile, predictions, pool memberships, scores) as JSON | `/profile/export` |

**Constraints**:
- Account deletion cascades to all pool memberships and predictions
- If the user is the sole Admin of a pool, they must transfer admin or delete the pool first
- Data export follows GDPR Article 20 (right to data portability)

**Decision**: Pool deletion uses **soft delete** (archived). An `archivedAt` timestamp field on `Pool` marks deletion. Archived pools are excluded from default queries but remain accessible for historical leaderboard viewing. This preserves data integrity for completed ceremonies while giving admins a "delete" action.

---

## Permission Matrix

Summary of what each role can do. ✓ = allowed, — = not allowed.

| Action | Visitor | User | Member | Results Mgr | Admin |
|--------|:-------:|:----:|:------:|:-----------:|:-----:|
| View landing page | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sign in / sign up | ✓ | — | — | — | — |
| Create pool | — | ✓ | ✓ | ✓ | ✓ |
| Join pool | — | ✓ | ✓ | ✓ | ✓ |
| View pool list | — | ✓ | ✓ | ✓ | ✓ |
| View categories & nominees | — | — | ✓ | ✓ | ✓ |
| Make/edit predictions | — | — | ✓ | ✓ | ✓ |
| View leaderboard | — | — | ✓ | ✓ | ✓ |
| View score breakdown | — | — | ✓ | ✓ | ✓ |
| View results | — | — | ✓ | ✓ | ✓ |
| Share pool link | — | — | ✓ | ✓ | ✓ |
| Set category winners | — | — | — | ✓ | ✓ |
| Update category winners | — | — | — | ✓ | ✓ |
| Clear category winners | — | — | — | ✓ | ✓ |
| Handle result conflicts | — | — | — | ✓ | ✓ |
| View result audit trail | — | — | — | ✓ | ✓ |
| Edit pool settings | — | — | — | — | ✓ |
| Invite users (invite-only) | — | — | — | — | ✓ |
| Manage invites | — | — | — | — | ✓ |
| Grant/revoke Results Mgr | — | — | — | — | ✓ |
| Lock/unlock predictions | — | — | — | — | ✓ |
| Remove pool members | — | — | — | — | ✓ |
| Delete pool | — | — | — | — | ✓ |

---

## Cross-Cutting Concerns

### Multi-Pool Behavior
- A user can be in **multiple pools** simultaneously (work, family, film nerds)
- Predictions are **per-pool** — a user can make different picks in different pools
- Roles are **per-pool** — a user can be ADMIN of one pool and MEMBER of another
- Results are **per-ceremony** — setting a winner in one pool sets it for all pools in that ceremony year

### Ceremony Lifecycle

```
SETUP → PREDICTIONS_OPEN → LOCKED → LIVE → COMPLETE
  │           │                │        │        │
  │  Categories &       Users join    Predictions  Winners    All categories
  │  nominees           pools &      frozen     announced   have winners;
  │  populated          make picks              & entered   leaderboard final
```

See `docs/SCHEMA.md` (Ceremony Lifecycle State) for how these states map to database fields.

### Tier Limits

Pool creation limits, member caps, and feature gates are defined in [MONETIZATION.md](MONETIZATION.md). Key free-tier constraints:

- **3 pools** per ceremony year per user
- **10 members** per pool
- Standard scoring rules only
- Basic leaderboard (no analytics)

See [MONETIZATION.md](MONETIZATION.md) for Pro and Commissioner tier unlocks.

### Notification Strategy

Notifications are critical for an event-driven app with a single peak night. Priority notifications for MVP (Phase 7):

| Event | Channel | Priority |
|-------|---------|----------|
| Pool invite received | Email | MVP |
| Predictions lock in 1 hour | Email + in-app | MVP |
| Winner announced (per category) | In-app toast | MVP |
| New member joined your pool | In-app | MVP |
| All results in — final leaderboard | Email + in-app | MVP |

Post-MVP notifications (Phase 8): push notifications, real-time WebSocket updates, social sharing prompts.

### Rate Limiting & Abuse Prevention

- **Join endpoint**: Rate-limit to prevent brute-force pool code guessing (e.g., 10 attempts per minute per IP)
- **Results API**: Rate-limit to prevent spam during ceremony (e.g., 30 requests per minute per user)
- **Invite sending**: Rate-limit to prevent email abuse (e.g., 50 invites per hour per user)
- **Open pool codes**: 8-character nanoid (alphanumeric) provides ~2.8 trillion combinations — brute-force infeasible, but rate limiting adds defense in depth
- Pool admins can regenerate invite codes if a code is leaked

**Decision**: Invite codes rotate only on admin request (simpler). Admins can regenerate a pool's invite code from pool settings if a code is leaked. No automatic rotation — it adds complexity and breaks shared links unexpectedly.

---

## Error Scenarios

User-facing error states that must be handled gracefully. Each scenario needs a specific UI treatment and error message.

### Authentication Errors

| Scenario | Trigger | Expected Behavior |
|----------|---------|-------------------|
| OAuth failure | Google sign-in cancelled or fails | Show error message with retry option; offer magic-link fallback |
| Magic-link expired | User clicks email link after expiration | Show "Link expired" message with option to request a new one |
| Session expired | User's session times out mid-action | Redirect to sign-in, preserve the intended destination URL |

### Pool Errors

| Scenario | Trigger | Expected Behavior |
|----------|---------|-------------------|
| Pool full | User tries to join a pool at `maxMembers` cap | Show "Pool is full" message; suggest creating their own pool |
| Duplicate join | User tries to join a pool they're already in | Show "You're already a member" with link to the pool |
| Invite expired | User clicks an invite link past `expiresAt` | Show "Invite expired" with option to request a new one from the pool admin |
| Invite email mismatch | User signs in with different email than the invite | Show "This invite was sent to [email]. Please sign in with that account." |
| Invalid invite code | User enters a non-existent pool code | Show "Pool not found" message |
| Pool not found | User navigates to a deleted or non-existent pool | 404 page with link back to pool listing |

### Prediction Errors

| Scenario | Trigger | Expected Behavior |
|----------|---------|-------------------|
| Predictions locked | User tries to submit/edit after lock | Show "Predictions are locked" banner; form is read-only |
| Same nominee for both picks | User selects same nominee as first choice and runner-up | Client-side validation prevents submission; server-side rejects if bypassed |
| Invalid nominee | Nominee doesn't belong to the category (data integrity issue) | Server rejects with 400; log as potential bug |

### Results Errors

| Scenario | Trigger | Expected Behavior |
|----------|---------|-------------------|
| Version conflict | Two users set/clear different winners simultaneously | Show conflict dialog: "User X set [nominee] as winner at [time]. Override or accept?" |
| Permission denied | Non-authorized user tries to set/clear results | 403 response; UI hides results-entry controls for unauthorized users |
| Invalid winner | Winner nominee doesn't belong to the category | Server rejects with 400 |
| Clear conflict | User tries to clear a result that was updated since page load | 409 response with current result details; user must refresh |

### General Errors

| Scenario | Trigger | Expected Behavior |
|----------|---------|-------------------|
| Network error | Lost connection during save | Show toast: "Save failed. Retrying..." with automatic retry |
| Server error | Unhandled exception | Show error boundary (`error.tsx`) with "Something went wrong" and retry option |
| Rate limited | Too many requests from one client | Show "Please slow down" message; implement exponential backoff |
| Not found | Any invalid URL | Custom 404 page with navigation back to home |
