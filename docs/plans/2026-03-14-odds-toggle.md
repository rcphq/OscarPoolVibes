# Plan: "Never Tell Me the Odds" Toggle

**Date**: 2026-03-14
**Scope**: Pull prediction market odds and display them inline on the predictions form. Nothing beyond fetching + showing odds.

---

## Overview

Add a toggle to the prediction form that defaults to ON ("Never Tell Me the Odds"). When users uncheck it, Polymarket and Kalshi odds appear as small labels next to each nominee in the First Choice and Runner-Up selectors.

---

## 1. Odds Data Fetching — Server-Side Route

### New file: `src/app/api/odds/route.ts`

A **Next.js API route** that fetches Oscar odds from both platforms, merges them, and returns a unified response. This keeps API keys (if ever needed) and fetch logic server-side.

**Polymarket (Gamma API)**:
- Base: `https://gamma-api.polymarket.com`
- `GET /events?tag=oscars-2026&closed=false` → returns events with nested markets
- Each market has `outcomePrices` (JSON array of probabilities for each outcome) and `outcomes` (array of outcome labels like nominee names)
- No authentication required for read-only access
- Rate limiting: be respectful, cache aggressively

**Kalshi API**:
- Base: `https://api.elections.kalshi.com/trade-api/v2`
- `GET /markets?series_ticker=KXOSCAR&status=open` → returns all open Oscar markets
- Each market has `yes_bid`, `yes_ask`, `last_price` (cents, 0-100 = probability)
- Tickers follow pattern: `KXOSCARPIC-26`, `KXOSCARACTO-26`, etc.
- No authentication required for market data

**Response shape** (our API route returns):
```ts
type OddsResponse = {
  // keyed by nominee name (normalized lowercase)
  odds: Record<string, {
    polymarket: number | null;  // 0-100 percentage
    kalshi: number | null;      // 0-100 percentage
  }>;
  fetchedAt: string; // ISO timestamp
};
```

**Matching strategy**: The tricky part is matching Polymarket/Kalshi outcome labels to our `Nominee.name` values. We'll need a fuzzy/normalized string match (lowercase, strip punctuation, handle "The" prefix). If a match isn't confident, skip that nominee — better to show no odds than wrong odds.

**Caching**: Use Next.js `revalidate` or in-memory cache with a **15-minute TTL** (`revalidate: 900`). Odds don't change second-by-second and we don't want to hammer external APIs on every page load. This guarantees maximum 4 requests per hour.

### New file: `src/lib/odds/fetch-odds.ts`

Pure functions for:
- `fetchPolymarketOdds(ceremonyTag: string): Promise<RawOdds[]>`
- `fetchKalshiOdds(seriesTicker: string): Promise<RawOdds[]>`
- `mergeOdds(poly: RawOdds[], kalshi: RawOdds[]): OddsMap`
- `normalizeNomineeName(name: string): string` — for fuzzy matching

### New file: `src/types/odds.ts`

Type definitions for the odds data structures.

---

## 2. Client-Side Fetching Hook

### New file: `src/hooks/use-odds.ts`

A custom React hook: `useOdds(ceremonyYearId: string, enabled: boolean)`

- When `enabled=false` (toggle is ON / "never tell me the odds"), does nothing
- When `enabled=true`, calls `GET /api/odds?ceremonyYearId=...` via `fetch`
- Returns `{ odds, isLoading, error }`
- Caches in component state so toggling back and forth doesn't re-fetch

---

## 3. Toggle UI in PredictionForm

### Modify: `src/components/pools/PredictionForm.tsx`

**New state**:
```ts
const [hideOdds, setHideOdds] = useState(true); // default: hide odds
```

**Toggle placement**: Between the progress indicator and the first category card. A compact, themed switch:

```
┌──────────────────────────────────────────┐
│ ○ Never tell me the odds                 │
│   [toggle switch — ON by default]        │
└──────────────────────────────────────────┘
```

- Use shadcn `Switch` component + `Label`
- When ON: odds hidden, no API call made
- When OFF: odds load (with a brief skeleton/spinner), labels appear next to nominees
- Persist preference in `localStorage` so it remembers across visits

**Props change**: Add `ceremonyYearId: string` prop to `PredictionForm` (already available in the parent page).

---

## 4. Odds Labels in Nominee Selectors

When odds are visible, show them **inline next to each nominee name** in both the `SelectItem` dropdown options AND next to the selected value in the `SelectTrigger`.

