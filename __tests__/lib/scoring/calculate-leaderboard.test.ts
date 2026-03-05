import { describe, it, expect } from "vitest"
import {
  calculateLeaderboard,
  type LeaderboardInput,
} from "@/lib/scoring/calculate-leaderboard"
import { type ScoringInput } from "@/lib/scoring/calculate-score"

function makePrediction(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    categoryId: "cat-1",
    categoryName: "Best Picture",
    pointValue: 10,
    runnerUpMultiplier: 0.5,
    winnerId: "nominee-a",
    firstChoiceId: "nominee-a",
    runnerUpId: "nominee-b",
    ...overrides,
  }
}

function makeMember(overrides: Partial<LeaderboardInput> = {}): LeaderboardInput {
  return {
    poolMemberId: "pm-1",
    userId: "user-1",
    userName: "Alice",
    userImage: null,
    predictions: [],
    ...overrides,
  }
}

describe("calculateLeaderboard", () => {
  it("ranks members by highest score first", () => {
    const members: LeaderboardInput[] = [
      makeMember({
        poolMemberId: "pm-1",
        userId: "user-1",
        userName: "Alice",
        predictions: [
          makePrediction({ winnerId: "nominee-a", firstChoiceId: "nominee-a" }), // 10
        ],
      }),
      makeMember({
        poolMemberId: "pm-2",
        userId: "user-2",
        userName: "Bob",
        predictions: [
          makePrediction({ winnerId: "nominee-a", firstChoiceId: "nominee-a" }), // 10
          makePrediction({
            categoryId: "cat-2",
            winnerId: "nominee-a",
            firstChoiceId: "nominee-a",
          }), // 10
        ],
      }),
    ]
    const leaderboard = calculateLeaderboard(members)
    expect(leaderboard[0].userName).toBe("Bob")
    expect(leaderboard[0].totalScore).toBe(20)
    expect(leaderboard[0].rank).toBe(1)
    expect(leaderboard[1].userName).toBe("Alice")
    expect(leaderboard[1].totalScore).toBe(10)
    expect(leaderboard[1].rank).toBe(2)
  })

  it("assigns same rank to tied scores, then skips", () => {
    const members: LeaderboardInput[] = [
      makeMember({
        poolMemberId: "pm-1",
        userId: "user-1",
        userName: "Alice",
        predictions: [
          makePrediction({ winnerId: "nominee-a", firstChoiceId: "nominee-a" }), // 10
        ],
      }),
      makeMember({
        poolMemberId: "pm-2",
        userId: "user-2",
        userName: "Bob",
        predictions: [
          makePrediction({ winnerId: "nominee-a", firstChoiceId: "nominee-a" }), // 10
        ],
      }),
      makeMember({
        poolMemberId: "pm-3",
        userId: "user-3",
        userName: "Charlie",
        predictions: [
          makePrediction({
            winnerId: "nominee-b",
            firstChoiceId: "nominee-a",
            runnerUpId: "nominee-b",
          }), // 5
        ],
      }),
    ]
    const leaderboard = calculateLeaderboard(members)
    expect(leaderboard[0].rank).toBe(1)
    expect(leaderboard[1].rank).toBe(1)
    expect(leaderboard[2].rank).toBe(3) // skips rank 2
  })

  it("handles empty predictions (0 score)", () => {
    const members: LeaderboardInput[] = [
      makeMember({ poolMemberId: "pm-1", predictions: [] }),
    ]
    const leaderboard = calculateLeaderboard(members)
    expect(leaderboard[0].totalScore).toBe(0)
    expect(leaderboard[0].correctFirstChoices).toBe(0)
    expect(leaderboard[0].correctRunnerUps).toBe(0)
    expect(leaderboard[0].breakdown).toHaveLength(0)
  })

  it("returns all zeros when all winners are unannounced", () => {
    const members: LeaderboardInput[] = [
      makeMember({
        poolMemberId: "pm-1",
        predictions: [
          makePrediction({ winnerId: null }),
          makePrediction({ categoryId: "cat-2", winnerId: null }),
        ],
      }),
      makeMember({
        poolMemberId: "pm-2",
        userId: "user-2",
        predictions: [
          makePrediction({ winnerId: null }),
        ],
      }),
    ]
    const leaderboard = calculateLeaderboard(members)
    expect(leaderboard[0].totalScore).toBe(0)
    expect(leaderboard[1].totalScore).toBe(0)
    expect(leaderboard[0].rank).toBe(1)
    expect(leaderboard[1].rank).toBe(1) // tied at 0
  })

  it("handles a single member", () => {
    const members: LeaderboardInput[] = [
      makeMember({
        poolMemberId: "pm-1",
        predictions: [
          makePrediction({ winnerId: "nominee-a", firstChoiceId: "nominee-a" }),
        ],
      }),
    ]
    const leaderboard = calculateLeaderboard(members)
    expect(leaderboard).toHaveLength(1)
    expect(leaderboard[0].rank).toBe(1)
    expect(leaderboard[0].totalScore).toBe(10)
  })

  it("counts correctFirstChoices and correctRunnerUps accurately", () => {
    const members: LeaderboardInput[] = [
      makeMember({
        poolMemberId: "pm-1",
        predictions: [
          makePrediction({
            categoryId: "cat-1",
            winnerId: "nominee-a",
            firstChoiceId: "nominee-a",
          }), // first choice correct
          makePrediction({
            categoryId: "cat-2",
            winnerId: "nominee-b",
            firstChoiceId: "nominee-a",
            runnerUpId: "nominee-b",
          }), // runner-up correct
          makePrediction({
            categoryId: "cat-3",
            winnerId: "nominee-c",
            firstChoiceId: "nominee-a",
            runnerUpId: "nominee-b",
          }), // neither
          makePrediction({
            categoryId: "cat-4",
            winnerId: null,
          }), // unannounced
        ],
      }),
    ]
    const leaderboard = calculateLeaderboard(members)
    expect(leaderboard[0].correctFirstChoices).toBe(1)
    expect(leaderboard[0].correctRunnerUps).toBe(1)
    expect(leaderboard[0].totalScore).toBe(15) // 10 + 5
  })

  it("returns empty array for no members", () => {
    const leaderboard = calculateLeaderboard([])
    expect(leaderboard).toHaveLength(0)
  })

  it("preserves user profile info in output", () => {
    const members: LeaderboardInput[] = [
      makeMember({
        poolMemberId: "pm-1",
        userId: "user-1",
        userName: "Alice",
        userImage: "https://example.com/alice.jpg",
        predictions: [],
      }),
    ]
    const leaderboard = calculateLeaderboard(members)
    expect(leaderboard[0].poolMemberId).toBe("pm-1")
    expect(leaderboard[0].userId).toBe("user-1")
    expect(leaderboard[0].userName).toBe("Alice")
    expect(leaderboard[0].userImage).toBe("https://example.com/alice.jpg")
  })
})
