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

import { unsetResult } from "@/lib/results/unset-result"

const CATEGORY_ID = "cat-1"
const CEREMONY_YEAR_ID = "cy-1"
const USER_ID = "user-1"
const NOMINEE_A = "nom-a"

const baseCategory = {
  id: CATEGORY_ID,
  ceremonyYear: { id: CEREMONY_YEAR_ID },
}

const existingResult = {
  winnerId: NOMINEE_A,
  version: 1,
  updatedAt: new Date("2026-03-15T12:00:00Z"),
  winner: { name: "Film A" },
  setBy: { name: "Jane", email: "jane@test.com" },
}

const txFns = {
  categoryResult: {
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
  nominee: {
    updateMany: vi.fn(),
  },
  category: {
    update: vi.fn(),
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma.category.findUnique.mockResolvedValue(baseCategory)
  mockCheckPermission.mockResolvedValue({ canSetResults: true })
  txFns.categoryResult.findUnique.mockResolvedValue(existingResult)
  txFns.categoryResult.delete.mockResolvedValue({})
  txFns.nominee.updateMany.mockResolvedValue({})
  txFns.category.update.mockResolvedValue({})
  mockPrisma.$transaction.mockImplementation(async (fn: (tx: typeof txFns) => unknown) =>
    fn(txFns)
  )
})

describe("unsetResult", () => {
  it("returns CATEGORY_NOT_FOUND when category does not exist", async () => {
    mockPrisma.category.findUnique.mockResolvedValue(null)
    const result = await unsetResult(USER_ID, {
      categoryId: CATEGORY_ID,
      expectedVersion: 1,
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe("CATEGORY_NOT_FOUND")
  })

  it("returns UNAUTHORIZED for user without permission", async () => {
    mockCheckPermission.mockResolvedValue({ canSetResults: false })
    const result = await unsetResult(USER_ID, {
      categoryId: CATEGORY_ID,
      expectedVersion: 1,
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe("UNAUTHORIZED")
  })

  it("returns CATEGORY_NOT_FOUND when no result exists for category", async () => {
    txFns.categoryResult.findUnique.mockResolvedValue(null)
    const result = await unsetResult(USER_ID, {
      categoryId: CATEGORY_ID,
      expectedVersion: 1,
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.code).toBe("CATEGORY_NOT_FOUND")
  })

  it("returns CONFLICT when expectedVersion does not match", async () => {
    const result = await unsetResult(USER_ID, {
      categoryId: CATEGORY_ID,
      expectedVersion: 99,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe("CONFLICT")
      expect(result.error.currentResult?.winnerId).toBe(NOMINEE_A)
      expect(result.error.currentResult?.version).toBe(1)
    }
  })

  it("successfully unsets result when version matches", async () => {
    const result = await unsetResult(USER_ID, {
      categoryId: CATEGORY_ID,
      expectedVersion: 1,
    })
    expect(result.success).toBe(true)
  })

  it("clears isWinner on nominees", async () => {
    await unsetResult(USER_ID, {
      categoryId: CATEGORY_ID,
      expectedVersion: 1,
    })
    expect(txFns.nominee.updateMany).toHaveBeenCalledWith({
      where: { categoryId: CATEGORY_ID, isWinner: true },
      data: { isWinner: false },
    })
  })

  it("clears winnerId on category", async () => {
    await unsetResult(USER_ID, {
      categoryId: CATEGORY_ID,
      expectedVersion: 1,
    })
    expect(txFns.category.update).toHaveBeenCalledWith({
      where: { id: CATEGORY_ID },
      data: { winnerId: null },
    })
  })

  it("deletes the CategoryResult row", async () => {
    await unsetResult(USER_ID, {
      categoryId: CATEGORY_ID,
      expectedVersion: 1,
    })
    expect(txFns.categoryResult.delete).toHaveBeenCalledWith({
      where: { categoryId: CATEGORY_ID },
    })
  })
})
