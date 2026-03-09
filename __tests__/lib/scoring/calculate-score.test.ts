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