### In the dropdown (`SelectItem`):
```
┌─────────────────────────────────────────┐
│ Sinners — Ryan Coogler         P:24 K:22│
│ One Battle After Another — PT… P:76 K:78│
│ Hamnet — Chloé Zhao            P:— K:3  │
└─────────────────────────────────────────┘
```

- `P:` = Polymarket, `K:` = Kalshi, shown as small muted text
- `—` if no odds available from that source
- Color-code: higher odds get slightly brighter text (progressive opacity)

### In the selected trigger value:
Show a compact badge after the nominee name:
```
[Sinners — Ryan Coogler]  24% · 22%
```

### New component: `src/components/pools/OddsBadge.tsx`

A small inline component:
```tsx
function OddsBadge({ polymarket, kalshi }: { polymarket: number | null; kalshi: number | null }) {
  // renders: "P:24 K:22" or "P:24" or "K:22" or nothing
}
```

Uses `text-muted-foreground/60` and `text-xs` for subtlety. No hardcoded grays — semantic tokens only per CLAUDE.md.

---

## 5. Mobile & Desktop Layout Check

The current form uses `grid gap-4 sm:grid-cols-2` — two columns on desktop, stacked on mobile.

### Desktop (sm+):
```
┌─────────────────────────────────────────────────┐
│ Best Picture                          180 pts   │
├─────────────────────────────────────────────────┤
│ First Choice              │ Runner-Up           │
│ [Sinners ▾]    P:24 K:22  │ [Hamnet ▾]  P:3 K:3│
└─────────────────────────────────────────────────┘
```
- Odds badge sits to the right of or below each select trigger
- Ensure the select + badge don't overflow the grid column
- If tight, badge goes below the select on a new line

### Mobile (< sm):
```
┌───────────────────────────┐
│ Best Picture     180 pts  │
├───────────────────────────┤
│ First Choice              │
│ [Sinners — Ryan C… ▾]    │
│ P:24 · K:22              │
│                           │
│ Runner-Up                 │
│ [Hamnet — Chloé Z… ▾]    │
│ P:3 · K:3                │
└───────────────────────────┘
```
- Odds label on its own line below the select, `text-xs text-muted-foreground/60`
- Keeps select at `w-full`, no horizontal squeeze

### Dropdown items (both breakpoints):
- Nominee name left-aligned, odds right-aligned with `ml-auto`
- Use `flex justify-between` inside `SelectItem`
- Truncate long nominee names with `truncate` class, odds always visible

---

## 6. Files Changed Summary

| Action | File | What |
|--------|------|------|
| **Create** | `src/types/odds.ts` | Odds type definitions |
| **Create** | `src/lib/odds/fetch-odds.ts` | Polymarket + Kalshi fetch & merge logic |
| **Create** | `src/app/api/odds/route.ts` | API route with caching |
| **Create** | `src/hooks/use-odds.ts` | Client hook for odds fetching |
| **Create** | `src/components/pools/OddsBadge.tsx` | Inline odds display component |
| **Modify** | `src/components/pools/PredictionForm.tsx` | Add toggle, wire up odds display |
| **Modify** | `src/app/pools/[id]/predict/page.tsx` | Pass `ceremonyYearId` prop |

---

## 7. Key Decisions & Risks

1. **Nominee name matching**: Polymarket/Kalshi use their own nominee labels (e.g., "Michael B. Jordan" vs "Michael B. Jordan (Sinners)"). We need robust fuzzy matching. Plan: normalize both sides (lowercase, strip parentheticals, trim) and match on Levenshtein distance or substring containment. Unmatched nominees simply show no odds.

2. **Rate limiting / availability**: Both APIs are free and public but could rate-limit or go down. The 5-minute cache plus graceful degradation (just don't show odds) handles this. No user action is blocked if odds fail to load.

3. **No database changes**: Odds are fetched on-demand and never stored. No schema migration needed.

4. **No new dependencies**: Use native `fetch` for API calls. String normalization with built-in JS. No npm packages needed.

5. **localStorage for toggle preference**: Simple `localStorage.getItem('hideOdds')` check on mount. Falls back to `true` (hidden) if not set.

6. **Accuracy disclaimer**: We're showing prediction market prices, not "true" probabilities. Consider a small info tooltip on the toggle: "Odds from Polymarket and Kalshi prediction markets. These reflect market sentiment, not guaranteed outcomes."
