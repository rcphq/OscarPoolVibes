# Design System — OscarPoolVibes

**Date**: 2026-03-05
**Status**: Approved
**Approach**: "Black Tie" — Gold + Deep Navy, elegant ceremony aesthetic

---

## Design Principles

1. **Minimalist luxury** — Generous whitespace, restrained accents. Gold communicates premium through scarcity, not saturation.
2. **Dark-mode first** — The Oscar night experience is the hero. Light mode is a well-designed alternative.
3. **Accessible by default** — WCAG 2.1 AA. Color is never the sole indicator. 4.5:1 text contrast, 3:1 UI components.
4. **Equal-weight responsive** — Desktop and mobile are equally polished. No "mobile-first then fix desktop" or vice versa.
5. **Functional beauty** — Stunning where it matters (winner reveals, leaderboard podium), invisible everywhere else.

---

## Component Library

**shadcn/ui** (Radix UI + Tailwind CSS)

- Copy-paste components we own and customize
- Built on Radix primitives — accessible by default (keyboard, screen reader, focus management)
- Tailwind-based — consistent with our styling approach (ADR-7)
- No runtime overhead, tree-shakeable

---

## Color System

### Gold Scale

| Token | Hex | Usage |
|-------|-----|-------|
| `gold-50` | `#FBF7EE` | Subtle gold tint backgrounds (light mode cards) |
| `gold-100` | `#F5ECCC` | Light gold backgrounds |
| `gold-200` | `#E8D48B` | Hover/highlight on dark surfaces — 11:1 on bg-primary |
| `gold-300` | `#D4AF37` | Decorative: borders, dividers, icons (non-text) |
| `gold-400` | `#C9A84C` | Primary accent: buttons, links, headings on dark — 7:1 on bg-primary |
| `gold-500` | `#B8942E` | Pressed/active states |
| `gold-600` | `#8B7021` | Text-safe gold on light backgrounds — 5:1 on white |
| `gold-700` | `#7A6320` | Deeper text gold for light mode — 5.8:1 on white |
| `gold-800` | `#5C4A18` | Dark gold for high-contrast needs |
| `gold-900` | `#3D3110` | Darkest gold |

### Navy

| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#0C1445` | Featured sections: hero, category headers, leaderboard podium |
| `navy-light` | `#1B2050` | Navy hover/active states |
| `navy-tint` | `#E8EAF6` | Light-mode featured section backgrounds |

### Dark Theme Neutrals

| Token | Hex | Usage | Contrast vs text-primary |
|-------|-----|-------|--------------------------|
| `bg-primary` | `#0F0F0F` | Page background | 15.2:1 |
| `bg-surface` | `#1A1A1A` | Cards, panels | 14.7:1 |
| `bg-elevated` | `#242424` | Hover states, nested cards | 12.4:1 |
| `bg-hover` | `#2E2E2E` | Active/hover feedback | 10.5:1 |
| `border-subtle` | `#3A3A3A` | Dividers, card borders | — |
| `border-accent` | `rgba(212,175,55,0.3)` | Gold-tinted borders | — |
| `text-primary` | `#F5F0E8` | Body text (warm white) | — |
| `text-secondary` | `#B0A899` | Labels, captions | 6.5:1 vs bg-primary |
| `text-tertiary` | `#7A7268` | Placeholder, disabled | 4.5:1 vs bg-primary |

### Light Theme Neutrals

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#FAFAF7` | Page background (warm white) |
| `bg-surface` | `#F5F2ED` | Cards, panels |
| `bg-elevated` | `#FFFFFF` | Hover, popovers |
| `bg-hover` | `#EDEAE4` | Active/hover feedback |
| `border-subtle` | `#D5D0C8` | Card borders |
| `text-primary` | `#1C1917` | Body text — 17.8:1 on bg |
| `text-secondary` | `#57524B` | Labels — 6.5:1 on bg |
| `text-tertiary` | `#78726A` | Muted — 4.5:1 on bg |

### Semantic Colors

| Role | Dark | Light | Usage |
|------|------|-------|-------|
| Success | `#7BC67E` | `#2E7D32` | Correct predictions (+ checkmark icon) |
| Error | `#EF9A9A` | `#C62828` | Wrong predictions, form errors (+ X icon) |
| Warning | `#FFD54F` | `#E65100` | Lock countdown, expiring invites |
| Info | `#90CAF9` | `#1565C0` | Tips, neutral info |

**Rule**: Color is never the sole indicator. All states pair color with icons or text labels.

---

## Typography

### Font Pairing

- **Display / Headings**: Playfair Display (Google Fonts) — Didone serif, high-contrast strokes, classic Oscar elegance
- **Body / UI**: Inter (Google Fonts) — Geometric sans-serif, optimized for screen readability

### Scale

