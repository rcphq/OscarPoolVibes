# OscarPoolVibes

A web app for running Oscar prediction pools with friends. Pick your winners and runners-up across every Academy Award category, earn points based on correct predictions, and compete on a live leaderboard.

## Features

- **Multiple Pools** â€” Create and join multiple pools (work friends, family, film buffs)
- **Open & Invite-Only Pools** â€” Open pools anyone can join via link; invite-only pools require explicit invitations
- **Invite Links** â€” Generate shareable links for each pool; invite friends by email
- **Google SSO** â€” One-click sign-in with Google (email magic-link fallback)
- **Predictions** â€” Select a first-choice and runner-up pick for every category
- **Weighted Scoring** â€” Each category has a configurable point value; first-choice and runner-up hits score differently
- **Leaderboard** â€” Real-time rankings showing total points for every participant
- **Multi-Year Support** â€” Historical data for nominees, categories, and winners across ceremony years
- **Results Management** â€” Set or clear category winners with optimistic concurrency control; undo results entered in error
- **Admin Tools** â€” Manage categories, nominees, and lock/reveal winners

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
â”œâ”€â”€ prisma/                  # Prisma schema & migrations
â”œâ”€â”€ public/                  # Static assets (images, icons)
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/                 # Next.js App Router pages & API routes
â”‚   â”‚   â”œâ”€â”€ api/             # REST/server-action endpoints
â”‚   â”‚   â”‚   â”œâ”€â”€ results/     # Results management API (implemented)
â”‚   â”‚   â”‚   â””â”€â”€ pools/       # Pool management API
â”‚   â”‚   â”œâ”€â”€ pools/           # Pool pages (create, join, view)
â”‚   â”‚   â””â”€â”€ admin/           # Admin pages (manage categories, nominees, winners)
â”‚   â”œâ”€â”€ components/          # React components
â”‚   â”‚   â”œâ”€â”€ ui/              # Generic UI primitives (buttons, cards, modals)
â”‚   â”‚   â”œâ”€â”€ pools/           # Pool-specific components (prediction form, pool card)
â”‚   â”‚   â”œâ”€â”€ leaderboard/     # Leaderboard table, score cards
â”‚   â”‚   â””â”€â”€ results/         # Results entry form, live polling
â”‚   â”œâ”€â”€ lib/                 # Shared utilities
â”‚   â”‚   â”œâ”€â”€ db/              # Prisma client & query helpers
â”‚   â”‚   â”œâ”€â”€ results/         # Results management & permissions (implemented)
â”‚   â”‚   â”œâ”€â”€ scoring/         # Point-calculation logic
â”‚   â”‚   â””â”€â”€ auth/            # Auth configuration & helpers
â”‚   â””â”€â”€ types/               # Shared TypeScript types
â”œâ”€â”€ scripts/                 # Seed scripts, data import utilities
â”œâ”€â”€ __tests__/               # Test files (mirrors src/ structure)
â”œâ”€â”€ docs/                    # Project documentation
â”‚   â”œâ”€â”€ SCHEMA.md            # Database schema reference
â”‚   â”œâ”€â”€ ARCHITECTURE.md      # Architecture decisions & rationale
â”‚   â”œâ”€â”€ PLAN.md              # Phased implementation plan
â”‚   â”œâ”€â”€ USE_CASES.md         # All use cases organized by role
â”‚   â”œâ”€â”€ MONETIZATION.md      # Monetization strategy & tier design
â”‚   â”œâ”€â”€ TESTING.md           # Testing strategy & coverage requirements
â”‚   â””â”€â”€ DATABASE_ALTERNATIVES.md  # Database options comparison
â”œâ”€â”€ CLAUDE.md                # Agentic coding guidelines
â””â”€â”€ README.md                # This file
```

## Getting Started

> **Prerequisites**: Node.js 18+, a Neon (or other Postgres) database URL

> For database setup options, see [docs/DATABASE_ALTERNATIVES.md](docs/DATABASE_ALTERNATIVES.md)

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local   # Create from template
# Edit .env.local â€” see Environment Variables table below for required values

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
| `AUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `AUTH_SECRET` | Random secret for session encryption (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (from Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_ID` | (Optional) GitHub OAuth app client ID |
| `GITHUB_SECRET` | (Optional) GitHub OAuth app client secret |
| `RESEND_API_KEY` | Resend API key for email magic-link auth and pool invites |
| `EMAIL_FROM` | Sender email address for transactional emails (e.g. `noreply@oscarpoolvibes.com`) |
| `SITE_ADMIN_EMAILS` | Comma-separated email allowlist for the global admin area |

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

## Design System

OscarPoolVibes uses a "Black Tie" design aesthetic — Gold + Deep Navy, dark-mode-first, with an elegant ceremony feel.

- **Component library**: shadcn/ui (Radix UI + Tailwind CSS v4)
- **Fonts**: Playfair Display (headings) + Inter (body) via `next/font`
- **Icons**: Lucide React
- **Theme**: Dark default, light mode available; respects `prefers-color-scheme` on first visit
- **Motion**: All animations respect `prefers-reduced-motion`

See [docs/plans/2026-03-05-design-system.md](docs/plans/2026-03-05-design-system.md) for the full specification.

## Accessibility

OscarPoolVibes targets **WCAG 2.1 Level AA** compliance:

- Semantic HTML and ARIA attributes throughout
- Full keyboard navigation support
- Screen reader compatibility (tested with NVDA/VoiceOver)
- Color contrast ratios meeting AA standards (4.5:1 for text, 3:1 for UI components)
- Focus management for modals, forms, and dynamic content
- Responsive design â€” mobile-first, touch-friendly targets (44Ã—44px minimum)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ADR-10 for the full accessibility strategy.

## SEO & Discoverability

The app is optimized for search engines and AI-powered discovery:

- **SSR/SSG** â€” Server-rendered pages with proper meta tags, Open Graph, and structured data
- **Semantic HTML** â€” Proper heading hierarchy, landmark regions, descriptive link text
- **AI/LLM Crawler Optimization** â€” Machine-readable structured data (JSON-LD), clean URL structure, and a `/llms.txt` manifest for AI crawlers
- **Performance** â€” Core Web Vitals targets (LCP < 2.5s, INP < 200ms, CLS < 0.1)

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
| [CHANGELOG.md](CHANGELOG.md) | Release history and notable changes |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture Decision Records (ADRs) |
| [docs/SCHEMA.md](docs/SCHEMA.md) | Database schema reference and rationale |
| [docs/PLAN.md](docs/PLAN.md) | Phased implementation plan with progress |
| [docs/USE_CASES.md](docs/USE_CASES.md) | Complete use cases by role |
| [docs/TESTING.md](docs/TESTING.md) | Testing strategy and coverage requirements |
| [docs/MONETIZATION.md](docs/MONETIZATION.md) | Monetization strategy and tier design |
| [docs/DATABASE_ALTERNATIVES.md](docs/DATABASE_ALTERNATIVES.md) | Database options comparison |
| [docs/plans/2026-03-05-design-system.md](docs/plans/2026-03-05-design-system.md) | Design system specification (Black Tie) |

## License

Copyright (c) 2026 Ruben Llibre. All rights reserved. See [LICENSE](LICENSE) for details.


