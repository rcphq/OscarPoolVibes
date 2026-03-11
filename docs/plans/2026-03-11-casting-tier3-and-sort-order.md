# Plan: Move Best Casting to Tier 3 & Sort Predictions by Tier/Points

**Date**: 2026-03-11
**Scope**: Defaults, seed data, and prediction display order

## Goal

1. Move "Best Casting" from Tier 4 (15 pts) to Tier 3 (30 pts) in the default tier definitions
2. Sort the "Make Your Predictions" page by tier (Tier 1 first), then descending by point value within each tier
3. **Do NOT affect existing override points** — only change the defaults and display order; any pool that has already customized scoring keeps its overrides

## Current State

**Tier 3 — Design & Sound (30 pts / 18 runner-up)**:
- Best Costume Design, Best Production Design, Best Makeup and Hairstyling, Best Original Song, Best Sound

**Tier 4 — Shorts, Docs & Score (15 pts / 9 runner-up)**:
- Best Animated Short, Best Live Action Short, Best Documentary Short, Best Documentary Feature, Best International Feature, Best International Feature Film, Best Original Score, **Best Casting**

**Current displayOrder** (ceremony2026 seed): Categories numbered 1–24, roughly in a mixed order (not strictly by tier).

**Predictions page**: Sorted by `displayOrder ASC` from the database.

## Changes

### Step 1: Update `src/lib/scoring/defaults.ts`

- Move `"Best Casting"` from Tier 4 `categories` array to Tier 3 `categories` array
- Change `"Best Casting"` entry in `CATEGORY_POINT_DEFAULTS` from `pointValue: 15` to `pointValue: 30`
- Update Tier 3 label from `"Tier 3 - Design & Sound"` to `"Tier 3 - Design, Sound & Casting"` (or similar)

### Step 2: Update `prisma/seed.ts` — Best Casting point value & displayOrder

- Change Best Casting `pointValue` from `15` to `30` in ceremony2026 seed data
- Reassign `displayOrder` values for **all** ceremony2026 categories to follow tier-then-points-descending order:

**New displayOrder assignment (Tier 1 → Tier 4, descending points within each tier):**

| displayOrder | Category | Tier | Points |
|---|---|---|---|
| 1 | Best Picture | 1 | 180 |
| 2 | Best Director | 1 | 180 |
| 3 | Best Actor | 1 | 180 |
| 4 | Best Actress | 1 | 180 |
| 5 | Best Supporting Actor | 1 | 180 |
| 6 | Best Supporting Actress | 1 | 180 |
| 7 | Best Film Editing | 2 | 90 |
| 8 | Best Cinematography | 2 | 90 |
| 9 | Best Visual Effects | 2 | 90 |
| 10 | Best Original Screenplay | 2 | 90 |
| 11 | Best Adapted Screenplay | 2 | 90 |
| 12 | Best Animated Feature | 2 | 90 |
| 13 | Best Costume Design | 3 | 30 |
| 14 | Best Production Design | 3 | 30 |
| 15 | Best Makeup and Hairstyling | 3 | 30 |
| 16 | Best Original Song | 3 | 30 |
| 17 | Best Sound | 3 | 30 |
| 18 | Best Casting | 3 | 30 |
| 19 | Best Animated Short | 4 | 15 |
| 20 | Best Live Action Short | 4 | 15 |
| 21 | Best Documentary Short | 4 | 15 |
| 22 | Best Documentary Feature | 4 | 15 |
| 23 | Best International Feature | 4 | 15 |
| 24 | Best Original Score | 4 | 15 |

(Within each tier, all categories have equal points, so the internal order is kept logical/alphabetical-ish rather than needing a strict descending sort.)

### Step 3: Update ceremony2025 seed displayOrder (if needed)

The 2025 ceremony has no "Best Casting" category, but its displayOrder values should also follow the tier-based ordering for consistency. Review and update if currently out of order.

### Step 4: Update docs

- Update `docs/SCHEMA.md` tier table to reflect Best Casting in Tier 3
- Update any doc references to Tier 4 that mention Best Casting

## What This Does NOT Change

- **Existing scoring overrides in the database** — pools that already customized points keep their values. The `CATEGORY_POINT_DEFAULTS` and seed data only affect new ceremonies/revert-to-defaults.
- **The `revertScoringToDefaults` action** — this will now revert Best Casting to 30 pts (Tier 3 default) instead of 15 pts. This is correct/intended behavior.
- **The prediction form component** — no code changes needed. It already renders categories in the order provided by the server (sorted by `displayOrder ASC`). The server query already does `orderBy: { displayOrder: "asc" }`.
- **The scoring override table** — no code changes needed. `ScoringOverrideTable` groups categories by `TIER_GROUPS` which we update in Step 1, and sorts within groups by `displayOrder`.

## Files to Modify

1. `src/lib/scoring/defaults.ts` — Move Best Casting to Tier 3
2. `prisma/seed.ts` — Update displayOrder + pointValue for ceremony2026 (and ceremony2025 if needed)
3. `docs/SCHEMA.md` — Update tier documentation

## Migration

**No database migration needed.** The `displayOrder` and `pointValue` columns already exist. Running `npm run seed` will update existing seed data via `upsert`. For categories already in the DB, the seed's `update` clause will set the new `displayOrder` and `pointValue`.

**Important**: For any live/deployed ceremony data, a one-time SQL update or re-seed would be needed to apply the new displayOrder and pointValue for Best Casting. This is safe because it only changes the default point values (scoring overrides are stored separately at the pool level, not on the Category row — wait, actually `pointValue` IS on the Category row).

**Clarification needed**: The `Category.pointValue` column in the schema is the actual point value used for scoring. The seed sets it. If a pool admin has NOT overridden scoring, they rely on this value. Changing it from 15→30 in the seed and re-running seed WILL change the effective points for Best Casting in all existing pools that haven't overridden it. This is the intended behavior per the task description ("this update shouldn't affect current override points data").

## Testing

- Verify `getDefaultsForCategory("Best Casting")` returns `{ pointValue: 30, runnerUpMultiplier: 0.6 }`
- Verify `TIER_GROUPS` places Best Casting in Tier 3
- Verify seed data has correct displayOrder and pointValue
- Run `npm run test` to ensure no regressions
