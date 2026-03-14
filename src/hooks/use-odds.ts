import { useState, useEffect } from 'react';
import { OddsResponse, OddsMap } from '@/types/odds';

export function useOdds(enabled: boolean) {
  const [odds, setOdds] = useState<OddsMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If user has odds hidden (enabled=false), do nothing.
    if (!enabled) return;

    // If we already fetched odds successfully, no need to re-fetch on every toggle toggle
    if (odds !== null) return;

    let isMounted = true;

    async function loadOdds() {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/odds');
        if (!response.ok) {
          throw new Error('Failed to fetch odds from server API');
        }
        
        const data = (await response.json()) as OddsResponse;
        
        if (isMounted) {
          setOdds(data.odds);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error fetching odds'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOdds();

    return () => {
      isMounted = false;
    };
  }, [enabled, odds]);

  return { odds, isLoading, error };
}
