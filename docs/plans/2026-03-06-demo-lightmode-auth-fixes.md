# Plan: Demo Discoverability, Light Mode, and Auth Flow Fixes

**Date:** 2026-03-06
**Status:** Complete

## Context

Three user-reported issues after v0.1.1 ship:
1. The `/demo` page exists but isn't linked from anywhere — users can't discover it
2. Demo looks broken in light mode (111 hardcoded dark-mode color classes)
3. Logged-in users hitting "Get Started" or entering an invite link get sent to sign-in unnecessarily

## Stream 1: Demo Discoverability

### 1a. Homepage — Add "Try Demo" CTA
**File:** `src/app/page.tsx`

Add a "Try Demo" button between "Get Started" and "Browse Pools" in the CTA row using `variant="secondary"`.

### 1b. Header — Show "Demo" link for unauthenticated users
**File:** `src/components/ui/Header.tsx`

Add before the "Pools" link, visible only when `!session?.user`.

### 1c. Pools page — Demo link in empty state
**File:** `src/app/pools/page.tsx`

After the "Create Your First Pool" button, add "or try the demo to see how it works".

## Stream 2: Demo Light Mode Fix

**Approach:** Replace hardcoded gray classes with semantic tokens. Gold/green/yellow/red accent colors stay unchanged.

### Mapping table

| Hardcoded | Semantic |
|-----------|----------|
| `bg-gray-950*` | `bg-background*` |
| `bg-gray-900*` | `bg-card*` |
| `border-gray-800`, `border-gray-700` | `border-border` |
| `text-gray-100`, `text-gray-200` | `text-foreground` |
| `text-gray-300` | `text-foreground/80` |
| `text-gray-400`, `text-gray-500` | `text-muted-foreground` |
| `text-gray-600` | `text-muted-foreground/60` |
| `text-gray-700` | `text-muted-foreground/40` |
| `bg-gray-800` | `bg-muted` |
| `hover:bg-gray-800` | `hover:bg-muted` |
| `bg-gold-500 text-gray-950` | `bg-primary text-primary-foreground` |
| `from-gray-900 to-gray-950` | `from-card to-background` |

### Files (5 files, ~111 replacements)
- `src/app/demo/page.tsx` (~11)
- `src/components/demo/PredictionForm.tsx` (~23)
- `src/components/demo/ResultsReveal.tsx` (~28)
- `src/components/demo/Leaderboard.tsx` (~38)
- `src/components/demo/EnvelopeTransition.tsx` (~11)

## Stream 3: Auth Flow Fixes

### 3a. Middleware — redirect signed-in users away from signin
**File:** `src/middleware.ts` — cookie-based redirect with `!has("error")` loop guard.

### 3b. Sign-in page — honor callbackUrl
**File:** `src/app/auth/signin/page.tsx` — `useSearchParams` + `Suspense`, validate relative URLs only.

### 3c. Sign-in layout — server-side redirect backup
**File:** `src/app/auth/signin/layout.tsx` — `auth()` check, redirect if session exists.

### 3d. Homepage — session-aware CTA
**File:** `src/app/page.tsx` — async + `auth()`, show "My Pools" if logged in.
