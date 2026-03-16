/**
 * Core scoring logic for OscarPoolVibes.
 *
 * Scoring rules (canonical definition in docs/SCHEMA.md):
 *   - First choice matches winner → full pointValue
 *   - Runner-up matches winner    → Math.round(pointValue * runnerUpMultiplier)
 *   - No match / no winner yet   → 0
 *
 * Ties: when a category has two winners (tiedWinnerId is set), a prediction
 * scores if it matches *either* winner. Both winners award the same points —
 * full points for a first-choice match, multiplied points for a runner-up match.
 */

export type ScoringInput = {
  categoryId: string
  categoryName: string
  pointValue: number
  runnerUpMultiplier: number
  /** Null when the winner has not yet been announced. */
  winnerId: string | null
  /** Null for normal (non-tied) categories. Set when the category is a tie. */
  tiedWinnerId: string | null
  firstChoiceId: string
  runnerUpId: string
}

export type CategoryScore = {
  categoryId: string
  categoryName: string
  pointValue: number
  runnerUpMultiplier: number
  winnerId: string | null
  tiedWinnerId: string | null
  firstChoiceId: string
  runnerUpId: string
  points: number
  isFirstChoiceCorrect: boolean
  isRunnerUpCorrect: boolean
}

export function calculateCategoryScore(input: ScoringInput): CategoryScore {
  const {
    categoryId,
    categoryName,
    pointValue,
    runnerUpMultiplier,
    winnerId,
    tiedWinnerId,
    firstChoiceId,
    runnerUpId,
  } = input

  let points = 0
  let isFirstChoiceCorrect = false
  let isRunnerUpCorrect = false

  if (winnerId !== null) {
    // For tied categories, a prediction scores if it matches *either* winner.
    const firstChoiceWins =
      firstChoiceId === winnerId || firstChoiceId === tiedWinnerId
    const runnerUpWins =
      runnerUpId === winnerId || runnerUpId === tiedWinnerId

    if (firstChoiceWins) {
      points = pointValue
      isFirstChoiceCorrect = true
    } else if (runnerUpWins) {
      // Math.round prevents floating-point imprecision (e.g. 180 * 0.6 → 107.99…)
      points = Math.round(pointValue * runnerUpMultiplier)
      isRunnerUpCorrect = true
    }
  }

  return {
    categoryId,
    categoryName,
    pointValue,
    runnerUpMultiplier,
    winnerId,
    tiedWinnerId,
    firstChoiceId,
    runnerUpId,
    points,
    isFirstChoiceCorrect,
    isRunnerUpCorrect,
  }
}

export function calculateTotalScore(categories: ScoringInput[]): {
  total: number
  breakdown: CategoryScore[]
} {
  const breakdown = categories.map(calculateCategoryScore)
  const total = breakdown.reduce((sum, cat) => sum + cat.points, 0)
  return { total, breakdown }
}
