import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockCheckPermission, mockPrisma } = vi.hoisted(() => ({
  mockCheckPermission: vi.fn(),
  mockPrisma: {
    category: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/results/permissions", () => ({ checkResultsPermission: mockCheckPermission }))

import { setResult } from "@/lib/results/set-result"

const CATEGORY_ID = "cat-1"
const NOMINEE_A = "nom-a"
const NOMINEE_B = "nom-b"
const CEREMONY_YEAR_ID = "cy-1"
const USER_ID = "user-1"

const NOMINEE_C = "nom-c"

const baseCategory = {
  id: CATEGORY_ID,
  ceremonyYear: { id: CEREMONY_YEAR_ID },
  nominees: [
    { id: NOMINEE_A, name: "Film A" },
    { id: NOMINEE_B, name: "Film B" },
    { id: NOMINEE_C, name: "Film C" },
  ],
}

const txFns = {
  categoryResult: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  nominee: {
    updateMany: vi.fn(),
    update: vi.fn(),
  },
  category: {
    update: vi.fn(),
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma.category.findUnique.mockResolvedValue(baseCategory)
  mockCheckPermission.mockResolvedValue({ canSetResults: true })
  txFns.categoryResult.findUnique.mockResolvedValue(null)
  txFns.categoryResult.create.mockResolvedValue({ version: 1 })
  txFns.categoryResult.update.mockResolvedValue({ version: 2 })
  txFns.nominee.updateMany.mockResolvedValue({})
  txFns.nominee.update.mockResolvedValue({})
  txFns.category.update.mockResolvedValue({})
  mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txFns) => unknown) =>
    fn(txFns)
  )
})

describe("setResult", () => {
  describe("category not found", () => {
    it("returns CATEGORY_NOT_FOUND error", async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null)
      const result = await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_A,
        expectedVersion: null,
      })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.code).toBe("CATEGORY_NOT_FOUND")
    })
  })

  describe("authorization", () => {
    it("returns UNAUTHORIZED for user without permission", async () => {
      mockCheckPermission.mockResolvedValue({ canSetResults: false })
      const result = await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_A,
        expectedVersion: null,
      })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.code).toBe("UNAUTHORIZED")
    })
  })

  describe("nominee validation", () => {
    it("returns INVALID_NOMINEE when winner not in category", async () => {
      const result = await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: "nom-unknown",
        expectedVersion: null,
      })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.code).toBe("INVALID_NOMINEE")
    })
  })

  describe("first result creation", () => {
    it("creates result and returns version 1 when no result exists", async () => {
      const result = await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_A,
        expectedVersion: null,
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.version).toBe(1)
    })

    it("creates CategoryResult with correct data (no tie)", async () => {
      await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_A,
        expectedVersion: null,
      })
      expect(txFns.categoryResult.create).toHaveBeenCalledWith({
        data: {
          categoryId: CATEGORY_ID,
          winnerId: NOMINEE_A,
          tiedWinnerId: null,
          setById: USER_ID,
          version: 1,
        },
      })
    })

    it("syncs winner to Category and Nominee (no tie)", async () => {
      await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_A,
        expectedVersion: null,
      })
      expect(txFns.nominee.updateMany).toHaveBeenCalledWith({
        where: { categoryId: CATEGORY_ID, isWinner: true },
        data: { isWinner: false },
      })
      expect(txFns.nominee.update).toHaveBeenCalledWith({
        where: { id: NOMINEE_A },
        data: { isWinner: true },
      })
      expect(txFns.category.update).toHaveBeenCalledWith({
        where: { id: CATEGORY_ID },
        data: { winnerId: NOMINEE_A, tiedWinnerId: null },
      })
    })

    it("returns CONFLICT when expectedVersion is non-null but no result exists", async () => {
      const result = await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_A,
        expectedVersion: 1,
      })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.code).toBe("CONFLICT")
    })
  })

  describe("updating existing result", () => {
    const existingResult = {
      winnerId: NOMINEE_A,
      tiedWinnerId: null,
      version: 1,
      updatedAt: new Date(),
      winner: { name: "Film A" },
      tiedWinner: null,
      setBy: { name: "Jane", email: "jane@test.com" },
    }

    beforeEach(() => {
      txFns.categoryResult.findUnique.mockResolvedValue(existingResult)
    })

    it("updates result when expectedVersion matches", async () => {
      const result = await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_B,
        expectedVersion: 1,
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.version).toBe(2)
    })

    it("returns CONFLICT when expectedVersion is stale", async () => {
      const result = await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_B,
        expectedVersion: 0, // stale
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.code).toBe("CONFLICT")
        if (result.error.code === "CONFLICT") {
          expect(result.error.currentResult.winnerId).toBe(NOMINEE_A)
          expect(result.error.currentResult.version).toBe(1)
        }
      }
    })
  })
})

