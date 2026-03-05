# Plan: Add PostHog Analytics Event Tracking (v2 — post-review)

## Context

Usage analytics with named custom events across all user actions. **PostHog** chosen because:
- Free tier: 1M events/month
- First-class Next.js SDK (`posthog-js` + `posthog-node`)
- Custom named events, funnels, retention, user paths
- Cookieless mode available (no cookie banner needed)

## Key Design Decisions (from architect + senior dev review)

1. **Fire-and-forget tracking** — never await, never block user actions
2. **Env var guards** — analytics is a no-op when `NEXT_PUBLIC_POSTHOG_KEY` is missing (dev, tests, CI)
3. **Lazy-load client SDK** — `posthog-js` (~50KB gzip) loaded after hydration, not on critical path
4. **Cookieless mode** — `persistence: 'memory'` to avoid cookie banner requirement
5. **Disable autocapture** — all events are manually defined; autocapture wastes quota
6. **No duplicate tracking** — results events tracked only in API route (server-side), not client
7. **User identify in client provider** — not in Auth.js server callback (which can't access posthog-js)
8. **Middleware isolation** — NEVER import from `src/lib/analytics/` in middleware.ts or its imports
9. **Type-safe event map** — generic `trackServerEvent<K extends keyof EventMap>()` for compile-time safety
10. **globalThis singleton** — same pattern as Prisma client for posthog-node in dev

## Event Schema

All events: `category_action` naming with typed properties.

### Authentication
| Event | Trigger | Properties |
|-------|---------|------------|
| `auth_sign_in_clicked` | Click Google/email button | `{ method: "google" \| "email" }` |
| `auth_sign_in_failed` | Auth error | `{ method, error }` |

### Pool
| Event | Trigger | Properties |
|-------|---------|------------|
| `pool_created` | createPoolAction | `{ poolId, accessType, ceremonyYear }` |
| `pool_viewed` | pool detail page load | `{ poolId }` |
| `pool_joined` | joinOpenPool/joinViaInvite | `{ poolId, method: "code" \| "invite" }` |
| `pool_settings_updated` | updatePoolSettings | `{ poolId }` |
| `pool_archived` | archivePoolAction | `{ poolId }` |
| `pool_left` | leavePool | `{ poolId }` |
| `pool_invite_link_copied` | CopyInviteLink click | `{ poolId }` |

### Invite
| Event | Trigger | Properties |
|-------|---------|------------|
| `invite_sent` | sendInviteAction | `{ poolId }` |
| `invite_revoked` | revokeInviteAction | `{ poolId }` |
| `invite_link_clicked` | join page load from invite | `{ poolId, method }` |

### Prediction
| Event | Trigger | Properties |
|-------|---------|------------|
| `predictions_saved` | savePredictions | `{ poolId, categoryCount }` |

### Leaderboard
| Event | Trigger | Properties |
|-------|---------|------------|
| `leaderboard_viewed` | leaderboard page load | `{ poolId, memberCount }` |

### Results (server-side only — API route)
| Event | Trigger | Properties |
|-------|---------|------------|
| `result_set` | POST /api/results 200 | `{ ceremonyYearId, categoryId }` |
| `result_conflict` | POST /api/results 409 | `{ ceremonyYearId, categoryId }` |

### Admin
| Event | Trigger | Properties |
|-------|---------|------------|
| `admin_predictions_locked` | togglePredictionsLocked | `{ ceremonyYearId, locked }` |
| `admin_ceremony_created` | createCeremonyYear | `{ ceremonyYearId }` |
| `member_role_changed` | changeMemberRoleAction | `{ poolId, newRole }` |
| `member_removed` | removeMemberAction | `{ poolId }` |

### Page Views
Auto-tracked by PostHog pageview capture (manual via `usePathname` + `useSearchParams`).

## Implementation

### Step 1: Install + env vars
- `npm install posthog-js posthog-node`
- Env vars: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

### Step 2: Create analytics module (`src/lib/analytics/`)

**`events.ts`** — Type-safe event map:
```ts
type EventMap = {
  pool_created: { poolId: string; accessType: string; ceremonyYear: string }
  pool_joined: { poolId: string; method: "code" | "invite" }
  // ... all events
}
function trackServerEvent<K extends keyof EventMap>(userId: string, event: K, properties: EventMap[K]): void
```

**`posthog-server.ts`** — Server singleton with env guard + try/catch:
- No-op if key missing
- Fire-and-forget (no await)
- globalThis singleton pattern
- try/catch swallows errors, console.warn in dev

**`posthog-provider.tsx`** — Client provider ("use client"):
- Returns bare children if key missing
- Lazy init via useEffect (not during SSR)
- Config: `autocapture: false`, `capture_pageview: false`, `persistence: 'memory'`
- Identifies user when session exists

**`posthog-pageview.tsx`** — Client component:
- Uses `usePathname` + `useSearchParams` to capture page views on route change

### Step 3: Wire into layout
- `src/app/layout.tsx` — direct import of `"use client"` provider + pageview components (wrapped in `<Suspense>`)

### Step 4: Instrument server actions
Add `trackServerEvent()` (fire-and-forget) to:
- `src/app/pools/create/actions.ts`
- `src/app/pools/join/actions.ts`
- `src/app/pools/[id]/settings/actions.ts`
- `src/app/pools/[id]/invites/actions.ts`
- `src/app/pools/[id]/predict/actions.ts`
- `src/app/pools/[id]/leave/actions.ts`
- `src/app/admin/actions.ts`

### Step 5: Instrument client components
- `src/components/pools/CopyInviteLink.tsx` — `pool_invite_link_copied`
- `src/app/auth/signin/page.tsx` — `auth_sign_in_clicked`

### Step 6: Instrument API routes (results only — no client duplicate)
- `src/app/api/results/route.ts` — `result_set`, `result_conflict`

## Files to Create
- `src/lib/analytics/events.ts`
- `src/lib/analytics/posthog-server.ts`
- `src/lib/analytics/posthog-provider.tsx`
- `src/lib/analytics/posthog-pageview.tsx`

## Files to Modify
- `src/app/layout.tsx`
- `src/app/pools/create/actions.ts`
- `src/app/pools/join/actions.ts`
- `src/app/pools/[id]/settings/actions.ts`
- `src/app/pools/[id]/invites/actions.ts`
- `src/app/pools/[id]/predict/actions.ts`
- `src/app/pools/[id]/leave/actions.ts`
- `src/app/admin/actions.ts`
- `src/components/pools/CopyInviteLink.tsx`
- `src/app/auth/signin/page.tsx`
- `src/app/api/results/route.ts`

## Env Vars
```
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Testing
- Analytics module is auto-mocked in tests (env var guard returns no-op)
- Existing 62 tests unaffected — no PostHog network calls in test env
- Vitest setup file can also `vi.mock("@/lib/analytics/posthog-server")`

## Verification
1. `npm run build` — no errors
2. `npm run test` — all tests pass
3. `npm run dev` — PostHog Live Events shows page views
4. Create pool / join / predict — named events appear with correct properties
