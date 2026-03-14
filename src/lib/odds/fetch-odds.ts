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
 * 
 * @param tag e.g. "oscars-2026"
 */
export async function fetchPolymarketOdds(tag: string = 'oscars-2026'): Promise<RawOdds[]> {
  const url = `https://gamma-api.polymarket.com/events?tag=${tag}&closed=false`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 900 } }); // 15 min cache
    if (!res.ok) {
      throw new Error(`Polymarket API returned ${res.status}`);
    }

    const data = await res.json();
    const results: RawOdds[] = [];

    // Polymarket returns an array of events, each with an array of markets
    if (Array.isArray(data)) {
      for (const event of data) {
        if (Array.isArray(event.markets)) {
          for (const market of event.markets) {
            // outcomePrices is a JSON-stringified array in some versions, or an array of strings
            let prices: number[] = [];
            
            try {
              if (typeof market.outcomePrices === 'string') {
                prices = JSON.parse(market.outcomePrices).map(Number);
              } else if (Array.isArray(market.outcomePrices)) {
                prices = market.outcomePrices.map(Number);
              }
            } catch (e) {
              console.error('Failed to parse outcome prices for market', market.id);
            }

            const outcomes: string[] = market.outcomes || [];
            
            for (let i = 0; i < outcomes.length; i++) {
              if (prices[i] !== undefined && !isNaN(prices[i])) {
                results.push({
                  nomineeName: outcomes[i],
                  probability: Math.round(prices[i] * 100) // Convert 0.24 to 24
                });
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
 * Fetches odds from Kalshi API.
 * 
 * @param seriesTicker e.g. "KXOSCAR"
 */
export async function fetchKalshiOdds(seriesTicker: string = 'KXOSCAR'): Promise<RawOdds[]> {
  const url = `https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=${seriesTicker}&status=open`;
  
  try {
    const res = await fetch(url, { next: { revalidate: 900 } }); // 15 min cache
    if (!res.ok) {
      throw new Error(`Kalshi API returned ${res.status}`);
    }

    const data = await res.json();
    const results: RawOdds[] = [];

    if (data && Array.isArray(data.markets)) {
      for (const market of data.markets) {
        // Kalshi typically puts the outcome in the ticker or title.
        // E.g., title: "Will Oppenheimer win Best Picture?" or subtitle: "Oppenheimer"
        // Let's use the subtitle if it exists, otherwise pull from title
        const nameRaw = market.subtitle || market.title || '';
        
        // yes_bid / yes_ask are in cents (0-100)
        // Last price is also available
        const price = market.last_price || (market.yes_bid || 0);
        
        if (nameRaw && price > 0) {
          results.push({
            nomineeName: nameRaw,
            probability: price // already 0-100 format in Kalshi
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to fetch Kalshi odds:', error);
    throw error;
  }
}

/**
 * Merges raw odds from both platforms into a unified OddsMap.
 * Uses normalized names as the key.
 */
export function mergeOdds(poly: RawOdds[], kalshi: RawOdds[]): OddsMap {
  const map: OddsMap = {};

  // Helper to add or update an entry
  const addEntry = (rawName: string, source: 'polymarket' | 'kalshi', probability: number) => {
    const norm = normalizeNomineeName(rawName);
    if (!norm) return;

    // Check if we need to do substring matching for slight variations instead of exact
    // For simplicity, we stick to exact substring after normalization first.
    // If not in map yet, we can check if it contains or is contained by an existing key
    
    let matchedKey = norm;
    const existingKeys = Object.keys(map);
    
    // Attempt relaxed matching
    const fuzzyMatch = existingKeys.find(k => k.includes(norm) || norm.includes(k));
    if (fuzzyMatch) {
      matchedKey = fuzzyMatch;
    } else {
      // Create new entry
      map[matchedKey] = {
        polymarket: null,
        kalshi: null,
      };
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
