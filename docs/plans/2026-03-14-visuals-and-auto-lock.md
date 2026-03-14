# Implementation Plan for Visual Upgrades and Auto-Lock

This plan outlines the changes to improve the aesthetics of the home and leaderboard pages and implements the logic to automatically lock prediction changes 1 hour before the ceremony.

## Goal Description
1. Revamp the Home Page (`/`) and Leaderboard Page (`/pools/[id]/leaderboard`) with a more cinematic, visually engaging design (e.g., dynamic gradients, elegant borders, and a countdown timer for active ceremonies) to handle expected traffic spikes gracefully.
2. Implement an auto-locking feature so users cannot edit their picks within 1 hour of the ceremony start time, while preserving the existing manual lock (`predictionsLocked`).

## Proposed Changes

### Core Logic: Auto-Locking Predictions

#### [DONE] `src/app/pools/[id]/predict/actions.ts`
- Fetches `ceremonyDate` alongside `predictionsLocked`.
- Returns error if `now >= ceremonyDate - 1 hour`.

#### [DONE] `src/app/admin/ceremony-management.tsx`
- Create Ceremony form uses `<Input type="datetime-local" />`.
- `CeremonyYearCard` displays full date + time (including timezone).
- Inline "Edit Date" form lets admins update `ceremonyDate` on existing ceremonies via `updateCeremonyDate` server action.

#### [DONE] `src/app/admin/actions.ts`
- Added `updateCeremonyDate(ceremonyYearId, ceremonyDate)` server action.

#### [DONE] `src/app/pools/[id]/predict/page.tsx`
- Reads `ceremonyDate`, computes `isLocked`, passes to `PredictionForm`.
- Shows lock banner when within 1 hour of ceremony.

---

### UI Upgrades: Cinematic & Attractive Visuals

#### [DONE] `src/app/page.tsx`
- `HeroBackground` — animated canvas particle field (gold flashbulbs).
- `Countdown` — live countdown clock shown when active ceremony has a date set.

#### [DONE] `src/app/pools/[id]/leaderboard/page.tsx`
- Post-lock view: gold-bordered wrapper with backdrop blur and glow gradient.
- Rank badges: Crown (1st), Medal (2nd/3rd) with gold/amber styling.

## User Review Required

> [!NOTE]
> ~~By switching to `datetime-local` for the ceremony date in the Admin Panel, you will need to input existing ceremony dates again if they didn't have times attached.~~
> **Resolved:** Admins can now edit the ceremony date/time inline from each `CeremonyYearCard` without recreating the ceremony.

## Verification Plan

### Automated Tests
- Assuming we have an e2e suite running Playwright (`npm run test:e2e`), run that to ensure the prediction flow logic doesn't break baseline functionality.

### Manual Verification
1. Access the Admin panel and set a `datetime-local` ceremony time that is 30 minutes in the future.
2. Visit a pool's prediction page as a user and verify the form is globally locked (since we are within the 1-hour window).
3. Test a time 2 hours in the future and verify predictions can be saved.
4. Review the Home and Leaderboard pages for cinematic visual improvements.
