export type RawOdds = {
  nomineeName: string;
  probability: number; // 0-100 percentage
};

export type OddsMap = Record<
  string,
  {
    polymarket: number | null;
    kalshi: number | null;
  }
>;

export type OddsResponse = {
  odds: OddsMap;
  fetchedAt: string; // ISO timestamp
};
