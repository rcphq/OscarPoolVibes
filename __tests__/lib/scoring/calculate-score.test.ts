import { describe, it, expect } from "vitest"
import {
  calculateCategoryScore,
  calculateTotalScore,
  type ScoringInput,
} from "@/lib/scoring/calculate-score"

function makeInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    categoryId: "cat-1",
    categoryName: "Best Picture",
    pointValue: 10,
    runnerUpMultiplier: 0.6,
    winnerId: "nominee-a",
    tiedWinnerId: null,
    firstChoiceId: "nominee-a",
    runnerUpId: "nominee-b",
    ...overrides,
  }
}

describe("calculateCategoryScore", () => {
  it("awards full points when firstChoice matches winner", () => {
    const result = calculateCategoryScore(
      makeInput({ winnerId: "nominee-a", firstChoiceId: "nominee-a" })
    )
    expect(result.points).toBe(10)
    expect(result.isFirstChoiceCorrect).toBe(true)
    expect(result.isRunnerUpCorrect).toBe(false)
  })

  it("awards runner-up points when runnerUp matches winner", () => {
    const result = calculateCategoryScore(
      makeInput({
        winnerId: "nominee-b",
        firstChoiceId: "nominee-a",
        runnerUpId: "nominee-b",
      })
    )
    expect(result.points).toBe(6)
    expect(result.isFirstChoiceCorrect).toBe(false)
    expect(result.isRunnerUpCorrect).toBe(true)
  })

  it("awards 0 points when neither choice matches winner", () => {
    const result = calculateCategoryScore(
      makeInput({
        winnerId: "nominee-c",
        firstChoiceId: "nominee-a",
        runnerUpId: "nominee-b",
      })
    )
    expect(result.points).toBe(0)
    expect(result.isFirstChoiceCorrect).toBe(false)
    expect(result.isRunnerUpCorrect).toBe(false)
  })

  it("awards 0 points when winner is not yet announced (null)", () => {
    const result = calculateCategoryScore(
      makeInput({ winnerId: null })
    )
    expect(result.points).toBe(0)
    expect(result.isFirstChoiceCorrect).toBe(false)
    expect(result.isRunnerUpCorrect).toBe(false)
  })

  it("uses custom pointValue (e.g. 15 for Best Picture)", () => {
    const result = calculateCategoryScore(
      makeInput({ pointValue: 15, winnerId: "nominee-a", firstChoiceId: "nominee-a" })
    )
    expect(result.points).toBe(15)
  })

  it("uses custom runnerUpMultiplier", () => {
    const result = calculateCategoryScore(
      makeInput({
        pointValue: 20,
        runnerUpMultiplier: 0.25,
        winnerId: "nominee-b",
        firstChoiceId: "nominee-a",
        runnerUpId: "nominee-b",
      })
    )
    expect(result.points).toBe(5) // 20 * 0.25
    expect(result.isRunnerUpCorrect).toBe(true)
  })

  it("prioritizes firstChoice over runnerUp when both match winner", () => {
    const result = calculateCategoryScore(
      makeInput({
        winnerId: "nominee-a",
        firstChoiceId: "nominee-a",
        runnerUpId: "nominee-a",
      })
    )
    expect(result.points).toBe(10)
    expect(result.isFirstChoiceCorrect).toBe(true)
    expect(result.isRunnerUpCorrect).toBe(false)
  })

  it("passes through all input fields in the result", () => {
    const result = calculateCategoryScore(
      makeInput({ categoryId: "cat-99", categoryName: "Best Director" })
    )
    expect(result.categoryId).toBe("cat-99")
    expect(result.categoryName).toBe("Best Director")
  })
})