| Token | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| `display` | 48px / 3rem | 700 | Playfair | Hero headings |
| `h1` | 36px / 2.25rem | 700 | Playfair | Page titles |
| `h2` | 28px / 1.75rem | 700 | Playfair | Section headings |
| `h3` | 20px / 1.25rem | 600 | Playfair | Card/subsection headings |
| `body` | 15px / 0.9375rem | 400 | Inter | Default body text |
| `body-sm` | 13px / 0.8125rem | 400 | Inter | Secondary text, captions |
| `label` | 12px / 0.75rem | 600 | Inter | Uppercase labels, badges |
| `code` | 14px / 0.875rem | 400 | Mono | Code, invite codes |

### Heading Style

- Headings use Playfair Display with `-0.02em` letter-spacing
- Uppercase labels use Inter with `0.08em` letter-spacing (tracked out for luxury feel)
- Gold headings: Use `gold-400` on dark, `gold-600` on light (both pass large text 3:1)

---

## Spacing & Layout

### Spacing Scale (Tailwind-compatible)

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight gaps (icon-to-text) |
| `sm` | 8px | Compact elements |
| `md` | 16px | Standard padding |
| `lg` | 24px | Card padding, section gaps |
| `xl` | 32px | Between sections |
| `2xl` | 48px | Major section spacing |
| `3xl` | 64px | Page-level spacing |

### Layout Rules

- **Max content width**: 1100px (centered)
- **Card border-radius**: 12px
- **Button border-radius**: 8px
- **Badge/chip border-radius**: 100px (pill)
- **Touch targets**: Minimum 44x44px on all interactive elements
- **Card grid**: `auto-fill, minmax(320px, 1fr)` for responsive card layouts

---

## Component Patterns

### Cards

- **Default**: `bg-surface` with `border-subtle`, 12px radius, 24px padding
- **Hover**: Border transitions to `border-accent`, subtle gold-tinted box-shadow
- **Winner/Featured**: Gold border (`gold-decorative`), gold gradient tint background
- **Navy featured**: Navy gradient background for hero/section headers

### Buttons

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| Primary | `gold-400` | `#1A1A1A` | none | Main actions (Create Pool, Submit) |
| Secondary | transparent | `gold-400` | `gold-decorative` | Secondary actions (Share, Join) |
| Ghost | transparent | `text-primary` | `border-subtle` | Tertiary actions (Cancel, Back) |

- Hover: Primary lightens to `gold-200`, secondary gets gold tint background
- Focus: See global focus ring spec below
- Disabled: 50% opacity, no pointer events

### Focus Ring (Global)

All interactive elements share the same focus indicator for consistency:

- **Dark theme**: `outline: 2px solid #C9A84C` (gold-400), `outline-offset: 2px`
- **Light theme**: `outline: 2px solid #8B7021` (gold-600), `outline-offset: 2px`
- **Applied to**: buttons, links, inputs, cards (when clickable), toggles, dropdowns
- **`:focus-visible` only** — no focus ring on mouse clicks, only keyboard navigation
- **Tailwind**: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 dark:focus-visible:outline-gold-400`

### Status Indicators

- **Winner badge**: Pill shape, gold background, dark text, star icon
- **Correct pick**: Green chip with checkmark icon + "Correct" text
- **Incorrect pick**: Dimmed (50% opacity) with X icon
- **Warning**: Amber chip with warning icon + text
- **Points badge**: Gold-tinted pill showing point value

### Navigation

- Top nav bar with brand left, links center, avatar right
- Brand: "Oscar" in gold (Playfair), "PoolVibes" in text-primary (Playfair)
- Active link: `gold-400` color
- Hover: transition to `gold-400`
- Border-bottom divider on `border-subtle`

### Forms

- Input fields: `bg-elevated` background, `border-subtle` border, 8px radius
- Focus: border transitions to `gold-400`
- Labels: `text-secondary`, 13px, 500 weight
- Placeholder: `text-tertiary`
- Error state: border `error` color, error message below in `error` color with X icon
- Select/dropdown: Same styling as input. Dropdown panel uses `bg-elevated`, `border-subtle`. Option hover: `bg-hover`. Selected: gold-400 checkmark.

### Dialogs & Modals

- **Overlay**: `rgba(0,0,0,0.6)` (dark) / `rgba(0,0,0,0.4)` (light)
- **Dialog surface**: `bg-surface` with `border-subtle`, 16px radius, 32px padding
- **Max-width**: 480px (small forms), 640px (conflict resolution, complex content)
- **Animation**: Fade in overlay 150ms, scale dialog from 95% to 100% in 150ms
- **Focus**: Trap focus inside dialog. Restore focus to trigger on close.
- **Destructive actions**: Red confirm button (error color) with "Type pool name to confirm" pattern
- **Built on**: shadcn/ui Dialog (Radix) with custom theme tokens

### Toast Notifications

- **Position**: Bottom-right (desktop), bottom-center (mobile)
- **Max-width**: 400px
- **Variants**: success (green + checkmark), error (red + X), warning (amber + warning icon), info (blue + info icon)
- **Auto-dismiss**: 5s default. Errors persist until manually dismissed.
- **Stacking**: Max 3 visible, newer on top. Older toasts fade out.
- **Animation**: Slide in from bottom, 200ms ease-out. Fade out on dismiss.
- **Reduced motion**: Instant appear/disappear, no slide.

### Empty States

- **Layout**: Centered in content area. Icon (48px, text-tertiary) + headline (h3) + description (text-secondary) + primary CTA button.
- **Examples**: "No pools yet" → Create Pool button. "No predictions made" → Start Picking button. "No results yet" → "Winners will appear here during the ceremony."
- **Tone**: Encouraging, not apologetic. Guide the user toward the next action.

### Skeleton Loaders

- **Surface**: `bg-elevated` base with a shimmer gradient sweep (left to right, `bg-hover` → `bg-elevated`)
- **Pulse timing**: 1.5s ease-in-out infinite
- **Shapes**: Match the content they replace — card rectangles, text lines (varying widths), avatar circles
- **Duration**: Show skeleton if content takes >200ms to load

---

## Animation & Motion

### General

- **Transitions**: 150-200ms ease for hover/focus states
- **Page transitions**: Minimal — no route transition animations (keep it fast)
- **Loading**: Skeleton loaders matching card/content shapes, subtle pulse animation

### Winner Reveal (the "ceremony moment")

- **Gold shimmer**: 1-2 second gold glow effect on the winner card border
- **Correct pick confetti**: Brief (1s) subtle gold particles from the card
- **Score update**: Number counter animation (old score → new score)
- **Duration**: All celebration effects complete within 2 seconds max
- **Reduced motion**: Respect `prefers-reduced-motion` — instant state change, no animation

---

## Theme Implementation

### Dark Mode (Default)

- `<html data-theme="dark">` by default
- Warm dark surfaces (`#0F0F0F` base, not pure black — avoids halation)
- Gold naturally shines against dark backgrounds
- Navy sections create depth hierarchy

