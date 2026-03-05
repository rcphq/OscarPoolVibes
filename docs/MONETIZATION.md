# Monetization Strategy

Research and recommendations for how OscarPoolVibes could generate revenue while keeping a strong free tier.

---

## Competitive Landscape

| Platform | Model | Details |
|---|---|---|
| **RunYourPool / Splash Sports** | Per-entry fees to commissioners | Free for participants; commissioners pay tiered pricing based on pool size (~$24 for small pools). Custom branding, message boards included. |
| **Bracketology.tv** | Dual currency (Coins/Bucks) | Free social play with Coins; paid entry with Bucks for real cash prize pools. Coins earned through engagement. |
| **ESPN/ABC Oscars Pick'em** | Free, ad-supported | Entirely free; monetized through ads and driving users into ESPN+. |
| **TheOfficePool / Picktainment** | Free | Basic free tools, minimal monetization. |
| **Sleeper (fantasy sports)** | Cosmetics + DFS | Free leagues with zero ads. Revenue from cosmetic purchases, DFS contests with real-money entry fees. |

**Key insight**: Most Oscar pool apps are free for participants. Revenue comes from pool organizers (commissioner fees), ads, premium features, or cosmetic purchases.

---

## Recommended Tiers

### Free Tier (maximize adoption)

- Create and join up to **3 pools** per ceremony year
- Pool size up to **10 members**
- Pick first-choice and runner-up for all categories
- Basic leaderboard with rankings and scores
- Share pool invite links (open and invite-only)
- View results after ceremony
- Standard scoring rules

> These tier limits are reflected in the use case constraints. See [USE_CASES.md](USE_CASES.md) for how limits affect user flows.

### Pro Tier (~$4.99/year or $0.99/ceremony)

- **Unlimited pools** per ceremony
- Advanced analytics: pick distribution charts ("42% of your pool picked X"), head-to-head comparisons
- Custom pool branding (pool name, logo/image, custom URL slug)
- Historical stats across ceremony years (win streaks, category accuracy %)
- Ad-free experience
- Export pool results (CSV/PDF)
- Custom scoring rules (adjust point values, add bonus categories)
- Priority notifications for winner announcements

### Commissioner Tier (~$9.99/ceremony or $14.99/year)

- Everything in Pro
- Pools up to **100+ members**
- Commissioner dashboard with member management
- Embeddable leaderboard widget for blogs/websites
- Custom category weighting presets
- Lock/unlock picks per-category (for live scoring during ceremony)
- Multiple ceremony year archive with comparisons

**Pricing rationale**: The Oscars are annual, so yearly or per-ceremony pricing makes more sense than monthly. Price points are low enough to be impulse purchases ($0.99-$4.99) while the commissioner tier captures organizers who really care.

### Tier Enforcement

> **Implementation note**: The database schema does not currently include a `Subscription` or `UserTier` model. Tier limits (pool count, member cap) are enforced at the application layer. A `Subscription` model will be needed when Stripe integration is implemented in Monetization Stage 2. For MVP, all users have free-tier limits hardcoded in the application logic.

> **Schema impact**: The `Pool.maxMembers` field (nullable Int) already exists and can be used for the per-pool member cap. The per-user pool count limit requires a query check at pool creation time.

---

## Creative Monetization Ideas

### A. Awards Season Pass ($2.99-$6.99)

Bundle prediction pools for the full awards circuit: Golden Globes, SAG Awards, BAFTAs, Critics Choice, and the Oscars. Extends engagement from December through March. Offer a cumulative "Awards Season Champion" leaderboard.

> **Schema impact**: The current data model is tightly coupled to Oscar ceremonies (`CeremonyYear`). Supporting Golden Globes, SAG, BAFTAs, etc. would require generalizing the ceremony model or creating parallel schemas. This is a significant architectural change, not just a feature addition. See `docs/ARCHITECTURE.md` ADR-6 for the current per-ceremony design.

### B. Cosmetic Trophies and Flair ($0.99-$2.99 each)

- Purchasable trophy icons displayed next to winners on leaderboards (gold Oscar statuette, crystal globe, etc.)
- Profile badges: "Perfect Category", "Upset Caller", "3-Year Streak"
- Custom pool themes (red carpet, noir/black-and-white, retro Hollywood)
- Pure margin with zero infrastructure cost; works because of social visibility

### C. Confidence Points Mode (Premium unlock)

A mode where users rank categories by confidence level — higher confidence = higher multiplier. Adds strategic depth and replayability. Free tier gets standard picks only.

### D. Live Oscar Night Experience (Premium or Ad-Supported)

- Real-time scoring during the broadcast with push notifications
- Live leaderboard that updates as winners are announced
- "Moment of Truth" countdown animations per category
- Highest-engagement window of the year — sell sponsored moments or premium live features

### E. Pool Entry Fees with Payment Rails

- Let commissioners collect real-money entry fees through the app (Stripe integration)
- Take a 5-10% platform fee on payouts
- Solves a real pain point: every pool organizer chases people on Venmo separately

> **Legal considerations**: Real-money pool entry fees implicate state-by-state gambling regulations in the US. Key requirements may include: age verification (18+ or 21+), state-specific licensing, responsible gaming disclosures, and prize pool escrow requirements. Budget for legal review before implementing this feature. Some states prohibit paid prediction contests entirely. Consider limiting to "social pools" (no platform take rate) initially to reduce regulatory exposure.

### F. Sponsored Predictions / Brand Partnerships

- "Presented by [Streaming Service]" category sponsorships
- Sponsored "bonus categories" (e.g., "Which film will you stream first?" sponsored by Netflix)
- Movie studio affiliate links on nominee pages
- Oscar pool users are exactly the audience streaming services want to reach

### G. Golden Ballot Challenge ($1.99 entry)

A single global pool where all users compete. Small entry fee funds a prize pool. Top 10 get permanent "Golden Ballot [year]" profile flair. Creates a marquee competitive event beyond friend pools.

### H. Data and Insights Product

- Aggregate anonymized prediction data ("68% of users predict X for Best Picture")
- Sell trend reports to entertainment media or studios during awards season
- Publish free "prediction consensus" content for SEO and brand awareness

---

## Revenue Projection (Rough Estimates)

| Scenario | Users | Paid Conversion | Avg Revenue | Annual Revenue |
|---|---|---|---|---|
| Year 1 (MVP) | 10K | 3% | $3.00 | ~$900 |
| Year 2 (Growth) | 50K | 4% | $4.99 | ~$10K |
| Year 3 (Scale) | 100K | 5% | $5.00 avg | ~$25K subscriptions + ~$15K cosmetics + ~$10K ads |
| With payment rails | 100K | 10% in paid pools | 5% of $10 avg entry | ~$50K+ |

**Strongest near-term plays**:
1. Commissioner fees for large pools
2. Cosmetic purchases (high margin, zero cost)
3. Ads on free tier during Oscar night (peak traffic)

**Highest-ceiling long-term play**: Payment rails for pool entry fees (5-10% take rate).

---

## Implementation Priority

1. **Monetization Stage 1 (MVP launch)**: Everything free — focus on user growth and engagement
2. **Monetization Stage 2 (Post-launch validation)**: Add Stripe for Pro/Commissioner tiers. Env vars needed: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
3. **Monetization Stage 3 (Growth)**: Cosmetics shop, Awards Season Pass
4. **Monetization Stage 4 (Scale)**: Payment rails, brand partnerships, data product
