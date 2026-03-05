import {
  type ScoringInput,
  type CategoryScore,
  calculateTotalScore,
} from "./calculate-score"

export type LeaderboardEntry = {
  poolMemberId: string
  userId: string
  userName: string | null
  userImage: string | null
  totalScore: number
  rank: number
  breakdown: CategoryScore[]
  correctFirstChoices: number
  correctRunnerUps: number
}

export type LeaderboardInput = {
  poolMemberId: string
  userId: string
  userName: string | null
  userImage: string | null
  predictions: ScoringInput[]
}

export function calculateLeaderboard(
  members: LeaderboardInput[]
): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = members.map((member) => {
    const { total, breakdown } = calculateTotalScore(member.predictions)
    const correctFirstChoices = breakdown.filter(
      (c) => c.isFirstChoiceCorrect
    ).length
    const correctRunnerUps = breakdown.filter(
      (c) => c.isRunnerUpCorrect
    ).length

    return {
      poolMemberId: member.poolMemberId,
      userId: member.userId,
      userName: member.userName,
      userImage: member.userImage,
      totalScore: total,
      rank: 0,
      breakdown,
      correctFirstChoices,
      correctRunnerUps,
    }
  })

  // Sort by totalScore descending
  entries.sort((a, b) => b.totalScore - a.totalScore)

  // Assign ranks with ties (dense ranking with skips)
  if (entries.length > 0) {
    entries[0].rank = 1
    for (let i = 1; i < entries.length; i++) {
      if (entries[i].totalScore === entries[i - 1].totalScore) {
        entries[i].rank = entries[i - 1].rank
      } else {
        entries[i].rank = i + 1
      }
    }
  }

  return entries
}
