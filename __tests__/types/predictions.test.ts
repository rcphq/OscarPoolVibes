import { describe, it, expect } from "vitest"
import { predictionInputSchema, savePredictionsSchema } from "@/types/predictions"

// Helper to generate a valid CUID-like string for testing
// CUIDs match pattern: starts with 'c', followed by lowercase alphanumeric chars
const cuid = (suffix: string) => `clrandomid${suffix}00000000`

describe("predictionInputSchema", () => {
  it("accepts valid input with different firstChoice and runnerUp", () => {
    const input = {
      categoryId: cuid("cat"),
      firstChoiceId: cuid("nom1"),
      runnerUpId: cuid("nom2"),
    }

    const result = predictionInputSchema.safeParse(input)

    expect(result.success).toBe(true)
  })

  it("rejects when firstChoice equals runnerUp", () => {
    const sameId = cuid("same")
    const input = {
      categoryId: cuid("cat"),
      firstChoiceId: sameId,
      runnerUpId: sameId,
    }

    const result = predictionInputSchema.safeParse(input)

    expect(result.success).toBe(false)
    if (!result.success) {
      const runnerUpError = result.error.issues.find(
        (issue) => issue.path.includes("runnerUpId")
      )
      expect(runnerUpError).toBeDefined()
      expect(runnerUpError?.message).toBe("First choice and runner-up must be different")
    }
  })

  it("rejects missing categoryId", () => {
    const input = {
      firstChoiceId: cuid("nom1"),
      runnerUpId: cuid("nom2"),
    }

    const result = predictionInputSchema.safeParse(input)

    expect(result.success).toBe(false)
  })

  it("rejects invalid CUID format", () => {
    const input = {
      categoryId: "not-a-cuid",
      firstChoiceId: cuid("nom1"),
      runnerUpId: cuid("nom2"),
    }

    const result = predictionInputSchema.safeParse(input)

    expect(result.success).toBe(false)
  })
})

describe("savePredictionsSchema", () => {
  it("accepts valid input with predictions array", () => {
    const input = {
      poolId: cuid("pool"),
      predictions: [
        {
          categoryId: cuid("cat1"),
          firstChoiceId: cuid("nom1"),
          runnerUpId: cuid("nom2"),
        },
        {
          categoryId: cuid("cat2"),
          firstChoiceId: cuid("nom3"),
          runnerUpId: cuid("nom4"),
        },
      ],
    }

    const result = savePredictionsSchema.safeParse(input)

    expect(result.success).toBe(true)
  })

  it("accepts empty predictions array", () => {
    const input = {
      poolId: cuid("pool"),
      predictions: [],
    }

    const result = savePredictionsSchema.safeParse(input)

    expect(result.success).toBe(true)
  })

  it("rejects missing poolId", () => {
    const input = {
      predictions: [],
    }

    const result = savePredictionsSchema.safeParse(input)

    expect(result.success).toBe(false)
  })

  it("rejects invalid poolId format", () => {
    const input = {
      poolId: "not-valid",
      predictions: [],
    }

    const result = savePredictionsSchema.safeParse(input)

    expect(result.success).toBe(false)
  })

  it("rejects when a prediction has matching firstChoice and runnerUp", () => {
    const sameId = cuid("same")
    const input = {
      poolId: cuid("pool"),
      predictions: [
        {
          categoryId: cuid("cat1"),
          firstChoiceId: sameId,
          runnerUpId: sameId,
        },
      ],
    }

    const result = savePredictionsSchema.safeParse(input)

    expect(result.success).toBe(false)
  })
})
