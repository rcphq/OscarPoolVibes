# OscarPoolVibes

A web app for running Oscar prediction pools with friends. Pick your winners and runners-up across every Academy Award category, earn points based on correct predictions, and compete on a live leaderboard.

## Features

- **Multiple Pools** — Create and join multiple pools (work friends, family, film buffs)
- **Open & Invite-Only Pools** — Open pools anyone can join via link; invite-only pools require explicit invitations
- **Invite Links** — Generate shareable links for each pool; invite friends by email
- **Google SSO** — One-click sign-in with Google (email magic-link fallback)
- **Predictions** — Select a first-choice and runner-up pick for every category
- **Weighted Scoring** — Each category has a configurable point value; first-choice and runner-up hits score differently
- **Leaderboard** — Real-time rankings showing total points for every participant
- **Multi-Year Support** — Historical data for nominees, categories, and winners across ceremony years
- **Admin Tools** — Manage categories, nominees, and lock/reveal winners

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15 (App Router) | Full-stack React, RSC, serverless-friendly |
| Language | TypeScript | Type safety across the stack |
| Database | PostgreSQL (Neon) | Generous free tier, serverless Postgres |
| ORM | Prisma | Type-safe queries, easy migrations |
| Auth | Auth.js (next-auth v5) | Social/email login, App Router native |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Testing | Vitest + React Testing Library | Fast, ESM-native, React integration |
| Email | Resend | Transactional email for magic-link auth & invites |
| Hosting | Vercel (free tier) | Zero-config Next.js deploys |

## Folder Structure

```
OscarPoolVibes/
├── prisma/                  # Prisma schema & migrations
├── public/                  # Static assets (images, icons)
├── src/
│   ├── app/                 # Next.js App Router pages & API routes
│   │   ├── api/             # REST/server-action endpoints
│   │   │   ├── results/     # Results management API (implemented)
│   │   │   └── pools/       # Pool management API
│   │   ├── pools/           # Pool pages (create, join, view)
│   │   └── admin/           # Admin pages (manage categories, nominees, winners)
│   ├── components/          # React components
│   │   ├── ui/              # Generic UI primitives (buttons, cards, modals)
│   │   ├── pools/           # Pool-specific components (prediction form, pool card)
│   │   └── leaderboard/     # Leaderboard table, score cards
│   ├── lib/                 # Shared utilities
│   │   ├── db/              # Prisma client & query helpers
│   │   ├── results/         # Results management & permissions (implemented)
│   │   ├── scoring/         # Point-calculation logic
│   │   └── auth/            # Auth configuration & helpers
│   └── types/               # Shared TypeScript types
├── scripts/                 # Seed scripts, data import utilities
├── __tests__/               # Test files (mirrors src/ structure)
├── docs/                    # Project documentation
│   ├── SCHEMA.md            # Database schema reference
│   ├── ARCHITECTURE.md      # Architecture decisions & rationale
│   ├── PLAN.md              # Phased implementation plan
│   ├── USE_CASES.md         # All use cases organized by role
│   ├── MONETIZATION.md      # Monetization strategy & tier design
│   ├── TESTING.md           # Testing strategy & coverage requirements
│   └── DATABASE_ALTERNATIVES.md  # Database options comparison
├── CLAUDE.md                # Agentic coding guidelines
└── README.md                # This file
```

## Getting Started

> **Prerequisites**: Node.js 18+, a Neon (or other Postgres) database URL

> For database setup options, see [docs/DATABASE_ALTERNATIVES.md](docs/DATABASE_ALTERNATIVES.md)

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local   # Create from template
# Edit .env.local — see Environment Variables table below for required values

# Run database migrations
npx prisma migrate dev

# Seed sample data (optional)
npm run seed

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon recommended) |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random secret for session encryption |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (from Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_ID` | (Optional) GitHub OAuth app client ID |
| `GITHUB_SECRET` | (Optional) GitHub OAuth app client secret |
| `RESEND_API_KEY` | Resend API key for email magic-link auth and pool invites |
| `EMAIL_FROM` | Sender email address for transactional emails (e.g. `noreply@oscarpoolvibes.com`) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run test suite |
| `npm run seed` | Seed database with Oscar data |
| `npm run test:e2e` | Run end-to-end tests (Playwright) |
| `npm run test:a11y` | Run accessibility audit |

## Accessibility

OscarPoolVibes targets **WCAG 2.1 Level AA** compliance:

- Semantic HTML and ARIA attributes throughout
- Full keyboard navigation support
- Screen reader compatibility (tested with NVDA/VoiceOver)
- Color contrast ratios meeting AA standards (4.5:1 for text, 3:1 for UI components)
- Focus management for modals, forms, and dynamic content
- Responsive design — mobile-first, touch-friendly targets (44×44px minimum)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ADR-10 for the full accessibility strategy.

## SEO & Discoverability

The app is optimized for search engines and AI-powered discovery:

- **SSR/SSG** — Server-rendered pages with proper meta tags, Open Graph, and structured data
- **Semantic HTML** — Proper heading hierarchy, landmark regions, descriptive link text
- **AI/LLM Crawler Optimization** — Machine-readable structured data (JSON-LD), clean URL structure, and a `/llms.txt` manifest for AI crawlers
- **Performance** — Core Web Vitals targets (LCP < 2.5s, INP < 200ms, CLS < 0.1)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ADR-11 for details.

## Testing

Comprehensive test coverage across all layers:

| Type | Tool | Scope |
|------|------|-------|
| Unit | Vitest | Scoring logic, permissions, utilities |
| Integration | Vitest + Prisma | API routes, server actions, DB queries |
| Component | React Testing Library | UI components, forms, interactions |
| E2E | Playwright | Full user journeys, auth flows |
| Accessibility | axe-core + Lighthouse | WCAG 2.1 AA compliance |
| Visual | Playwright screenshots | UI regression detection |

See [docs/TESTING.md](docs/TESTING.md) for the full testing strategy.

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](CLAUDE.md) | Agentic coding guidelines and conventions |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture Decision Records (ADRs) |
| [docs/SCHEMA.md](docs/SCHEMA.md) | Database schema reference and rationale |
| [docs/PLAN.md](docs/PLAN.md) | Phased implementation plan with progress |
| [docs/USE_CASES.md](docs/USE_CASES.md) | Complete use cases by role |
| [docs/TESTING.md](docs/TESTING.md) | Testing strategy and coverage requirements |
| [docs/MONETIZATION.md](docs/MONETIZATION.md) | Monetization strategy and tier design |
| [docs/DATABASE_ALTERNATIVES.md](docs/DATABASE_ALTERNATIVES.md) | Database options comparison |

## License

Copyright (c) 2026 Ruben Llibre. All rights reserved. See [LICENSE](LICENSE) for details.
