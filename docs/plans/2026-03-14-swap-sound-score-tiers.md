# Plan: Swap Best Sound and Best Original Score Tiers

**Date**: 2026-03-14
**Issue**: Best Sound is currently in Tier 3 (30 pts) and Best Original Score is in Tier 4 (15 pts). They should be swapped: Best Original Score → Tier 3 (30 pts), Best Sound → Tier 4 (15 pts).

## Current State

| Category           | Current Tier | Current Points |
|--------------------|-------------|----------------|
| Best Sound         | Tier 3      | 30             |
| Best Original Score| Tier 4      | 15             |

## Target State

| Category           | New Tier | New Points |
|--------------------|----------|------------|
| Best Sound         | Tier 4   | 15         |
| Best Original Score| Tier 3   | 30         |

## Files to Change

### 1. `src/lib/scoring/defaults.ts`
- Move `"Best Sound"` from Tier 3 section (line 53) to Tier 4 section, with `pointValue: 15`
- Move `"Best Original Score"` from Tier 4 section (line 64) to Tier 3 section, with `pointValue: 30`
- Update `TIER_GROUPS` array:
  - Remove `"Best Sound"` from Tier 3 `categories` list (line 127), add `"Best Original Score"`
  - Remove `"Best Original Score"` from Tier 4 `categories` list (line 143), add `"Best Sound"`
- Update tier label: Tier 3 → `"Tier 3 - Design, Score & Casting"`, Tier 4 → `"Tier 4 - Shorts, Docs & Sound"`
- Update file header comments to reflect the swap

### 2. `prisma/seed.ts` — 97th Academy Awards (2025)
- Best Sound (line 256): change `pointValue: 30` → `pointValue: 15`
- Best Original Score (line 334): change `pointValue: 15` → `pointValue: 30`

### 3. `prisma/seed.ts` — 98th Academy Awards (2026)
- Best Sound (line 570): change `pointValue: 30` → `pointValue: 15`
- Best Original Score (line 662): change `pointValue: 15` → `pointValue: 30`

### 4. `src/lib/demo/oscar-data.ts`
- Best Original Score (line 175): change `pointValue: 15` → `pointValue: 30`
- Best Sound (line 235): change `pointValue: 30` → `pointValue: 15`

### 5. `docs/SCHEMA.md` (lines 234-235)
- Move "Best Sound" from Tier 3 row to Tier 4 row
- Move "Best Original Score" from Tier 4 row to Tier 3 row

## Migration Note

This is a **code-only change** (defaults, seed data, demo data, docs). No Prisma schema migration or data migration is included — the point values for Best Sound and Best Original Score were already corrected manually in the live database. The code changes ensure new ceremonies, the demo, and the scoring override UI all reflect the correct tier assignments going forward.

## Testing

- Run `npm run test` to ensure no scoring tests break
- Run `npm run build` to verify no type errors
