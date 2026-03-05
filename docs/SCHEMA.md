# Database Schema

This document describes the data model for OscarPoolVibes. The source of truth is `prisma/schema.prisma`; this doc provides context and rationale.

## Entity Relationship Diagram (text)

```
User 1──* PoolMember *──1 Pool
User 1──* Prediction
Pool *──1 CeremonyYear
CeremonyYear 1──* Category
Category 1──* Nominee
Prediction *──1 Category
Prediction *──1 Nominee (firstChoice)
Prediction *──1 Nominee (runnerUp)
Category 0..1──1 Nominee (winner)
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
| runnerUpMultiplier | Float | Default 0.5 — multiplier applied to pointValue for runner-up hit |
| winnerId | String? | FK → Nominee (set after winners announced) |
| createdAt | DateTime | |

**Unique constraint**: `(ceremonyYearId, name)`

**Design note**: `pointValue` allows different categories to be worth different amounts (e.g., Best Picture worth more than Best Short Film). `runnerUpMultiplier` is stored per-category so it can be tuned, but will default to 0.5.

### Nominee

A nominated movie/person within a category. Stores enough info for display.

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| categoryId | String | FK → Category |
| name | String | Name of the nominee (movie title or person name) |
| subtitle | String? | Additional context (e.g., movie name for actor categories) |
| imageUrl | String? | Poster or headshot |
| isWinner | Boolean | Denormalized flag, set when winners are revealed |
| createdAt | DateTime | |

**Unique constraint**: `(categoryId, name)`

### Pool

A group of friends competing together. Each pool is scoped to a single ceremony year.

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| name | String | Pool name (e.g., "The Film Buffs") |
| ceremonyYearId | String | FK → CeremonyYear |
| inviteCode | String | Unique, shareable join code |
| createdById | String | FK → User (pool creator) |
| createdAt | DateTime | |

**Unique constraint**: `inviteCode`

### PoolMember

Join table: which users are in which pools.

| Column | Type | Notes |
|--------|------|-------|
| id | String (cuid) | PK |
| poolId | String | FK → Pool |
| userId | String | FK → User |
| joinedAt | DateTime | |

**Unique constraint**: `(poolId, userId)`

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

## Scoring Algorithm

Computed at read time (not stored), keeping the DB simple:

```
For each category:
  if prediction.firstChoice == category.winner:
    points += category.pointValue
  else if prediction.runnerUp == category.winner:
    points += category.pointValue * category.runnerUpMultiplier

Total score = sum of points across all categories
```

Leaderboard = all pool members sorted by total score descending.

## Indexing Strategy

- All foreign key columns get an index (Prisma does this by default for relations)
- `CeremonyYear.year` — unique index for quick lookup
- `Pool.inviteCode` — unique index for join-by-code
- `Prediction(poolMemberId, categoryId)` — unique composite for upsert logic
- `Category(ceremonyYearId, displayOrder)` — for ordered category listing

## Migration Notes

- Use `npx prisma migrate dev --name <description>` during development
- Use `npx prisma migrate deploy` in CI/production
- Seed data script (`scripts/seed.ts`) should populate at least one ceremony year with real categories and nominees for testing
