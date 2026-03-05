# Database Alternatives

Comparison of database options for OscarPoolVibes, a Next.js app on Vercel free tier.

---

## Comparison Matrix

| Database | Free Storage | Serverless | Postgres? | Prisma | Drizzle | Best For |
|---|---|---|---|---|---|---|
| **Neon** (chosen) | 0.5 GB | Yes | Yes | Yes | Yes | Vercel + relational apps |
| **Supabase** | 500 MB | Partial | Yes | Yes | Yes | All-in-one (auth+DB+realtime) |
| **PlanetScale** | None ($5 min) | Yes | No (MySQL) | Yes* | Yes | Teams needing schema branching |
| **Turso** | 5 GB | Yes (edge) | No (SQLite) | Adapter | Yes | Edge-first, read-heavy apps |
| **Vercel Postgres** | 0.5 GB | Yes | Yes | Yes | Yes | Zero-config Vercel setup |
| **MongoDB Atlas** | 512 MB | Partial | No | Yes* | No | Document-oriented data |
| **Firebase/Firestore** | 1 GB | Yes | No | No | No | Mobile-first, realtime apps |
| **CockroachDB** | 10 GB | Yes | Compat | Yes | Yes | Multi-region distributed SQL |
| **Cloudflare D1** | 5 GB | Workers only | No (SQLite) | Adapter | Yes | Cloudflare Workers apps |

*\* = with caveats or reduced feature set*

---

## Detailed Breakdown

### 1. Neon PostgreSQL (Current Choice)

| Attribute | Details |
|---|---|
| **Free tier** | 0.5 GB storage, 100 CU-hours/month compute, 5 GB egress, up to 20 projects. Scale-to-zero with 5-min idle timeout. |
| **Serverless?** | Yes — purpose-built serverless Postgres. HTTP-based driver (`@neondatabase/serverless`) avoids cold-start connection overhead. |
| **ORM support** | Full Prisma support, first-class Drizzle support, native `pg` driver. |
| **Pros** | True Postgres (full SQL, extensions, joins). Excellent Vercel integration. Acquired by Databricks (2025) — strong financial backing. Built-in connection pooling via pgBouncer. |
| **Cons** | 0.5 GB storage can be tight with lots of historical data. ~300-500ms cold start after idle. No branching on free plan. |
| **Pricing at scale** | $5/month minimum on paid plans. $0.35/GB-month storage, $0.16/CU-hour. Very competitive. |

### 2. Supabase

| Attribute | Details |
|---|---|
| **Free tier** | 500 MB database, 2 projects, 50K monthly auth users, 1 GB file storage, 500K edge function invocations. |
| **Serverless?** | Partially. Persistent Postgres instance (not scale-to-zero). Projects **pause after 7 days of inactivity** on free tier. |
| **ORM support** | Standard Postgres — Prisma and Drizzle both work. Also has its own JS client with auto-generated types. |
| **Pros** | Batteries-included: auth, realtime subscriptions, storage, edge functions. Could replace NextAuth entirely. Realtime could power live leaderboard. Great dashboard. |
| **Cons** | Free projects pause after 7 days idle — problematic for a seasonal Oscar app. 2-project limit. All-in-one creates vendor lock-in. Pro plan jumps to $25/month. |
| **When to pick** | When you want auth + database + realtime in one platform and can accept pausing or pay $25/month. |

### 3. PlanetScale (MySQL)

| Attribute | Details |
|---|---|
| **Free tier** | **No free tier** (removed April 2024). Cheapest is $5/month single-node. |
| **Serverless?** | Yes — Vitess-based, HTTP-friendly, excellent cold-start behavior. |
| **ORM support** | Prisma (with `relationMode = "prisma"` — no DB-level foreign keys). Drizzle native support. |
| **Pros** | Best-in-class branching and schema migration workflow. Non-blocking schema changes. Very fast. |
| **Cons** | No free tier — disqualifying for free-tier constraint. MySQL, not Postgres. No foreign key enforcement at DB level. Community trust issues after removing free tier. |
| **When to pick** | If you have budget and want the best migration workflow. Not for hobby/free-tier projects. |

### 4. Turso (libSQL / SQLite at the Edge)

| Attribute | Details |
|---|---|
| **Free tier** | **5 GB storage**, 500M rows read/month, 10M rows written/month, 100 databases. No idle pausing. |
| **Serverless?** | Yes — designed for edge. Embedded replicas for zero-latency reads inside serverless functions. |
| **ORM support** | Drizzle has excellent first-class support. Prisma via `@prisma/adapter-libsql` (adapter mode, less mature). |
| **Pros** | Most generous free tier by storage (10x Neon). Sub-millisecond edge reads. SQLite simplicity. Per-pool databases architecturally possible. |
| **Cons** | SQLite limitations: limited concurrent writes, fewer advanced SQL features. Prisma adapter is less mature than native Postgres support. Smaller ecosystem. |
| **When to pick** | Read-heavy apps, edge-first architectures, or if you want generous free storage. Consider switching from Prisma to Drizzle for best experience. |
| **Pricing at scale** | $4.99/month Developer plan (9 GB, 1B reads). Very affordable. |

