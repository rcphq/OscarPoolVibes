# Feature Implementation Plan — Nominees Carousel

**Overall Progress:** `100%`

## TLDR
Add a lightweight, animated "And the nominees are..." carousel to the home page hero. It auto-scrolls through Oscar categories and their nominees, pauses on interaction, and lets users manually move forward/back — purely client-side with no new API routes.

## Critical Decisions

- **No external carousel library** — plain `useState` + `useEffect` with CSS transitions keeps bundle size near-zero and gives full control over timing and a11y.
- **Server fetch, client display** — categories with nominees are fetched in the existing server component (`page.tsx`) via the existing `getCategoriesWithNominees` db helper, then passed as a prop to the new client component.
- **Placement** — carousel sits between the countdown and the CTA buttons, inside the existing hero card, replacing dead whitespace.
- **Auto-advance interval** — 5 seconds per category; pauses while user hovers or after any manual interaction, resumes after 3 seconds idle.
- **Respects `prefers-reduced-motion`** — when set, transitions are instant (no sliding animation), but auto-advance still works normally.
- **No nominee images** — only `name` and optional `subtitle` shown, keeping layout stable and no broken-image risk.

## Tasks

- [x] 🟩 **Step 1: Fetch nominees data in home page server component**
  - [x] 🟩 Import `getCategoriesWithNominees` from `src/lib/db/categories.ts` in `src/app/page.tsx`
  - [x] 🟩 Fetch categories+nominees for the active ceremony year (guard: only if `activeCeremony` exists)
  - [x] 🟩 Pass the result as a `categories` prop to the new carousel component

- [x] 🟩 **Step 2: Build `NomineesCarousel` client component**
  - [x] 🟩 Create `src/components/home/nominees-carousel.tsx` with `"use client"`
  - [x] 🟩 Accept `categories: { name: string; nominees: { name: string; subtitle: string | null }[] }[]` prop
  - [x] 🟩 Implement `currentIndex` state with prev/next handlers and wrapping
  - [x] 🟩 Implement `useEffect` auto-advance timer (5s interval, clearable)
  - [x] 🟩 Implement pause-on-hover via `onMouseEnter` / `onMouseLeave`; resume after 3s idle on manual interaction
  - [x] 🟩 Render "And the nominees are..." label, category name, and nominee list with CSS slide transition
  - [x] 🟩 Render prev/next buttons (Lucide `ChevronLeft` / `ChevronRight`) and dot indicators
  - [x] 🟩 Apply `motion-reduce:transition-none` to respect `prefers-reduced-motion`
  - [x] 🟩 Ensure all interactive controls are keyboard-accessible with visible focus rings and `aria-label` attributes

- [x] 🟩 **Step 3: Integrate carousel into home page**
  - [x] 🟩 Import and render `NomineesCarousel` in `src/app/page.tsx` between the countdown block and the CTA buttons
  - [x] 🟩 Conditionally render only when `categories.length > 0`
  - [x] 🟩 Verify visual fit within the existing `bg-black/40 border border-gold-500/20` hero card — no layout shifts

- [x] 🟩 **Step 4: Polish and verify**
  - [x] 🟩 Test auto-advance, pause-on-hover, manual prev/next, and keyboard nav in browser
  - [x] 🟩 Verify `prefers-reduced-motion` behavior (instant transitions, no jank)
  - [x] 🟩 Confirm no TypeScript errors (`npm run build`)
  - [x] 🟩 Confirm no hardcoded color classes — use semantic tokens (`text-foreground`, `text-muted-foreground`, `text-gold-400`, etc.)
