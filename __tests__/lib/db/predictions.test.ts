import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockPoolMember, mockPrediction, mockPool, mockCategory } = vi.hoisted(() => ({
  mockPoolMember: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  mockPrediction: {
    upsert: vi.fn(),
    findMany: vi.fn(),
  },
  mockPool: {
    findUniqueOrThrow: vi.fn(),
  },
  mockCategory: {
    count: vi.fn(),
  },
}))

vi.mock("@/lib/db/client", () => ({
  prisma: {
    poolMember: mockPoolMember,
    prediction: mockPrediction,
    pool: mockPool,
    category: mockCategory,
  },
}))

import {
  getPoolMemberByUserAndPool,
  upsertPrediction,
  getPredictionsByPool,
} from "@/lib/db/predictions"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getPoolMemberByUserAndPool", () => {
  it("returns pool member when found", async () => {
    const member = { id: "pm-1", leftAt: null }
    mockPoolMember.findUnique.mockResolvedValue(member)

    const result = await getPoolMemberByUserAndPool("user-1", "pool-1")

    expect(result).toEqual(member)
    expect(mockPoolMember.findUnique).toHaveBeenCalledWith({
      where: { poolId_userId: { poolId: "pool-1", userId: "user-1" } },
      select: { id: true, leftAt: true },
    })
  })

  it("returns null when member not found", async () => {
    mockPoolMember.findUnique.mockResolvedValue(null)

    const result = await getPoolMemberByUserAndPool("user-x", "pool-1")

    expect(result).toBeNull()
  })
})

describe("upsertPrediction", () => {
  it("creates or updates a prediction", async () => {
    const prediction = {
      id: "pred-1",
      poolMemberId: "pm-1",
      categoryId: "cat-1",
      firstChoiceId: "nom-a",
      runnerUpId: "nom-b",
    }
    mockPrediction.upsert.mockResolvedValue(prediction)

    const result = await upsertPrediction("pm-1", "cat-1", "nom-a", "nom-b")

    expect(result).toEqual(prediction)
    expect(mockPrediction.upsert).toHaveBeenCalledWith({
      where: {
        poolMemberId_categoryId: { poolMemberId: "pm-1", categoryId: "cat-1" },
      },
      create: {
        poolMemberId: "pm-1",
        categoryId: "cat-1",
        firstChoiceId: "nom-a",
        runnerUpId: "nom-b",
      },
      update: {
        firstChoiceId: "nom-a",
        runnerUpId: "nom-b",
      },
    })
  })
})

describe("getPredictionsByPool", () => {
  const setupMocks = (
    locked: boolean,
    members: Array<{ id: string; userId: string }>,
    resultCount = 0
  ) => {
    mockPool.findUniqueOrThrow.mockResolvedValue({
      ceremonyYearId: "cy-1",
      ceremonyYear: { predictionsLocked: locked },
    })
    mockCategory.count.mockResolvedValue(resultCount)
    mockPoolMember.findMany.mockResolvedValue(
      members.map((m) => ({
        ...m,
        leftAt: null,
        user: { id: m.userId, name: `User ${m.userId}`, image: null },
      }))
    )
    mockPrediction.findMany.mockResolvedValue([])
  }

  it("returns all members predictions when locked", async () => {
    const members = [
      { id: "pm-1", userId: "user-1" },
      { id: "pm-2", userId: "user-2" },
      { id: "pm-3", userId: "user-3" },
    ]
    setupMocks(true, members)

    const result = await getPredictionsByPool("pool-1", "user-1")

    expect(result.predictionsLocked).toBe(true)
    // Should query predictions for all member IDs
    expect(mockPrediction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          poolMemberId: { in: ["pm-1", "pm-2", "pm-3"] },
        },
      })
    )
  })

  it("returns only requesting user predictions when unlocked", async () => {
    const members = [
      { id: "pm-1", userId: "user-1" },
      { id: "pm-2", userId: "user-2" },
    ]
    setupMocks(false, members)

    const result = await getPredictionsByPool("pool-1", "user-1")

    expect(result.predictionsLocked).toBe(false)
    // Should only query predictions for the requesting user's member ID
    expect(mockPrediction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          poolMemberId: { in: ["pm-1"] },
        },
      })
    )
  })

  it("returns empty visible predictions when unlocked and user is not a member", async () => {
    const members = [
      { id: "pm-1", userId: "user-1" },
      { id: "pm-2", userId: "user-2" },
    ]
    setupMocks(false, members)

    await getPredictionsByPool("pool-1", "user-other")

    expect(mockPrediction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          poolMemberId: { in: [] },
        },
      })
    )
  })

  it("returns all members predictions when unlocked but results exist", async () => {
    const members = [
      { id: "pm-1", userId: "user-1" },
      { id: "pm-2", userId: "user-2" },
    ]
    setupMocks(false, members, 5) // 5 results set

    const result = await getPredictionsByPool("pool-1", "user-1")

    expect(result.predictionsLocked).toBe(false)
    expect(result.hasAnyResults).toBe(true)
    // Should query predictions for all member IDs since results are being announced
    expect(mockPrediction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          poolMemberId: { in: ["pm-1", "pm-2"] },
        },
      })
    )
  })

  it("returns members list alongside predictions", async () => {
    const members = [{ id: "pm-1", userId: "user-1" }]
    setupMocks(true, members)

    const result = await getPredictionsByPool("pool-1", "user-1")

    expect(result.members).toHaveLength(1)
    expect(result.predictions).toBeDefined()
  })
})
