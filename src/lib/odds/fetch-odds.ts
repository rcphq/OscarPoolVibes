import { OddsMap, RawOdds } from '@/types/odds';

/**
 * Normalizes a nominee name for fuzzy matching across platforms.
 * - Lowercases everything
 * - Removes punctuation and special characters
 * - Strips content within parentheses (often used for movie names next to actors)
 * - Removes generic prefixes like 'the '
 */
export function normalizeNomineeName(name: string): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // remove anything in parentheses
    .replace(/[.,'"]/g, '') // remove punctuation
    .replace(/^the\s+/, '') // remove leading "the "
    .trim();
}

/**
 * Fetches odds from Polymarket's Gamma API.
 * NOTE: Polymarket uses event tags that may not align with the current Oscar season.
 * If the tag returns no Oscar-related events, this gracefully returns [].
 */
export async function fetchPolymarketOdds(tag: string = 'oscars-2026'): Promise<RawOdds[]> {
  // Fetch both open and closed events so we get locked/final odds too
  const url = `https://gamma-api.polymarket.com/events?tag=${tag}`;

  try {
    const res = await fetch(url, { next: { revalidate: 900 } }); // 15 min cache
    if (!res.ok) {
      throw new Error(`Polymarket API returned ${res.status}`);
    }

    const data = await res.json();
    const results: RawOdds[] = [];

    if (Array.isArray(data)) {
      for (const event of data) {
        if (Array.isArray(event.markets)) {
          for (const market of event.markets) {
            let prices: number[] = [];

            try {
              if (typeof market.outcomePrices === 'string') {
                prices = JSON.parse(market.outcomePrices).map(Number);
              } else if (Array.isArray(market.outcomePrices)) {
                prices = market.outcomePrices.map(Number);
              }
            } catch {
              console.error('Failed to parse outcome prices for market', market.id);
            }

            const outcomes: string[] = market.outcomes || [];

            for (let i = 0; i < outcomes.length; i++) {
              if (prices[i] !== undefined && !isNaN(prices[i])) {
                // Polymarket prices are 0.0–1.0 decimals; multiply by 100 for percentage.
                // Clamp to [0, 100] in case a market ever returns pre-scaled values.
                const probability = Math.round(Math.min(1, Math.max(0, prices[i])) * 100);
                results.push({ nomineeName: outcomes[i], probability });
              }
            }
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to fetch Polymarket odds:', error);
    throw error;
  }
}

/**
 * Kalshi 2026 Oscar event tickers, keyed by our canonical category name.
 * Each event_ticker maps to all nominee markets for that category.
 * Tickers verified against live Kalshi API on 2026-03-14.
 */
const KALSHI_2026_EVENT_TICKERS: Record<string, string> = {
  'Best Picture': 'KXOSCARPIC-26',
  'Best Director': 'KXOSCARDIR-26',
  'Best Actor': 'KXOSCARACTO-26',
  'Best Actress': 'KXOSCARACTR-26',
  'Best Supporting Actor': 'KXOSCARSUPACTO-26',
  'Best Supporting Actress': 'KXOSCARSUPACTR-26',
  'Best Original Score': 'KXOSCARSCORE-26',
  'Best Film Editing': 'KXOSCAREDIT-26',
  'Best Costume Design': 'KXOSCARCOSTUME-26',
  'Best Sound': 'KXOSCARSOUND-26',
  'Best Makeup and Hairstyling': 'KXOSCARMAH-26',
  'Best Original Screenplay': 'KXOSCARSPLAY-26',
  'Best International Feature Film': 'KXOSCARINTLFILM-26',
  'Best Production Design': 'KXOSCARPROD-26',
};

/**
 * Fetches odds from Kalshi for all known Oscar 2026 categories.
 * Fetches all markets regardless of status so locked/closed odds are included.
 * Price field: last_price_dollars (0.0–1.0) × 100 = percentage probability.
 * Nominee name: Kalshi subtitle format is "Name:: Movie" — we take the first part.
 */
export async function fetchKalshiOdds(): Promise<RawOdds[]> {
  const eventTickers = Object.values(KALSHI_2026_EVENT_TICKERS);

  const fetchEvent = async (eventTicker: string): Promise<RawOdds[]> => {
    const url = `https://api.elections.kalshi.com/trade-api/v2/markets?event_ticker=${eventTicker}&limit=100`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) throw new Error(`Kalshi API returned ${res.status} for ${eventTicker}`);

    const data = await res.json();
    const results: RawOdds[] = [];

    if (Array.isArray(data.markets)) {
      for (const market of data.markets) {
        // subtitle format: "Nominee Name:: Movie Title" or just "Movie Title"
        // Take the part before "::" as the matchable nominee name
        const rawSubtitle: string = market.subtitle || market.title || '';
        const nomineeName = rawSubtitle.includes('::')
          ? rawSubtitle.split('::')[0].trim()
          : rawSubtitle.trim();

        // Skip "Tie" markets — not a real nominee
        if (!nomineeName || nomineeName.toLowerCase() === 'tie') continue;

        // last_price_dollars is 0.0–1.0; multiply by 100 for percentage
        const priceDollars: number = market.last_price_dollars ?? market.yes_bid_dollars ?? 0;
        const probability = Math.round(priceDollars * 100);

        if (probability > 0) {
          results.push({ nomineeName, probability });
        }
      }
    }

    return results;
  };

  const settled = await Promise.allSettled(eventTickers.map(fetchEvent));
  const results: RawOdds[] = [];

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      results.push(...result.value);
    } else {
      console.error('Kalshi event fetch failed:', result.reason);
    }
  }

  return results;
}

/**
 * Merges raw odds from both platforms into a unified OddsMap.
 * Uses normalized names as the key.
 */
export function mergeOdds(poly: RawOdds[], kalshi: RawOdds[]): OddsMap {
  const map: OddsMap = {};

  const addEntry = (rawName: string, source: 'polymarket' | 'kalshi', probability: number) => {
    const norm = normalizeNomineeName(rawName);
    if (!norm) return;

    let matchedKey = norm;
    const existingKeys = Object.keys(map);

    // Attempt relaxed substring matching for slight name variations.
    // Require the shorter string to be at least 5 chars and the longer to be at most
    // 3 words longer — prevents short tokens like "lily" matching "lily gladstone".
    const fuzzyMatch = norm.length >= 5
      ? existingKeys.find(k => {
          const [shorter, longer] = norm.length < k.length ? [norm, k] : [k, norm];
          const wordDiff = longer.split(' ').length - shorter.split(' ').length;
          return wordDiff <= 3 && (longer.includes(shorter));
        })
      : undefined;
    if (fuzzyMatch) {
      matchedKey = fuzzyMatch;
    } else {
      map[matchedKey] = { polymarket: null, kalshi: null };
    }

    map[matchedKey][source] = probability;
  };

  for (const item of poly) {
    addEntry(item.nomineeName, 'polymarket', item.probability);
  }

  for (const item of kalshi) {
    addEntry(item.nomineeName, 'kalshi', item.probability);
  }

  return map;
}