// ─── Tied Winner Tests ──────────────────────────────────────────────────────

describe("setResult — tied categories", () => {
  describe("tied nominee validation", () => {
    it("returns INVALID_TIED_NOMINEE when tiedWinnerId equals winnerId", async () => {
      const result = await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_A,
        tiedWinnerId: NOMINEE_A, // same as winner
        expectedVersion: null,
      })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.code).toBe("INVALID_TIED_NOMINEE")
    })

    it("returns INVALID_TIED_NOMINEE when tiedWinnerId does not belong to the category", async () => {
      const result = await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_A,
        tiedWinnerId: "nom-from-other-category",
        expectedVersion: null,
      })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error.code).toBe("INVALID_TIED_NOMINEE")
    })
  })

  describe("creating a tied result", () => {
    it("creates CategoryResult with both winner IDs", async () => {
      await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_A,
        tiedWinnerId: NOMINEE_C,
        expectedVersion: null,
      })
      expect(txFns.categoryResult.create).toHaveBeenCalledWith({
        data: {
          categoryId: CATEGORY_ID,
          winnerId: NOMINEE_A,
          tiedWinnerId: NOMINEE_C,
          setById: USER_ID,
          version: 1,
        },
      })
    })

    it("sets isWinner=true on both tied nominees", async () => {
      await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_A,
        tiedWinnerId: NOMINEE_C,
        expectedVersion: null,
      })
      expect(txFns.nominee.update).toHaveBeenCalledWith({
        where: { id: NOMINEE_A },
        data: { isWinner: true },
      })
      expect(txFns.nominee.update).toHaveBeenCalledWith({
        where: { id: NOMINEE_C },
        data: { isWinner: true },
      })
    })

    it("syncs tiedWinnerId to Category", async () => {
      await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_A,
        tiedWinnerId: NOMINEE_C,
        expectedVersion: null,
      })
      expect(txFns.category.update).toHaveBeenCalledWith({
        where: { id: CATEGORY_ID },
        data: { winnerId: NOMINEE_A, tiedWinnerId: NOMINEE_C },
      })
    })
  })

  describe("conflict response for an existing tied result", () => {
    it("includes tiedWinnerId and tiedWinnerName in CONFLICT details", async () => {
      txFns.categoryResult.findUnique.mockResolvedValue({
        winnerId: NOMINEE_A,
        tiedWinnerId: NOMINEE_C,
        version: 2,
        updatedAt: new Date(),
        winner: { name: "Film A" },
        tiedWinner: { name: "Film C" },
        setBy: { name: "Jane", email: "jane@test.com" },
      })
      const result = await setResult(USER_ID, {
        categoryId: CATEGORY_ID,
        winnerId: NOMINEE_B,
        expectedVersion: 1, // stale
      })
      expect(result.success).toBe(false)
      if (!result.success && result.error.code === "CONFLICT") {
        expect(result.error.currentResult.tiedWinnerId).toBe(NOMINEE_C)
        expect(result.error.currentResult.tiedWinnerName).toBe("Film C")
      }
    })
  })
})
