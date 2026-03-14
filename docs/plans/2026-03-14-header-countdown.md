# Feature Implementation Plan — Ceremony Countdown

**Overall Progress:** `100%`

## TLDR
Show a live countdown to the next ceremony in two places: the existing full 4-box countdown on the home page hero (already exists, no changes needed), and a new compact, responsive countdown badge inside the header on all other pages. Only renders when `ceremonyDate` is set and the ceremony is in the future.

## Critical Decisions

- **Home page**: Existing `Countdown` component in the hero is already correct — no changes needed.
- **Header placement**: Compact countdown lives between the nav links and the right-side actions. Hidden on `/` (home) via `usePathname()`.
- **Data fetching**: Header is an async server component — it fetches `ceremonyDate` directly and passes it as a prop to the client child. Reuse Prisma directly in Header (same pattern as `page.tsx`).
- **Responsive format**:
  - Mobile (`< sm`): `"2d 14h"` — days + hours only, fits in tight header
  - Tablet (`sm`): `"2d 14h 32m"` — adds minutes
  - Desktop (`md+`): `"97th · 2d 14h 32m 10s"` — ceremony name prefix + seconds
- **No new DB helper**: Header already uses `prisma` client indirectly via session; add a single `prisma.ceremonyYear.findFirst` inline in `Header.tsx`, matching the pattern in `page.tsx`.

## Tasks

- [x] 🟩 **Step 1: Create `HeaderCountdown` client component**
  - [x] 🟩 Create `src/components/ui/HeaderCountdown.tsx` (`"use client"`)
  - [x] 🟩 Props: `targetDate: Date`, `ceremonyName: string`
  - [x] 🟩 Use `usePathname()` — return `null` on `/` (home page already has full countdown)
  - [x] 🟩 Reuse countdown interval logic from `src/components/home/countdown.tsx`
  - [x] 🟩 Return `null` after mount if `timeLeft` is zero (ceremony passed)
  - [x] 🟩 Responsive display using Tailwind:
    - Mobile: `<span className="sm:hidden">2d 14h</span>`
    - Tablet: `<span className="hidden sm:inline md:hidden">2d 14h 32m</span>`
    - Desktop: `<span className="hidden md:inline">97th · 2d 14h 32m 10s</span>`
  - [x] 🟩 Style: gold text (`text-gold-400`), small border pill (`border border-gold-500/30 rounded-full px-2 py-0.5 text-xs`), `tabindex="-1"` (decorative, not interactive)

- [x] 🟩 **Step 2: Update `Header` to fetch ceremony date and render countdown**
  - [x] 🟩 In `src/components/ui/Header.tsx`, add `prisma.ceremonyYear.findFirst` query (same shape as `page.tsx`: `select: { ceremonyDate: true, name: true }`, `where: { isActive: true }`)
  - [x] 🟩 Import and render `<HeaderCountdown>` inside the header `<nav>`, before the `ThemeToggle`, conditionally when `activeCeremony?.ceremonyDate` exists
  - [x] 🟩 Pass `targetDate` and `ceremonyName` props

## Verification

1. Run `npm run dev`
2. Home page (`/`): full 4-box countdown visible in hero — header countdown **not** shown
3. Any other page (e.g., `/pools`, `/demo`, `/auth/signin`): compact countdown badge visible in header
4. Resize browser — verify mobile shows `2d 14h`, tablet adds minutes, desktop shows full
5. Set `ceremonyDate: null` in DB (or set to past date) — confirm countdown disappears from header and home
6. Check `prefers-reduced-motion` — countdown still renders (it's a number display, no animation)
7. Run `npm run build` — no type errors
