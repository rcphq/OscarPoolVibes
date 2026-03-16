# Feature Implementation Plan — Post-Ceremony Carousel Updates

**Overall Progress:** `100%`

## TLDR
Post-ceremony carousel update: categories with a winner selected show "And the winners are…" with a gold shimmer on the winning nominee. Categories without a winner keep "And the nominees are…" unchanged. The 2027 ceremony row was manually inserted into the DB (not part of this plan).

## Critical Decisions
- **No new DB query needed** — `getCategoriesWithNominees` already returns `winnerId`. Just stop stripping it in `page.tsx`.
- **Per-slide conditional heading** — heading switches based on `current.winnerId` at render time, not fetched separately.
- **Animation target is the winning nominee row** — not the whole card. A gold shimmer sweep + `★` inline badge on just that `<li>`.
- **Existing CSS reused** — `animate-shimmer` + `animate-glow-pulse` already in `globals.css`, `prefers-reduced-motion` already handled.

---

## Tasks

- [x] 🟩 **Step 1: Pass `winnerId` through in `page.tsx`**
  - [x] 🟩 In the `.map()` that builds `carouselCategories`, include `winnerId: cat.winnerId`

- [x] 🟩 **Step 2: Update `NomineesCarousel` types + heading**
  - [x] 🟩 Add `winnerId: string | null` to `CarouselCategory` type
  - [x] 🟩 Change static eyebrow label to conditional: `current.winnerId ? "And the winners are…" : "And the nominees are…"`

- [x] 🟩 **Step 3: Highlight winning nominee with animation**
  - [x] 🟩 In the nominee `<li>` loop, check `nominee.id === current.winnerId`
  - [x] 🟩 Winner row gets: gold text (`text-gold-400`), `animate-shimmer` + `animate-glow-pulse` classes, a `★` prefix badge
  - [x] 🟩 Non-winner rows unchanged

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/page.tsx` | Include `winnerId` in carousel map |
| `src/components/home/nominees-carousel.tsx` | Conditional heading + winner nominee styling |
