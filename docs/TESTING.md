# Testing Strategy

Comprehensive testing plan for OscarPoolVibes. Every feature, permission, error state, and user journey must have corresponding tests.

> **Philosophy**: OscarPoolVibes peaks on Oscar night — a single evening per year. Bugs during the ceremony are catastrophic with no "try again tomorrow." Testing must be thorough enough to ship with confidence for a high-stakes, time-critical event.

---

## Test Tooling

| Tool | Purpose | Layer |
|------|---------|-------|
| **Vitest** | Unit and integration tests | Scoring, permissions, validation, API routes |
| **React Testing Library** | Component interaction tests | Forms, leaderboard, UI components |
| **Playwright** | End-to-end browser tests | Full user journeys, auth flows, multi-user scenarios |
| **axe-core** | Accessibility auditing | WCAG 2.1 AA compliance per page |
| **Lighthouse CI** | Performance and accessibility CI | Core Web Vitals, a11y score ≥ 95 |
| **MSW (Mock Service Worker)** | API mocking for integration tests | External service simulation |

---

## Coverage Targets

| Domain | Target | Rationale |
|--------|--------|-----------|
| Scoring logic | 100% branch | Incorrect scores = wrong leaderboard. No tolerance. |
| Permission checks | 100% of matrix | 5 roles × ~25 actions. Every cell tested. See `USE_CASES.md` permission matrix. |
| API routes | 100% endpoint | Happy path + validation errors + auth failures + edge cases for every route |
| Validation helpers | 100% branch | Nominee-category consistency, first ≠ runner-up, lock checks |
| Components | All interactive | Every form, dropdown, button, and user-facing interaction |
| E2E journeys | All critical paths | Sign up → predict → score for every role |
| Accessibility | Every page | Zero axe-core violations; Lighthouse ≥ 95 |

---

## Test Structure

```
__tests__/
├── unit/
│   ├── scoring/           # Scoring algorithm tests
│   ├── permissions/        # Permission check tests
│   ├── validation/         # Business rule validation tests
│   └── utils/              # Utility function tests
├── integration/
│   ├── api/                # API route handler tests
│   │   ├── results/        # Results API tests
│   │   ├── pools/          # Pool management API tests
│   │   └── predictions/    # Prediction API tests
│   ├── server-actions/     # Server action tests
│   └── db/                 # Database query tests
├── components/
│   ├── ui/                 # Generic UI component tests
│   ├── pools/              # Pool component tests
│   ├── predictions/        # Prediction form tests
│   └── leaderboard/        # Leaderboard component tests
├── e2e/
│   ├── auth.spec.ts        # Authentication flows
│   ├── pools.spec.ts       # Pool creation, joining, management
│   ├── predictions.spec.ts # Making and editing predictions
│   ├── results.spec.ts     # Results entry and conflicts
│   ├── leaderboard.spec.ts # Leaderboard viewing and scoring
│   └── invites.spec.ts     # Invite flows (open + invite-only)
└── a11y/
    └── pages.spec.ts       # axe-core audit per page
```

---

## Unit Tests

### Scoring Logic (`__tests__/unit/scoring/`)

The scoring algorithm is the heart of the app. Test every branch:

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| First choice correct | prediction.firstChoice == winner | Full `pointValue` |
| Runner-up correct (first choice wrong) | prediction.runnerUp == winner, firstChoice != winner | `pointValue * runnerUpMultiplier` |
| Neither correct | Both picks wrong | 0 points |
| Runner-up multiplier = 0.5 (default) | 10-point category, runner-up hit | 5 points |
| Runner-up multiplier = 0 (disabled) | Category with 0 multiplier | 0 points for runner-up |
| Runner-up multiplier = 1.0 (full credit) | Category with 1.0 multiplier | Full points for runner-up |
| Total score aggregation | Multiple categories, mixed hits | Sum of all category scores |
| All correct | Every first choice wins | Maximum possible score |
| All wrong | No correct picks | 0 total |
| Tie breaking | Two users with same total | Both get same rank (tied) |
| No predictions submitted | User didn't fill out all categories | 0 for missing categories |
| Winner not yet set | Category has no winner | 0 points (category skipped in scoring) |

### Permission Checks (`__tests__/unit/permissions/`)

Test every cell in the permission matrix from `docs/USE_CASES.md`:

```typescript
// Example test structure
describe('checkResultsPermission', () => {
  it('allows ADMIN to set results', async () => { ... })
  it('allows RESULTS_MANAGER to set results', async () => { ... })
  it('denies MEMBER from setting results', async () => { ... })
  it('denies user not in any pool for ceremony', async () => { ... })
  it('allows RESULTS_MANAGER in pool A to set results affecting pool B', async () => { ... })
})

describe('pool access', () => {
  it('allows anyone to join OPEN pool with code', async () => { ... })
  it('requires matching email for INVITE_ONLY pool', async () => { ... })
  it('rejects expired invite token', async () => { ... })
  it('rejects mismatched email for invite-only', async () => { ... })
})
```

