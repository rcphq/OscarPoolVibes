import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }))

import { getResultsByCeremony, getResultByCategory } from "@/lib/results/get-results"

const CEREMONY_ID = "cy-1"
const CAT_ID = "cat-1"

function makeCategory(overrides: Partial<{
  id: string
  name: string
  results: Array<{
    winnerId: string
    tiedWinnerId: string | null
    version: number
    updatedAt: Date
    winner: { name: string }
    tiedWinner: { name: string } | null
    setBy: { name: string }
  }>
}> = {}) {
  return {
    id: CAT_ID,
    name: "Best Picture",
    displayOrder: 1,
    results: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getResultsByCeremony", () => {
  it("returns empty array when no categories exist", async () => {
    mockPrisma.category.findMany.mockResolvedValue([])
    const result = await getResultsByCeremony(CEREMONY_ID)
    expect(result).toEqual([])
  })

  it("returns categories with null winner when no result set", async () => {
    mockPrisma.category.findMany.mockResolvedValue([makeCategory()])
    const result = await getResultsByCeremony(CEREMONY_ID)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      categoryId: CAT_ID,
      categoryName: "Best Picture",
      winnerId: null,
      winnerName: null,
      tiedWinnerId: null,
      tiedWinnerName: null,
      setByName: null,
      version: 0,
      updatedAt: null,
    })
  })

  it("returns winner details when result is set (no tie)", async () => {
    const updatedAt = new Date("2026-03-10T20:00:00Z")
    mockPrisma.category.findMany.mockResolvedValue([
      makeCategory({
        results: [
          {
            winnerId: "nom-1",
            tiedWinnerId: null,
            version: 2,
            updatedAt,
            winner: { name: "Oppenheimer" },
            tiedWinner: null,
            setBy: { name: "Alice" },
          },
        ],
      }),
    ])
    const result = await getResultsByCeremony(CEREMONY_ID)
    expect(result[0]).toMatchObject({
      winnerId: "nom-1",
      winnerName: "Oppenheimer",
      tiedWinnerId: null,
      tiedWinnerName: null,
      setByName: "Alice",
      version: 2,
      updatedAt: updatedAt.toISOString(),
    })
  })

  it("returns results in display order", async () => {
    mockPrisma.category.findMany.mockResolvedValue([
      makeCategory({ id: "cat-1", name: "Best Picture" }),
      makeCategory({ id: "cat-2", name: "Best Director" }),
    ])
    const result = await getResultsByCeremony(CEREMONY_ID)
    expect(result.map((r) => r.categoryId)).toEqual(["cat-1", "cat-2"])
    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { displayOrder: "asc" },
      })
    )
  })

  it("queries for the correct ceremony year", async () => {
    mockPrisma.category.findMany.mockResolvedValue([])
    await getResultsByCeremony("cy-42")
    expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ceremonyYearId: "cy-42" } })
    )
  })
})

describe("getResultByCategory", () => {
  it("returns null when category does not exist", async () => {
    mockPrisma.category.findUnique.mockResolvedValue(null)
    const result = await getResultByCategory("cat-missing")
    expect(result).toBeNull()
  })

  it("returns category with null winner when no result set", async () => {
    mockPrisma.category.findUnique.mockResolvedValue(makeCategory())
    const result = await getResultByCategory(CAT_ID)
    expect(result).toMatchObject({
      categoryId: CAT_ID,
      winnerId: null,
      version: 0,
    })
  })

  it("returns full result view when winner is set (no tie)", async () => {
    const updatedAt = new Date("2026-03-10T20:00:00Z")
    mockPrisma.category.findUnique.mockResolvedValue(
      makeCategory({
        results: [
          {
            winnerId: "nom-1",
            tiedWinnerId: null,
            version: 1,
            updatedAt,
            winner: { name: "Best Film" },
            tiedWinner: null,
            setBy: { name: "Bob" },
          },
        ],
      })
    )
    const result = await getResultByCategory(CAT_ID)
    expect(result).toMatchObject({
      winnerId: "nom-1",
      winnerName: "Best Film",
      tiedWinnerId: null,
      tiedWinnerName: null,
      setByName: "Bob",
      version: 1,
    })
  })
})

// ─── Tied Winner Tests ──────────────────────────────────────────────────────

describe("getResultsByCeremony — tied categories", () => {
  it("returns tiedWinnerId and tiedWinnerName when result is a tie", async () => {
    const updatedAt = new Date("2026-03-10T20:00:00Z")
    mockPrisma.category.findMany.mockResolvedValue([
      makeCategory({
        results: [
          {
            winnerId: "nom-1",
            tiedWinnerId: "nom-2",
            version: 1,
            updatedAt,
            winner: { name: "Film One" },
            tiedWinner: { name: "Film Two" },
            setBy: { name: "Alice" },
          },
        ],
      }),
    ])
    const result = await getResultsByCeremony(CEREMONY_ID)
    expect(result[0]).toMatchObject({
      winnerId: "nom-1",
      winnerName: "Film One",
      tiedWinnerId: "nom-2",
      tiedWinnerName: "Film Two",
    })
  })

  it("returns tiedWinnerId: null and tiedWinnerName: null for non-tied results", async () => {
    const updatedAt = new Date("2026-03-10T20:00:00Z")
    mockPrisma.category.findMany.mockResolvedValue([
      makeCategory({
        results: [
          {
            winnerId: "nom-1",
            tiedWinnerId: null,
            version: 1,
            updatedAt,
            winner: { name: "Film One" },
            tiedWinner: null,
            setBy: { name: "Alice" },
          },
        ],
      }),
    ])
    const result = await getResultsByCeremony(CEREMONY_ID)
    expect(result[0].tiedWinnerId).toBeNull()
    expect(result[0].tiedWinnerName).toBeNull()
  })
})
