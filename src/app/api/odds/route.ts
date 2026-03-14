import { NextResponse } from 'next/server';
import lockedOdds from '@/lib/odds/locked-2026-odds.json';
import { OddsResponse } from '@/types/odds';

// Static snapshot of Kalshi Oscar 2026 odds, captured 2026-03-14 (night before ceremony).
// No API calls needed — markets are closed and this data won't change.
export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(lockedOdds as OddsResponse);
}
