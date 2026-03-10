/**
 * Scoring Defaults — canonical point values for each Oscar category tier.
 *
 * These are the out-of-the-box point values used when a ceremony is created.
 * Admins and Results Managers can override these per-ceremony; "Revert to
 * Defaults" resets a category back to the values defined here.
 *
 * Tier structure:
 *   Tier 1 (180 / 0.6×): Major acting & directing categories
 *   Tier 2 (90  / 0.6×): Craft, screenplay, and animated feature
 *   Tier 3 (30  / 0.6×): Design, sound, and song categories
 *   Tier 4 (15  / 0.6×): Shorts, documentaries, international, and score
 */

export type CategoryDefaults = {
  pointValue: number;
  /** Fractional multiplier applied to pointValue for a runner-up hit */
  runnerUpMultiplier: number;
};

/** Fallback used when a category name is not found in CATEGORY_POINT_DEFAULTS */
export const TIER_4_DEFAULTS: CategoryDefaults = {
  pointValue: 15,
  runnerUpMultiplier: 0.6,
};

/**
 * Map of official Academy Award category names → default scoring values.
 * Keys are the canonical display names stored in Category.name.
 */
export const CATEGORY_POINT_DEFAULTS: Record<string, CategoryDefaults> = {
  // ── Tier 1 — 180 pts (runner-up: 108 pts) ──────────────────────────────
  "Best Picture":            { pointValue: 180, runnerUpMultiplier: 0.6 },
  "Best Director":           { pointValue: 180, runnerUpMultiplier: 0.6 },
  "Best Actor":              { pointValue: 180, runnerUpMultiplier: 0.6 },
  "Best Actress":            { pointValue: 180, runnerUpMultiplier: 0.6 },
  "Best Supporting Actor":   { pointValue: 180, runnerUpMultiplier: 0.6 },
  "Best Supporting Actress": { pointValue: 180, runnerUpMultiplier: 0.6 },

  // ── Tier 2 — 90 pts (runner-up: 54 pts) ───────────────────────────────
  "Best Film Editing":         { pointValue: 90, runnerUpMultiplier: 0.6 },
  "Best Cinematography":       { pointValue: 90, runnerUpMultiplier: 0.6 },
  "Best Visual Effects":       { pointValue: 90, runnerUpMultiplier: 0.6 },
  "Best Original Screenplay":  { pointValue: 90, runnerUpMultiplier: 0.6 },
  "Best Adapted Screenplay":   { pointValue: 90, runnerUpMultiplier: 0.6 },
  "Best Animated Feature":     { pointValue: 90, runnerUpMultiplier: 0.6 },

  // ── Tier 3 — 30 pts (runner-up: 18 pts) ───────────────────────────────
  "Best Costume Design":       { pointValue: 30, runnerUpMultiplier: 0.6 },
  "Best Production Design":    { pointValue: 30, runnerUpMultiplier: 0.6 },
  "Best Makeup and Hairstyling": { pointValue: 30, runnerUpMultiplier: 0.6 },
  "Best Original Song":        { pointValue: 30, runnerUpMultiplier: 0.6 },
  "Best Sound":                { pointValue: 30, runnerUpMultiplier: 0.6 },

  // ── Tier 4 — 15 pts (runner-up: 9 pts) ────────────────────────────────
  "Best Animated Short":      { pointValue: 15, runnerUpMultiplier: 0.6 },
  "Best Live Action Short":   { pointValue: 15, runnerUpMultiplier: 0.6 },
  "Best Documentary Short":   { pointValue: 15, runnerUpMultiplier: 0.6 },
  "Best Documentary Feature": { pointValue: 15, runnerUpMultiplier: 0.6 },
  "Best International Feature": { pointValue: 15, runnerUpMultiplier: 0.6 },
  "Best Original Score":      { pointValue: 15, runnerUpMultiplier: 0.6 },
  // 2026+ ceremony: Best Casting added as a new category
  "Best Casting":             { pointValue: 15, runnerUpMultiplier: 0.6 },
};

/**
 * Look up default scoring for a category by name.
 * Falls back to Tier 4 defaults if the name is not in the map — this ensures
 * graceful handling if category names vary slightly between ceremony years.
 */
export function getDefaultsForCategory(categoryName: string): CategoryDefaults {
  return CATEGORY_POINT_DEFAULTS[categoryName] ?? TIER_4_DEFAULTS;
}

// ── Tier groups — used by the UI to render tier section headers ──────────────

export type TierGroup = {
  /** Display label for the tier header row */
  tierLabel: string;
  /** Default point value for this tier */
  defaultPointValue: number;
  /** Default runner-up multiplier for this tier */
  defaultRunnerUpMultiplier: number;
  /** Canonical category names that belong to this tier */
  categories: string[];
};

/**
 * Ordered list of tier groups. The UI renders categories in this order,
 * grouped under a section header that shows the tier's default values.
 */
export const TIER_GROUPS: TierGroup[] = [
  {
    tierLabel: "Tier 1 — Major Awards",
    defaultPointValue: 180,
    defaultRunnerUpMultiplier: 0.6,
    categories: [
      "Best Picture",
      "Best Director",
      "Best Actor",
      "Best Actress",
      "Best Supporting Actor",
      "Best Supporting Actress",
    ],
  },
  {
    tierLabel: "Tier 2 — Craft & Animated Feature",
    defaultPointValue: 90,
    defaultRunnerUpMultiplier: 0.6,
    categories: [
      "Best Film Editing",
      "Best Cinematography",
      "Best Visual Effects",
      "Best Original Screenplay",
      "Best Adapted Screenplay",
      "Best Animated Feature",
    ],
  },
  {
    tierLabel: "Tier 3 — Design & Sound",
    defaultPointValue: 30,
    defaultRunnerUpMultiplier: 0.6,
    categories: [
      "Best Costume Design",
      "Best Production Design",
      "Best Makeup and Hairstyling",
      "Best Original Song",
      "Best Sound",
    ],
  },
  {
    tierLabel: "Tier 4 — Shorts, Docs & Score",
    defaultPointValue: 15,
    defaultRunnerUpMultiplier: 0.6,
    categories: [
      "Best Animated Short",
      "Best Live Action Short",
      "Best Documentary Short",
      "Best Documentary Feature",
      "Best International Feature",
      "Best Original Score",
      // 2026+ only; gracefully absent from earlier ceremonies
      "Best Casting",
    ],
  },
];
