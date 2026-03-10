# Database Schema

This document describes the data model for OscarPoolVibes. The source of truth is `prisma/schema.prisma`; this doc provides context and rationale.

## Entity Relationship Diagram (text)

**Legend**: `1──*` = one-to-many, `*──1` = many-to-one, `0..1` = optional (zero or one), `*──*` implicit via join table.

```
User 1──* PoolMember *──1 Pool
User 1──* Pool (createdBy)
User 1──* PoolInvite (invitedBy)
User 1──* Prediction
User 1──* CategoryResult (setBy)
Pool 1──* PoolInvite
Pool *──1 CeremonyYear
CeremonyYear 1──* Category
Category 1──* Nominee
Category 1──0..1 CategoryResult
Prediction *──1 Category
Prediction *──1 Nominee (firstChoice)
Prediction *──1 Nominee (runnerUp)
Category 0..1──1 Nominee (winner)
CategoryResult *──1 Nominee (winner)
```

## Tables

### User

Authenticated users. Managed by NextAuth.js (Account/Session tables omitted here — NextAuth generates them).

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| name | String? | Display name |
| email | String | Unique |
| emailVerified | DateTime? | NextAuth field |
| image | String? | Avatar URL |
| createdAt | DateTime | |
| updatedAt | DateTime | |

> **Note**: NextAuth.js also generates `Account`, `Session`, and `VerificationToken` models (omitted here). The `VerificationToken` model supports email magic-link authentication.

### CeremonyYear

Represents one Academy Awards ceremony. Categories and nominees change each year, so everything is scoped to a ceremony.

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| year | Int | e.g., 2024 (calendar year of the ceremony) |
| name | String | e.g., "96th Academy Awards" |
| ceremonyDate | DateTime? | Date of the ceremony |
| isActive | Boolean | Whether this is the current/open ceremony |
| predictionsLocked | Boolean | When true, no more predictions can be submitted |
| createdAt | DateTime | |

**Unique constraint**: `year`

### Category

An award category within a ceremony year. Categories can differ between years (some get added/removed), so each is tied to a specific ceremony.

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| ceremonyYearId | String | FK → CeremonyYear |
| name | String | e.g., "Best Picture" |
| displayOrder | Int | Sort order on the UI |
| pointValue | Int | Points awarded for a correct first-choice pick |
| runnerUpMultiplier | Float | Default 0.6 — multiplier applied to pointValue for runner-up hit |
| winnerId | String? | FK → Nominee (set after winners announced) |
| scoringLastChangedBy | String? | FK → User.id — userId of last admin/results-manager to override scoring |
| createdAt | DateTime | |
| updatedAt | DateTime | Auto-managed by Prisma (`@updatedAt`) |

**Unique constraint**: `(ceremonyYearId, name)`

**Design note**: `pointValue` allows different categories to be worth different amounts (e.g., Best Picture worth more than Best Short Film). `runnerUpMultiplier` is stored per-category so it can be tuned; default is 0.6. ADMIN and RESULTS_MANAGER roles can override these values via `/pools/[id]/scoring`. Changes are ceremony-wide (affect all pools) and take effect immediately since scoring is computed at read time (ADR-3). `scoringLastChangedBy` provides a lightweight audit trail without a separate history table.

### Nominee

A nominated movie/person within a category. Stores enough info for display.

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| categoryId | String | FK → Category |
| name | String | Name of the nominee (movie title or person name) |
| subtitle | String? | Additional context (e.g., movie name for actor categories) |
| imageUrl | String? | Poster or headshot |
| isWinner | Boolean | Denormalized flag, set when winners are revealed. The **source of truth** for a category's winner is `Category.winnerId` (and `CategoryResult`). `isWinner` is a denormalized copy for query convenience (e.g., highlighting winners in nominee lists without joining to Category). Both fields are updated atomically in the `setResult()` transaction. |
| createdAt | DateTime | |

**Unique constraint**: `(categoryId, name)`

### Pool

A group of friends competing together. Each pool is scoped to a single ceremony year. Users can create and belong to multiple pools simultaneously.

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| name | String | Pool name (e.g., "The Film Buffs") |
| ceremonyYearId | String | FK → CeremonyYear |
| inviteCode | String | Unique, shareable join code (nanoid, 8 chars) |
| accessType | Enum (OPEN, INVITE_ONLY) | Default: INVITE_ONLY. OPEN = anyone with the link can join. INVITE_ONLY = must be explicitly invited. |
| maxMembers | Int? | Optional cap on pool size (null = unlimited) |
| createdById | String | FK → User (pool creator / admin of this pool) |
| archivedAt | DateTime? | Soft delete timestamp. When set, pool is hidden from listings but data is preserved for historical reference. |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Unique constraint**: `inviteCode`

**Design note**: A user can create multiple pools (e.g., one for coworkers, one for family) and join pools created by others. The `accessType` field controls whether the pool is open (link-shareable) or invite-only (requires an explicit invite from the pool creator).