### Validation Helpers (`__tests__/unit/validation/`)

| Test Case | Validation Rule | Expected |
|-----------|----------------|----------|
| Same nominee for both picks | firstChoiceId == runnerUpId | Reject |
| Nominee from wrong category | nominee.categoryId != prediction.categoryId | Reject |
| Valid prediction | Different nominees, correct category | Accept |
| Predictions locked | ceremonyYear.predictionsLocked == true | Reject save |
| Predictions open | ceremonyYear.predictionsLocked == false | Accept save |
| Pool full | pool.memberCount >= pool.maxMembers | Reject join |
| Pool not full | pool.memberCount < pool.maxMembers | Accept join |

---

## Integration Tests

### API Route Tests (`__tests__/integration/api/`)

Each API route tested for:
1. **Happy path**: Valid request returns expected response
2. **Authentication**: Unauthenticated request returns 401
3. **Authorization**: Wrong role returns 403
4. **Validation**: Invalid input returns 400 with descriptive error
5. **Not found**: Invalid resource ID returns 404
6. **Edge cases**: Concurrent requests, empty datasets, boundary values

#### Results API (`POST /api/results`)

| Test Case | Setup | Expected |
|-----------|-------|----------|
| Set winner successfully | Valid permission, valid nominee, correct version | 200, winner set |
| Version conflict | Two concurrent updates | First succeeds, second gets 409 with conflict details |
| Wrong nominee category | winnerId from different category | 400 error |
| No permission | User with MEMBER role only | 403 error |
| Invalid ceremony | Non-existent ceremonyYearId | 404 error |

#### Permissions API (`POST /api/pools/[poolId]/permissions`)

| Test Case | Setup | Expected |
|-----------|-------|----------|
| Grant RESULTS_MANAGER | Admin grants to member | 200, role updated |
| Revoke RESULTS_MANAGER | Admin revokes from results manager | 200, role reverted to MEMBER |
| Non-admin tries to grant | MEMBER tries to grant | 403 error |
| Grant to non-member | Admin grants to user not in pool | 400 error |
| Self-grant | Member tries to promote themselves | 403 error |

### Database Tests

Use a test database with transaction rollback for isolation:

```typescript
// Pattern: wrap each test in a transaction, roll back after
beforeEach(async () => {
  await prisma.$executeRaw`BEGIN`
})
afterEach(async () => {
  await prisma.$executeRaw`ROLLBACK`
})
```

---

## E2E Tests (Playwright)

### Critical User Journeys

#### Journey 1: New User Complete Flow
```
1. Visit landing page (/)
2. Click "Sign in with Google"
3. Complete OAuth flow
4. See empty pools page
5. Create a new pool (name, ceremony year, open access)
6. Copy invite link
7. Navigate to predictions page
8. Fill out all categories (first choice + runner-up)
9. Submit predictions
10. View prediction summary
11. Verify predictions are saved across page reload
```

#### Journey 2: Invite Flow (Open Pool)
```
1. User B receives invite link for open pool
2. Click link → redirected to sign in
3. Sign in with Google
4. Auto-joined to pool after sign-in
5. See pool detail page with member list
6. Navigate to predictions
```

#### Journey 3: Invite Flow (Invite-Only Pool)
```
1. Admin creates invite-only pool
2. Admin sends invite to user@example.com
3. User receives email with unique token link
4. User clicks link → redirected to sign in
5. User signs in with user@example.com
6. Token validated, user joined to pool
7. User signs in with different@email.com → rejected with message
```

#### Journey 4: Results Entry with Conflict
```
1. Admin A opens results entry page
2. Admin B opens results entry page (same ceremony)
3. Admin A sets Best Picture winner → success
4. Admin B (still seeing old version) tries to set different winner
5. Admin B sees conflict dialog: "Admin A set [nominee] as winner"
6. Admin B chooses to accept or override
```

#### Journey 5: Full Oscar Night Simulation
```
1. Pool with 5 members, all predictions submitted
2. Admin locks predictions
3. Results Manager enters winners category by category
4. After each winner: leaderboard updates on page refresh
5. After all winners: verify final leaderboard scores match manual calculation
6. Verify score breakdown per member per category
```

### Error Scenario E2E Tests

