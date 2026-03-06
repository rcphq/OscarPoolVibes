import { DEMO_CATEGORIES, MAX_POSSIBLE_POINTS, getWinner } from "./oscar-data";
import type { DemoCategory } from "./oscar-data";

const RUNNER_UP_MULTIPLIER = 0.5;

export type Prediction = {
  categoryId: string;
  firstChoiceId: string;
  runnerUpId: string;
};

export type CategoryScore = {
  categoryId: string;
  categoryName: string;
  pointValue: number;
  earnedPoints: number;
  winnerId: string;
  winnerName: string;
  firstChoiceId: string;
  firstChoiceName: string;
  runnerUpId: string;
  runnerUpName: string;
  firstChoiceCorrect: boolean;
  runnerUpCorrect: boolean;
};

export type PlayerScore = {
  name: string;
  totalPoints: number;
  maxPossible: number;
  correctFirstChoices: number;
  correctRunnerUps: number;
  categoryScores: CategoryScore[];
};

export function scorePredictions(
  predictions: Prediction[],
  playerName: string
): PlayerScore {
  const categoryScores: CategoryScore[] = DEMO_CATEGORIES.map((category) => {
    const prediction = predictions.find((p) => p.categoryId === category.id);
    const winner = getWinner(category);

    if (!prediction) {
      return emptyCategoryScore(category, winner);
    }

    const firstChoiceCorrect = prediction.firstChoiceId === winner.id;
    const runnerUpCorrect =
      !firstChoiceCorrect && prediction.runnerUpId === winner.id;

    let earnedPoints = 0;
    if (firstChoiceCorrect) {
      earnedPoints = category.pointValue;
    } else if (runnerUpCorrect) {
      earnedPoints = Math.round(category.pointValue * RUNNER_UP_MULTIPLIER);
    }

    const firstName =
      category.nominees.find((n) => n.id === prediction.firstChoiceId)?.name ??
      "—";
    const runnerUpName =
      category.nominees.find((n) => n.id === prediction.runnerUpId)?.name ?? "—";

    return {
      categoryId: category.id,
      categoryName: category.name,
      pointValue: category.pointValue,
      earnedPoints,
      winnerId: winner.id,
      winnerName: winner.name,
      firstChoiceId: prediction.firstChoiceId,
      firstChoiceName: firstName,
      runnerUpId: prediction.runnerUpId,
      runnerUpName: runnerUpName,
      firstChoiceCorrect,
      runnerUpCorrect,
    };
  });

  return {
    name: playerName,
    totalPoints: categoryScores.reduce((s, c) => s + c.earnedPoints, 0),
    maxPossible: MAX_POSSIBLE_POINTS,
    correctFirstChoices: categoryScores.filter((c) => c.firstChoiceCorrect)
      .length,
    correctRunnerUps: categoryScores.filter((c) => c.runnerUpCorrect).length,
    categoryScores,
  };
}

function emptyCategoryScore(
  category: DemoCategory,
  winner: { id: string; name: string }
): CategoryScore {
  return {
    categoryId: category.id,
    categoryName: category.name,
    pointValue: category.pointValue,
    earnedPoints: 0,
    winnerId: winner.id,
    winnerName: winner.name,
    firstChoiceId: "",
    firstChoiceName: "—",
    runnerUpId: "",
    runnerUpName: "—",
    firstChoiceCorrect: false,
    runnerUpCorrect: false,
  };
}
