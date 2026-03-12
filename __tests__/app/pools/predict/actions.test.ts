import { describe, it, expect, vi, beforeEach } from "vitest"

const {
  mockAuth,
  mockGetPoolMember,
  mockUpsertPrediction,
  mockPrisma,
  mockRevalidatePath,
  mockTrack,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetPoolMember: vi.fn(),
  mockUpsertPrediction: vi.fn(),
  mockPrisma: {
    pool: { findUniqueOrThrow: vi.fn() },
    category: { findMany: vi.fn() },
  },
  mockRevalidatePath: vi.fn(),
  mockTrack: vi.fn(),
}))

vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/db/predictions", () => ({
  getPoolMemberByUserAndPool: mockGetPoolMember,
  upsertPrediction: mockUpsertPrediction,
}))
vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }))
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }))
vi.mock("@/lib/analytics/posthog-server", () => ({ trackServerEvent: mockTrack }))

import { savePredictions } from "@/app/pools/[id]/predict/actions"

// Valid CUIDs for testing
const POOL_ID = "clxxxxxxxxxxxxxxxxxxxxxx01"
const CAT_ID = "clxxxxxxxxxxxxxxxxxxxxxx02"
const NOM_A = "clxxxxxxxxxxxxxxxxxxxxxx03"
const NOM_B = "clxxxxxxxxxxxxxxxxxxxxxx04"

const validInput = {
  poolId: POOL_ID,
  predictions: [{ categoryId: CAT_ID, firstChoiceId: NOM_A, runnerUpId: NOM_B }],
}

const activeMember = { id: "member-1", leftAt: null }

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: "user-1" } })
  mockGetPoolMember.mockResolvedValue(activeMember)
  mockPrisma.pool.findUniqueOrThrow.mockResolvedValue({
    ceremonyYear: { predictionsLocked: false },
  })
  mockPrisma.category.findMany.mockResolvedValue([
    { id: CAT_ID, nominees: [{ id: NOM_A }, { id: NOM_B }] },
  ])
  mockUpsertPrediction.mockResolvedValue({})
})

describe("savePredictions", () => {
  describe("auth", () => {
    it("returns error when unauthenticated", async () => {
      mockAuth.mockResolvedValue(null)
      const result = await savePredictions(validInput)
      expect(result).toMatchObject({ error: expect.any(String) })
    })
  })

  describe("membership", () => {
    it("returns error when user is not a pool member", async () => {
      mockGetPoolMember.mockResolvedValue(null)
      const result = await savePredictions(validInput)
      expect(result).toMatchObject({ error: expect.stringContaining("not an active member") })
    })

    it("returns error when member has left the pool", async () => {
      mockGetPoolMember.mockResolvedValue({ id: "member-1", leftAt: new Date() })
      const result = await savePredictions(validInput)
      expect(result).toMatchObject({ error: expect.stringContaining("not an active member") })
    })
  })

  describe("predictions lock", () => {
    it("returns error when predictions are locked", async () => {
      mockPrisma.pool.findUniqueOrThrow.mockResolvedValue({
        ceremonyYear: { predictionsLocked: true },
      })
      const result = await savePredictions(validInput)
      expect(result).toMatchObject({ error: expect.stringContaining("locked") })
    })
  })

  describe("input validation", () => {
    it("returns error for invalid poolId (not a CUID)", async () => {
      const result = await savePredictions({ poolId: "not-a-cuid", predictions: [] })
      expect(result).toMatchObject({ error: expect.any(String) })
    })

    it("returns error when firstChoice equals runnerUp", async () => {
      const result = await savePredictions({
        poolId: POOL_ID,
        predictions: [{ categoryId: CAT_ID, firstChoiceId: NOM_A, runnerUpId: NOM_A }],
      })
      expect(result).toMatchObject({ error: expect.stringContaining("different") })
    })

    it("returns error when nominee does not belong to the category", async () => {
      const UNKNOWN_NOM = "clxxxxxxxxxxxxxxxxxxxxxx99"
      const result = await savePredictions({
        poolId: POOL_ID,
        predictions: [{ categoryId: CAT_ID, firstChoiceId: UNKNOWN_NOM, runnerUpId: NOM_B }],
      })
      expect(result).toMatchObject({ error: expect.any(String) })
    })
  })

  describe("happy path", () => {
    it("upserts predictions and returns success", async () => {
      const result = await savePredictions(validInput)
      expect(result).toMatchObject({ success: true })
      expect(mockUpsertPrediction).toHaveBeenCalledWith("member-1", CAT_ID, NOM_A, NOM_B)
    })

    it("revalidates the predict page", async () => {
      await savePredictions(validInput)
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/pools/${POOL_ID}/predict`)
    })

    it("tracks predictions_saved event", async () => {
      await savePredictions(validInput)
      expect(mockTrack).toHaveBeenCalledWith("user-1", "predictions_saved", expect.any(Object))
    })

    it("saves multiple predictions", async () => {
      const CAT_ID_2 = "clxxxxxxxxxxxxxxxxxxxxxx05"
      const NOM_C = "clxxxxxxxxxxxxxxxxxxxxxx06"
      const NOM_D = "clxxxxxxxxxxxxxxxxxxxxxx07"
      mockPrisma.category.findMany.mockResolvedValue([
        { id: CAT_ID, nominees: [{ id: NOM_A }, { id: NOM_B }] },
        { id: CAT_ID_2, nominees: [{ id: NOM_C }, { id: NOM_D }] },
      ])
      const result = await savePredictions({
        poolId: POOL_ID,
        predictions: [
          { categoryId: CAT_ID, firstChoiceId: NOM_A, runnerUpId: NOM_B },
          { categoryId: CAT_ID_2, firstChoiceId: NOM_C, runnerUpId: NOM_D },
        ],
      })
      expect(result).toMatchObject({ success: true })
      expect(mockUpsertPrediction).toHaveBeenCalledTimes(2)
    })
  })
})