describe("calculateTotalScore", () => {
  it("sums points across multiple categories", () => {
    const categories: ScoringInput[] = [
      makeInput({ categoryId: "1", winnerId: "nominee-a", firstChoiceId: "nominee-a" }), // 10
      makeInput({ categoryId: "2", winnerId: "nominee-b", firstChoiceId: "nominee-a", runnerUpId: "nominee-b" }), // 6
      makeInput({ categoryId: "3", winnerId: "nominee-c", firstChoiceId: "nominee-a", runnerUpId: "nominee-b" }), // 0
    ]
    const { total, breakdown } = calculateTotalScore(categories)
    expect(total).toBe(16)
    expect(breakdown).toHaveLength(3)
  })

  it("returns 0 total for empty categories", () => {
    const { total, breakdown } = calculateTotalScore([])
    expect(total).toBe(0)
    expect(breakdown).toHaveLength(0)
  })

  it("returns 0 total when all winners are unannounced", () => {
    const categories: ScoringInput[] = [
      makeInput({ winnerId: null }),
      makeInput({ winnerId: null }),
    ]
    const { total } = calculateTotalScore(categories)
    expect(total).toBe(0)
  })

  it("handles mix of custom point values", () => {
    const categories: ScoringInput[] = [
      makeInput({ pointValue: 15, winnerId: "nominee-a", firstChoiceId: "nominee-a" }), // 15
      makeInput({ pointValue: 5, winnerId: "nominee-b", firstChoiceId: "nominee-a", runnerUpId: "nominee-b" }), // 3
    ]
    const { total } = calculateTotalScore(categories)
    expect(total).toBe(18)
  })
})

// ─── Tied Winner Tests ──────────────────────────────────────────────────────

describe("calculateCategoryScore — tied categories", () => {
  // A category where nominee-a and nominee-c share the award (tie)
  const tieInput = (overrides: Partial<ScoringInput> = {}) =>
    makeInput({ winnerId: "nominee-a", tiedWinnerId: "nominee-c", ...overrides })

  it("awards full points when firstChoice matches the primary tied winner", () => {
    const result = calculateCategoryScore(
      tieInput({ firstChoiceId: "nominee-a", runnerUpId: "nominee-b" })
    )
    expect(result.points).toBe(10)
    expect(result.isFirstChoiceCorrect).toBe(true)
    expect(result.isRunnerUpCorrect).toBe(false)
  })

  it("awards full points when firstChoice matches the secondary tied winner", () => {
    const result = calculateCategoryScore(
      tieInput({ firstChoiceId: "nominee-c", runnerUpId: "nominee-b" })
    )
    expect(result.points).toBe(10)
    expect(result.isFirstChoiceCorrect).toBe(true)
    expect(result.isRunnerUpCorrect).toBe(false)
  })

  it("awards runner-up points when runnerUp matches the primary tied winner", () => {
    const result = calculateCategoryScore(
      tieInput({ firstChoiceId: "nominee-b", runnerUpId: "nominee-a" })
    )
    expect(result.points).toBe(6) // 10 * 0.6
    expect(result.isFirstChoiceCorrect).toBe(false)
    expect(result.isRunnerUpCorrect).toBe(true)
  })

  it("awards runner-up points when runnerUp matches the secondary tied winner", () => {
    const result = calculateCategoryScore(
      tieInput({ firstChoiceId: "nominee-b", runnerUpId: "nominee-c" })
    )
    expect(result.points).toBe(6)
    expect(result.isFirstChoiceCorrect).toBe(false)
    expect(result.isRunnerUpCorrect).toBe(true)
  })

  it("awards 0 points when neither choice matches either tied winner", () => {
    const result = calculateCategoryScore(
      tieInput({ firstChoiceId: "nominee-b", runnerUpId: "nominee-d" })
    )
    expect(result.points).toBe(0)
    expect(result.isFirstChoiceCorrect).toBe(false)
    expect(result.isRunnerUpCorrect).toBe(false)
  })

  it("tiedWinnerId: null behaves identically to a normal (non-tied) result", () => {
    const tied = calculateCategoryScore(
      makeInput({ winnerId: "nominee-a", tiedWinnerId: null, firstChoiceId: "nominee-a" })
    )
    const normal = calculateCategoryScore(
      makeInput({ winnerId: "nominee-a", firstChoiceId: "nominee-a" })
    )
    expect(tied.points).toBe(normal.points)
    expect(tied.isFirstChoiceCorrect).toBe(normal.isFirstChoiceCorrect)
  })

  it("awards 0 points when winnerId is null even if tiedWinnerId is set", () => {
    // Edge case: should never happen in practice (can't have a tied winner without a primary)
    // but the scoring function should handle it gracefully
    const result = calculateCategoryScore(
      makeInput({ winnerId: null, tiedWinnerId: "nominee-c", firstChoiceId: "nominee-c" })
    )
    expect(result.points).toBe(0)
    expect(result.isFirstChoiceCorrect).toBe(false)
  })

  it("passes tiedWinnerId through in the result", () => {
    const result = calculateCategoryScore(
      tieInput({ firstChoiceId: "nominee-a" })
    )
    expect(result.tiedWinnerId).toBe("nominee-c")
  })
})