### 5. Vercel Postgres

| Attribute | Details |
|---|---|
| **Free tier** | Identical to Neon (0.5 GB, 100 CU-hours). Fully transitioned to Neon's native integration in late 2024. |
| **ORM support** | Same as Neon. Also has `@vercel/postgres` SDK (thin wrapper). |
| **Pros** | Tightest Vercel integration — env vars auto-populated, single vendor billing. |
| **Cons** | It literally is Neon now. Hobby plan restricts to non-commercial use (Vercel ToS). Less control over Neon-specific features. |
| **When to pick** | If you want zero-config and don't mind the Neon abstraction. Functionally equivalent to Neon directly. |

### 6. MongoDB Atlas

| Attribute | Details |
|---|---|
| **Free tier** | 512 MB storage (M0 Sandbox), shared CPU/RAM, 100 max connections. Free forever, no credit card. |
| **Serverless?** | Partially. Connection pooling is tricky in serverless. Must use Data API or carefully manage connections. |
| **ORM support** | Prisma supports MongoDB. Mongoose is the dominant ODM. Drizzle does **not** support MongoDB. |
| **Pros** | Flexible schema for rapid prototyping. Generous ecosystem. Free tier never pauses. |
| **Cons** | **Poor fit for this app** — Oscar pools are inherently relational. No joins means denormalization and data duplication. Prisma MongoDB support is less mature. Connection management in serverless is finicky. |
| **When to pick** | Document-oriented data (CMS, event logs, flexible schemas). **Not recommended** for relational domains like Oscar pools. |

### 7. Firebase / Firestore

| Attribute | Details |
|---|---|
| **Free tier** | (Spark Plan) 1 GB stored, 50K reads/day, 20K writes/day, 20K deletes/day. Also includes free auth, hosting, cloud functions. |
| **Serverless?** | Yes — fully managed, no connection pooling needed. |
| **ORM support** | **No Prisma or Drizzle support.** Firebase has its own SDK only. |
| **Pros** | No cold-start DB issues. Realtime listeners built in. Auth, hosting, storage all integrated. Daily quotas generous for small apps. |
| **Cons** | **NoSQL document model** — same relational mismatch as MongoDB. No SQL, no joins. Vendor lock-in to Google. Querying across collections requires denormalization. Pricing can spike with read-heavy patterns. Storage changes in 2026 require Blaze plan. |
| **When to pick** | Mobile-first or real-time collaborative apps. **Not ideal** for this relational use case. |

### 8. CockroachDB Serverless

| Attribute | Details |
|---|---|
| **Free tier** | $15/month credit (~50M Request Units + **10 GB storage**). Scales to zero. No credit card. |
| **Serverless?** | Yes — true serverless with scale-to-zero. HTTP-based connections available. |
| **ORM support** | Prisma native support (`provider = "cockroachdb"`). Drizzle supports it. Postgres wire-compatible. |
| **Pros** | 10 GB free storage — most generous SQL option. Distributed SQL with strong consistency. Automatic scaling. |
| **Cons** | Request Unit pricing is opaque and hard to predict. Higher latency than Neon (distributed consensus overhead). Background operations consume RUs. Smaller community. |
| **When to pick** | When you need distributed SQL or multi-region. Overkill for a small social app but the generous free tier makes it viable for experimentation. |

### 9. Cloudflare D1

| Attribute | Details |
|---|---|
| **Free tier** | 5 GB storage, 5M reads/day, 100K writes/day. |
| **Serverless?** | **Cloudflare Workers only** — not usable from Vercel serverless functions without a proxy. |
| **ORM support** | Drizzle (first-class), Prisma (adapter/experimental). |
| **Pros** | Zero egress charges, tight Workers integration. |
| **Cons** | **Not practical for Vercel** without adding an API proxy layer, adding latency and complexity. |
| **Verdict** | Skip for a Vercel-hosted app. |

---

## Recommendation

**Neon (current choice) is the right call for OscarPoolVibes.** Reasoning:

1. **Relational data** — Oscar pools are inherently relational (users → pool memberships → predictions → nominees → categories). Postgres handles this naturally. Document databases (MongoDB, Firestore) would require painful denormalization.

2. **Prisma compatibility** — Neon has the best Prisma support of any serverless database. No adapters or workarounds.

3. **Vercel integration** — First-class. Scale-to-zero aligns perfectly with a seasonal app (idle most of the year, spikes around ceremony time).

4. **Free tier sufficiency** — 0.5 GB is plenty. ~23 categories × ~5 nominees + thousands of predictions stays well under limit.

5. **Upgrade path** — Post-Databricks pricing ($5/month, $0.35/GB) is among the cheapest.

**Best alternative**: **Turso** — 10x more free storage, edge reads, but requires Drizzle instead of Prisma and accepts SQLite limitations.

**If you want batteries-included**: **Supabase** — replaces NextAuth and adds realtime, but $25/month Pro plan and 7-day idle pausing on free tier.