**Soft delete**: Pools are never hard-deleted. Setting `archivedAt` hides the pool from all listings and prevents new joins or predictions. All historical data (members, predictions, scores) is preserved. Only the pool ADMIN can archive a pool. All queries that list pools must filter `WHERE archivedAt IS NULL`.

### PoolInvite

Explicit invitations sent by pool creators to specific users (for INVITE_ONLY pools).

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| poolId | String | FK → Pool |
| email | String | Email of the invited user |
| invitedById | String | FK → User (who sent the invite) |
| status | Enum (PENDING, ACCEPTED, DECLINED, EXPIRED) | Tracks invite lifecycle |
| token | String | Unique token for the invite link |
| expiresAt | DateTime? | Optional expiration |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Unique constraint**: `(poolId, email)` — one active invite per email per pool
**Unique constraint**: `token`

**Design note**: For invite-only pools, the creator sends invites by email. The recipient receives a link with a unique token. If they're already a user they join immediately; if not, they sign up first and are then added to the pool. Open pools skip this — anyone with the invite code/link can join.

### PoolMember

Join table: which users are in which pools. A user can be a member of many pools.

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| poolId | String | FK → Pool |
| userId | String | FK → User |
| role | Enum (MEMBER, ADMIN, RESULTS_MANAGER) | Default: MEMBER. ADMIN = pool creator. RESULTS_MANAGER = can set ceremony winners. |
| joinedAt | DateTime | |
| leftAt | DateTime? | When set, member has left the pool. Predictions are preserved for historical leaderboard accuracy. |

**Unique constraint**: `(poolId, userId)`

**Soft leave**: Members are never hard-deleted from pools. Setting `leftAt` hides them from active member lists while preserving their predictions and scores on the leaderboard (marked as "left"). A member who left can rejoin by clearing `leftAt` (if pool is open or they receive a new invite).

### Prediction

A user's picks for a single category within a pool. Each user gets one first-choice and one runner-up per category per pool.

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| poolMemberId | String | FK → PoolMember |
| categoryId | String | FK → Category |
| firstChoiceId | String | FK → Nominee (primary pick) |
| runnerUpId | String | FK → Nominee (secondary pick) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Unique constraint**: `(poolMemberId, categoryId)` — one prediction per member per category

**Validation**: `firstChoiceId != runnerUpId` (enforced in application logic)

**Cross-entity validation** (enforced in application logic):
- `firstChoiceId` must reference a Nominee where `nominee.categoryId == prediction.categoryId`
- `runnerUpId` must reference a Nominee where `nominee.categoryId == prediction.categoryId`
- These constraints cannot be expressed as foreign keys because Prisma doesn't support composite FK conditions. Enforce in the prediction-save server action.

See `CLAUDE.md` Business Rules section for the full list of application-level constraints.

### CategoryResult

Tracks who set the winner for each category, with optimistic concurrency control for conflict prevention. Results are **global per ceremony** — Oscar winners are the same for every pool. Permissions to set results are granted at the pool level.

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| categoryId | String | FK → Category (unique — one result per category) |
| winnerId | String | FK → Nominee (the winner) |
| setById | String | FK → User (who set this result) |
| version | Int | Optimistic lock counter — increment on each update |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Unique constraint**: `categoryId` — one result per category globally

**Design note**: The `version` field enables optimistic concurrency control. When updating a result, the client sends the `version` it last saw. If the server's version differs, it means someone else updated the result in the meantime, and a conflict error is returned with details about who changed it and what they set. This prevents two authorized users from unknowingly overwriting each other's result entries.

**Permission model**: Users with `ADMIN` or `RESULTS_MANAGER` role in *any* pool for the ceremony can set results. Pool creators (ADMIN) can grant/revoke the `RESULTS_MANAGER` role to other pool members.

**Cross-entity validation** (enforced in application logic):
- `winnerId` must reference a Nominee where `nominee.categoryId == categoryResult.categoryId`
- This is validated in `src/lib/results/set-result.ts` before the database write.

## Scoring Algorithm

Computed at read time (not stored), keeping the DB simple:

```
For each category:
  if prediction.firstChoice == category.winner:
    points += category.pointValue
  else if prediction.runnerUp == category.winner:
    points += Math.round(category.pointValue * category.runnerUpMultiplier)

Total score = sum of points across all categories
```

> `Math.round()` on the runner-up calculation prevents floating-point imprecision (e.g. `180 * 0.6 → 107.999…`) from producing non-integer leaderboard scores.

Leaderboard = all pool members sorted by total score descending.

### 4-Tier Point System

Categories are assigned point values based on a 4-tier system reflecting their prominence and audience interest:

