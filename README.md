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
| Framework | Next.js 14 (App Router) | Full-stack React, serverless-friendly |
| Language | TypeScript | Type safety across the stack |
| Database | PostgreSQL (Neon) | Generous free tier, serverless Postgres |
| ORM | Prisma | Type-safe queries, easy migrations |
| Auth | NextAuth.js | Simple social/email login, free |
| Styling | Tailwind CSS | Utility-first, fast iteration |
| Hosting | Vercel (free tier) | Zero-config Next.js deploys |

## Folder Structure

```
OscarPoolVibes/
├── prisma/                  # Prisma schema & migrations
├── public/                  # Static assets (images, icons)
├── src/
│   ├── app/                 # Next.js App Router pages & API routes
│   │   ├── api/             # REST/server-action endpoints
│   │   ├── pools/           # Pool pages (create, join, view)
│   │   └── admin/           # Admin pages (manage categories, nominees, winners)
│   ├── components/          # React components
│   │   ├── ui/              # Generic UI primitives (buttons, cards, modals)
│   │   ├── pools/           # Pool-specific components (prediction form, pool card)
│   │   └── leaderboard/     # Leaderboard table, score cards
│   ├── lib/                 # Shared utilities
│   │   ├── db/              # Prisma client & query helpers
│   │   ├── scoring/         # Point-calculation logic
│   │   └── auth/            # Auth configuration & helpers
│   └── types/               # Shared TypeScript types
├── scripts/                 # Seed scripts, data import utilities
├── __tests__/               # Test files
├── docs/                    # Project documentation
│   ├── SCHEMA.md            # Database schema reference
│   ├── ARCHITECTURE.md      # Architecture decisions & rationale
│   ├── PLAN.md              # Phased implementation plan
│   ├── MONETIZATION.md      # Monetization strategy & tier design
│   └── DATABASE_ALTERNATIVES.md  # Database options comparison
├── CLAUDE.md                # Agentic coding guidelines
└── README.md                # This file
```

## Getting Started

> **Prerequisites**: Node.js 18+, a Neon (or other Postgres) database URL

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and NEXTAUTH_SECRET

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
| `GITHUB_ID` | (optional) GitHub OAuth app client ID |
| `GITHUB_SECRET` | (optional) GitHub OAuth app client secret |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run test suite |
| `npm run seed` | Seed database with Oscar data |

## License

MIT
