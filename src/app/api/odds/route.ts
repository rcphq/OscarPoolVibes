import { NextResponse } from 'next/server';
import { fetchPolymarketOdds, fetchKalshiOdds, mergeOdds } from '@/lib/odds/fetch-odds';
import { OddsResponse } from '@/types/odds';

// We rely on the fetch wrappers in fetch-odds.ts having next: { revalidate: 900 }
// but we can also force the segment to cache for 15 minutes (900s) to be completely safe.
export const revalidate = 900; 

export async function GET() {
  try {
    // Run both fetches in parallel
    // Using allSettled so if one fails, we still return the other cleanly rather than 500ing
    const [polyResult, kalshiResult] = await Promise.allSettled([
      fetchPolymarketOdds(),
      fetchKalshiOdds()
    ]);

    const polyOdds = polyResult.status === 'fulfilled' ? polyResult.value : [];
    if (polyResult.status === 'rejected') {
      console.error('Polymarket fetch failed in /api/odds route:', polyResult.reason);
    }

    const kalshiOdds = kalshiResult.status === 'fulfilled' ? kalshiResult.value : [];
    if (kalshiResult.status === 'rejected') {
      console.error('Kalshi fetch failed in /api/odds route:', kalshiResult.reason);
    }

    // Merge the odds
    const merged = mergeOdds(polyOdds, kalshiOdds);

    const response: OddsResponse = {
      odds: merged,
      fetchedAt: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error in /api/odds route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch odds data' },
      { status: 500 }
    );
  }
}