| Tier | Points | Runner-up | Categories |
|------|--------|-----------|------------|
| 1 | 180 | 108 | Best Picture, Best Director, Best Actor, Best Actress, Best Supporting Actor, Best Supporting Actress |
| 2 | 90 | 54 | Best Film Editing, Best Cinematography, Best Visual Effects, Best Original Screenplay, Best Adapted Screenplay, Best Animated Feature |
| 3 | 30 | 18 | Best Costume Design, Best Production Design, Best Makeup and Hairstyling, Best Original Song, Best Sound |
| 4 | 15 | 9 | Best Animated Short, Best Live Action Short, Best Documentary Short, Best Documentary Feature, Best International Feature Film, Best Original Score, Best Casting (2026 only) |

### Runner-Up Multiplier (0.6x)

The runner-up multiplier is set to 0.6 rather than 0.5. This creates meaningful tier overlap: a Tier 1 runner-up pick (108 points) is worth more than a Tier 2 first-choice pick (90 points). This rewards players who have strong instincts about the marquee categories even when their first pick doesn't win, preventing a strategy of only focusing on lower-tier categories for easy points.

## Indexing Strategy

- All foreign key columns get an index (Prisma does this by default for relations)
- `CeremonyYear.year` — unique index for quick lookup
- `Pool.inviteCode` — unique index for join-by-code
- `Pool.accessType` — for filtering open vs invite-only pools
- `PoolInvite.token` — unique index for invite link lookup
- `PoolInvite(poolId, email)` — unique composite, one invite per email per pool
- `Prediction(poolMemberId, categoryId)` — unique composite for upsert logic
- `Category(ceremonyYearId, displayOrder)` — for ordered category listing

**Note on redundant indexes**: Unique constraints implicitly create indexes in PostgreSQL. The following explicit `@@index` entries in the Prisma schema are redundant and can be removed:
- `CategoryResult @@index([categoryId])` — already covered by `@unique` on `categoryId`
- `PoolInvite @@index([token])` — already covered by `@unique` on `token`

## Ceremony Lifecycle State

The `CeremonyYear` model uses two boolean flags (`isActive`, `predictionsLocked`) to represent lifecycle state. The effective state can be derived:

| State | `isActive` | `predictionsLocked` | All results set? | Description |
|-------|-----------|---------------------|-------------------|-------------|
| **SETUP** | `false` | `false` | No | Categories &amp; nominees being populated |
| **PREDICTIONS_OPEN** | `true` | `false` | No | Users joining pools and making picks |
| **LOCKED** | `true` | `true` | No | Predictions frozen, ceremony starting |
| **LIVE** | `true` | `true` | Partial | Winners being announced and entered |
| **COMPLETE** | `true` | `true` | Yes | All categories have winners, leaderboard final |

**Future consideration**: A `status` enum (SETUP | PREDICTIONS_OPEN | LOCKED | LIVE | COMPLETE) could replace the boolean-derived state. This would be more explicit and prevent invalid state combinations (e.g., `isActive=false` + `predictionsLocked=true`). For now, the boolean approach is simpler and sufficient. Track as a GitHub Issue with label `tech-debt` if the boolean approach causes bugs.

**Completion detection**: The app determines a ceremony is COMPLETE by comparing `COUNT(CategoryResult WHERE ceremonyYear = X)` against `COUNT(Category WHERE ceremonyYear = X)`. When they match, all categories have winners.

## Application-Level Constraints Summary

These constraints cannot be expressed in the Prisma schema and must be enforced in server actions / API routes:

| Constraint | Scope | Enforcement Location |
|-----------|-------|---------------------|
| `firstChoiceId != runnerUpId` | Prediction | Prediction save server action |
| Nominee belongs to prediction's category | Prediction | Prediction save server action |
| Winner belongs to result's category | CategoryResult | `src/lib/results/set-result.ts` |
| Pool access: INVITE_ONLY → OPEN only | Pool | Pool settings server action |
| No predictions when `predictionsLocked = true` | Prediction | Prediction save server action |
| Results permission: ADMIN or RESULTS_MANAGER in any ceremony pool | CategoryResult | `src/lib/results/permissions.ts` |
| Invite token + email match for INVITE_ONLY pools | PoolInvite | Join pool server action |
| Max members cap (`Pool.maxMembers`) | PoolMember | Join pool server action |
| Archived pools excluded from listings (`archivedAt IS NULL`) | Pool | All pool listing queries |
| Only ADMIN can archive a pool | Pool | Pool archive server action |
| Left members excluded from active lists (`leftAt IS NULL`) | PoolMember | All member listing queries |
| Predictions hidden until `predictionsLocked = true` | Prediction | Prediction listing queries — other members' picks invisible before lock |
| Sole admin must transfer role before deleting account | User | Account deletion server action |
| Max members enforced atomically (serialized transaction) | PoolMember | Join pool server action |

## Migration Notes

- Use `npx prisma migrate dev --name <description>` during development
- Use `npx prisma migrate deploy` in CI/production
- Seed data script (`scripts/seed.ts`) should populate at least one ceremony year with real categories and nominees for testing