| Test | Steps | Expected |
|------|-------|----------|
| Expired invite | Click invite link with expired token | "Invite expired" message |
| Pool full | Join pool at maxMembers capacity | "Pool is full" message |
| Locked predictions | Navigate to prediction form after lock | Form disabled, "Predictions locked" banner |
| Invalid pool code | Enter non-existent code | "Pool not found" message |
| Double join | Try to join pool already a member of | "Already a member" message |

---

## Accessibility Tests

### Automated (axe-core)

Run axe-core on every page after rendering:

```typescript
// __tests__/a11y/pages.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const pages = [
  '/',
  '/auth/signin',
  '/pools',
  '/pools/create',
  '/pools/[id]',
  '/pools/[id]/predict',
  '/pools/[id]/leaderboard',
  '/pools/[id]/invites',
  '/admin',
]

for (const page of pages) {
  test(`${page} has no accessibility violations`, async ({ page: pw }) => {
    await pw.goto(page)
    const results = await new AxeBuilder({ page: pw })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    expect(results.violations).toEqual([])
  })
}
```

### Manual Testing Checklist (per release)

- [ ] Complete prediction flow using keyboard only (no mouse)
- [ ] Navigate leaderboard using screen reader (VoiceOver/NVDA)
- [ ] Verify all form inputs have visible labels
- [ ] Verify focus is trapped in modal dialogs
- [ ] Verify focus returns to trigger element when modal closes
- [ ] Test with browser zoom at 200% — no content overflow or overlap
- [ ] Test with system high-contrast mode enabled
- [ ] Verify all interactive elements have visible focus indicators

---

## Performance Tests

### Core Web Vitals

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP | < 2.5s | Lighthouse CI on mobile (throttled 3G) |
| INP | < 200ms | Real user monitoring (post-launch) |
| CLS | < 0.1 | Lighthouse CI |

### Load Testing

| Scenario | Load | Target |
|----------|------|--------|
| Leaderboard render (10 members) | Single request | < 500ms response |
| Leaderboard render (100 members) | Single request | < 2s response (within serverless timeout) |
| Concurrent results entry | 5 simultaneous updates | All succeed or get proper conflict responses |
| Pool join spike | 50 joins in 1 minute | All succeed, no timeouts |

---

## CI Pipeline

```yaml
# Run on every PR:
- npm run lint          # ESLint
- npm run test          # Vitest (unit + integration)
- npm run test:e2e      # Playwright (E2E + a11y)
- npm run build         # Next.js production build
- lighthouse-ci         # Performance + accessibility scores

# Merge blocked if:
# - Any test fails
# - Lint errors
# - Build fails
# - Lighthouse accessibility < 95
# - axe-core violations > 0
```

---

## Test Data Seeding

### Test Fixtures

Maintain a consistent set of test fixtures:

```typescript
// __tests__/fixtures/index.ts
export const testCeremony = {
  year: 2026,
  name: '98th Academy Awards',
  isActive: true,
  predictionsLocked: false,
}

export const testCategories = [
  { name: 'Best Picture', pointValue: 10, runnerUpMultiplier: 0.5, displayOrder: 1 },
  { name: 'Best Director', pointValue: 8, runnerUpMultiplier: 0.5, displayOrder: 2 },
  // ... all 23+ categories
]

export const testUsers = {
  admin: { name: 'Pool Admin', email: 'admin@test.com' },
  resultsManager: { name: 'Results Manager', email: 'results@test.com' },
  member1: { name: 'Member One', email: 'member1@test.com' },
  member2: { name: 'Member Two', email: 'member2@test.com' },
  outsider: { name: 'Not In Pool', email: 'outsider@test.com' },
}
```

### Database Isolation

- Unit tests: Mock Prisma client (`vitest.mock`)
- Integration tests: Use test database with transaction rollback
- E2E tests: Seed fresh database before each test suite, clean up after
- Never share database state between parallel test runs

---

## Bug Tracking

All bugs discovered during testing must be tracked as GitHub Issues:

- **Test failure revealing a bug** → Create issue with labels `bug` + relevant phase label
- **Accessibility violation** → Create issue with label `a11y`, include axe-core output
- **Performance regression** → Create issue with label `performance`, include Lighthouse scores
- **Flaky test** → Create issue with label `testing` + `flaky`, include failure frequency

See `CLAUDE.md` (GitHub Issues Workflow) for issue creation conventions.

---

## Definition of Test Done

A feature is considered fully tested when:

1. Unit tests cover all business logic branches
2. Integration tests cover the API/server-action for happy path + error cases
3. Component tests verify user interactions work correctly
4. E2E test covers the full user journey for the feature
5. Accessibility test passes (zero axe-core violations)
6. Tests pass in CI pipeline
7. No skipped tests (`test.skip` must have a linked GitHub Issue)
8. All bugs found during testing are tracked as GitHub Issues