### Light Mode

- Toggle via UI button or system preference
- Warm whites (`#FAFAF7`) not pure white
- Gold darkened to `#8B7021` for text, `#C9A84C` for decorative only
- Navy replaced with light tint (`#E8EAF6`)

### System Preference

- On first visit: respect `prefers-color-scheme`
- Store user preference in localStorage
- Toggle available in nav

---

## Responsive Strategy

### Breakpoints (Tailwind defaults)

| Breakpoint | Width | Context |
|-----------|-------|---------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Laptops |
| `xl` | 1280px | Desktops |

### Key Responsive Behaviors

- **Card grids**: 1 column on mobile, 2+ on tablet, 3 on desktop
- **Leaderboard**: Full table on desktop, stacked cards on mobile
- **Prediction form**: Full width on mobile, centered max-width on desktop
- **Navigation**: Horizontal links on desktop, hamburger/drawer on mobile
- **Hero**: Reduced padding on mobile, smaller heading size

---

## Iconography

- **Library**: Lucide React (open source, consistent stroke style, tree-shakeable)
- **Style**: 1.5px stroke, matching the clean/minimal aesthetic
- **Size**: 16px inline with text, 20px for buttons, 24px standalone
- **Color**: Inherits text color via `currentColor`
- **Semantic icons**: Always paired with text labels (accessibility)

---

## Font Loading Strategy

- **Self-host via `next/font`** — no external Google Fonts requests (better performance, privacy)
- **`font-display: swap`** — prevents flash of invisible text
- **Subset**: Latin only (unless international support is needed)
- **Fallback stacks**:
  - Display: `'Playfair Display', Georgia, 'Times New Roman', serif`
  - Body: `'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif`

---

## Implementation Notes

### shadcn/ui Integration

shadcn/ui uses its own CSS variable system (`--background`, `--foreground`, `--primary`, etc.). Map to our tokens:

| shadcn variable | OscarPoolVibes token |
|-----------------|---------------------|
| `--background` | `bg-primary` |
| `--foreground` | `text-primary` |
| `--card` | `bg-surface` |
| `--primary` | `gold-400` (dark) / `gold-600` (light) |
| `--primary-foreground` | `#1A1A1A` (dark) / `#FFFFFF` (light) |
| `--muted` | `bg-elevated` |
| `--muted-foreground` | `text-secondary` |
| `--accent` | `navy` |
| `--destructive` | `error` |
| `--border` | `border-subtle` |
| `--ring` | `gold-400` (dark) / `gold-600` (light) |

### Contrast Verification Required

All stated contrast ratios are estimates. Before implementation, verify every text-on-background combination using WebAIM's contrast checker or a script. Priority verifications:

- `gold-600 (#8B7021)` on `#FFFFFF` — claimed 5:1, may be closer to 4:1. If fails, darken to `gold-700 (#7A6320)`.
- `text-tertiary (#7A7268)` on `bg-primary (#0F0F0F)` — claimed 4.5:1, borderline. If fails, lighten slightly.

---

## Preview

See `docs/design-preview.html` for a live interactive preview of the dark and light themes, including nav, hero, pool cards, prediction form, results state, leaderboard, form inputs, status indicators, and the full color palette.
