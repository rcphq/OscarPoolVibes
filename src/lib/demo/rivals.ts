import { DEMO_CATEGORIES, getWinner } from "./oscar-data";
import { scorePredictions } from "./scoring";
import type { Prediction } from "./scoring";
import type { PlayerScore } from "./scoring";

/**
 * Simulated rival players for the demo pool.
 * Each rival has a "skill level" that determines how often they pick the winner.
 * Predictions are deterministic (seeded by rival name) so they're stable across renders.
 */

type RivalConfig = {
  name: string;
  /** Probability of picking the winner as first choice (0-1) */
  firstChoiceAccuracy: number;
  /** Probability of picking the winner as runner-up when first choice is wrong */
  runnerUpAccuracy: number;
};

const RIVAL_CONFIGS: RivalConfig[] = [
  { name: "FilmBuff_Sarah", firstChoiceAccuracy: 0.7, runnerUpAccuracy: 0.5 },
  { name: "CinemaKing_Mike", firstChoiceAccuracy: 0.55, runnerUpAccuracy: 0.4 },
  { name: "MovieNerd_Priya", firstChoiceAccuracy: 0.6, runnerUpAccuracy: 0.45 },
  { name: "OscarOracle_Jen", firstChoiceAccuracy: 0.75, runnerUpAccuracy: 0.6 },
  { name: "PopcornPete", firstChoiceAccuracy: 0.35, runnerUpAccuracy: 0.3 },
  { name: "Reel_Talk_Dan", firstChoiceAccuracy: 0.5, runnerUpAccuracy: 0.35 },
  { name: "AwardsSeason_Liz", firstChoiceAccuracy: 0.65, runnerUpAccuracy: 0.5 },
];

/**
 * Simple seeded PRNG for deterministic rival predictions.
 * Uses a string hash as seed.
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };
}

function generateRivalPredictions(config: RivalConfig): Prediction[] {
  const rng = seededRandom(config.name + "_2025");

  return DEMO_CATEGORIES.map((category) => {
    const winner = getWinner(category);
    const others = category.nominees.filter((n) => !n.isWinner);
    const picksWinnerFirst = rng() < config.firstChoiceAccuracy;

    let firstChoiceId: string;
    let runnerUpId: string;

    if (picksWinnerFirst) {
      // First choice is the winner; runner-up is random other
      firstChoiceId = winner.id;
      runnerUpId = others.length > 0
        ? others[Math.floor(rng() * others.length)].id
        : winner.id;
    } else {
      // First choice is random non-winner
      firstChoiceId = others.length > 0
        ? others[Math.floor(rng() * others.length)].id
        : winner.id;

      // Runner-up might be the winner
      if (rng() < config.runnerUpAccuracy) {
        runnerUpId = winner.id;
      } else {
        // Runner-up is another non-winner (different from first choice)
        const remaining = others.filter((n) => n.id !== firstChoiceId);
        runnerUpId =
          remaining.length > 0
            ? remaining[Math.floor(rng() * remaining.length)].id
            : others.length > 0 ? others[0].id : winner.id;
      }
    }

    return { categoryId: category.id, firstChoiceId, runnerUpId };
  });
}

/** Get scored results for all rival players */
export function getRivalScores(): PlayerScore[] {
  return RIVAL_CONFIGS.map((config) => {
    const predictions = generateRivalPredictions(config);
    return scorePredictions(predictions, config.name);
  });
}
