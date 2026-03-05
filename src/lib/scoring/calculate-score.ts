export type ScoringInput = {
  categoryId: string
  categoryName: string
  pointValue: number
  runnerUpMultiplier: number
  winnerId: string | null
  firstChoiceId: string
  runnerUpId: string
}

export type CategoryScore = {
  categoryId: string
  categoryName: string
  pointValue: number
  runnerUpMultiplier: number
  winnerId: string | null
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
    firstChoiceId,
    runnerUpId,
  } = input

  let points = 0
  let isFirstChoiceCorrect = false
  let isRunnerUpCorrect = false

  if (winnerId !== null) {
    if (firstChoiceId === winnerId) {
      points = pointValue
      isFirstChoiceCorrect = true
    } else if (runnerUpId === winnerId) {
      points = pointValue * runnerUpMultiplier
      isRunnerUpCorrect = true
    }
  }

  return {
    categoryId,
    categoryName,
    pointValue,
    runnerUpMultiplier,
    winnerId,
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
