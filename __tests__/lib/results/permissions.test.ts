import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockPoolMember } = vi.hoisted(() => ({
  mockPoolMember: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock("@/lib/db/client", () => ({
  prisma: {
    poolMember: mockPoolMember,
  },
}))

import {
  checkResultsPermission,
  grantResultsPermission,
  revokeResultsPermission,
} from "@/lib/results/permissions"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("checkResultsPermission", () => {
  it("returns canSetResults true for ADMIN", async () => {
    mockPoolMember.findFirst.mockResolvedValue({ role: "ADMIN" })

    const result = await checkResultsPermission("user-1", "cy-1")

    expect(result).toEqual({ canSetResults: true, reason: "pool_creator" })
  })

  it("returns canSetResults true for RESULTS_MANAGER", async () => {
    mockPoolMember.findFirst.mockResolvedValue({ role: "RESULTS_MANAGER" })

    const result = await checkResultsPermission("user-2", "cy-1")

    expect(result).toEqual({ canSetResults: true, reason: "results_manager" })
  })

  it("returns canSetResults false when user has no qualifying membership", async () => {
    mockPoolMember.findFirst.mockResolvedValue(null)

    const result = await checkResultsPermission("user-3", "cy-1")

    expect(result).toEqual({ canSetResults: false, reason: "no_permission" })
  })

  it("queries with an active-membership filter", async () => {
    mockPoolMember.findFirst.mockResolvedValue(null)

    await checkResultsPermission("user-1", "cy-1")

    expect(mockPoolMember.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        leftAt: null,
        pool: { ceremonyYearId: "cy-1" },
        role: { in: ["ADMIN", "RESULTS_MANAGER"] },
      },
      select: { role: true },
    })
  })
})

describe("grantResultsPermission", () => {
  it("grants RESULTS_MANAGER role when granter is an active ADMIN", async () => {
    mockPoolMember.findUnique
      .mockResolvedValueOnce({ role: "ADMIN", leftAt: null })
      .mockResolvedValueOnce({ role: "MEMBER", leftAt: null })
    mockPoolMember.update.mockResolvedValue({})

    const result = await grantResultsPermission("admin-1", "pool-1", "user-2")

    expect(result).toEqual({ success: true })
    expect(mockPoolMember.update).toHaveBeenCalledWith({
      where: { poolId_userId: { poolId: "pool-1", userId: "user-2" } },
      data: { role: "RESULTS_MANAGER" },
    })
  })

  it("rejects when granter is not an active ADMIN", async () => {
    mockPoolMember.findUnique.mockResolvedValueOnce({ role: "ADMIN", leftAt: new Date() })

    const result = await grantResultsPermission("member-1", "pool-1", "user-2")

    expect(result).toEqual({
      success: false,
      error: "Only pool admins can grant results permission",
    })
    expect(mockPoolMember.update).not.toHaveBeenCalled()
  })

  it("rejects when target is not an active pool member", async () => {
    mockPoolMember.findUnique
      .mockResolvedValueOnce({ role: "ADMIN", leftAt: null })
      .mockResolvedValueOnce({ role: "MEMBER", leftAt: new Date() })

    const result = await grantResultsPermission("admin-1", "pool-1", "stranger")

    expect(result).toEqual({
      success: false,
      error: "User is not a member of this pool",
    })
  })

  it("rejects when target is already ADMIN", async () => {
    mockPoolMember.findUnique
      .mockResolvedValueOnce({ role: "ADMIN", leftAt: null })
      .mockResolvedValueOnce({ role: "ADMIN", leftAt: null })

    const result = await grantResultsPermission("admin-1", "pool-1", "admin-2")

    expect(result).toEqual({
      success: false,
      error: "Pool admins already have results permission",
    })
  })
})

describe("revokeResultsPermission", () => {
  it("revokes RESULTS_MANAGER role setting it to MEMBER", async () => {
    mockPoolMember.findUnique
      .mockResolvedValueOnce({ role: "ADMIN", leftAt: null })
      .mockResolvedValueOnce({ role: "RESULTS_MANAGER", leftAt: null })
    mockPoolMember.update.mockResolvedValue({})

    const result = await revokeResultsPermission("admin-1", "pool-1", "user-2")

    expect(result).toEqual({ success: true })
    expect(mockPoolMember.update).toHaveBeenCalledWith({
      where: { poolId_userId: { poolId: "pool-1", userId: "user-2" } },
      data: { role: "MEMBER" },
    })
  })

  it("rejects when revoker is not an active ADMIN", async () => {
    mockPoolMember.findUnique.mockResolvedValueOnce({ role: "MEMBER", leftAt: null })

    const result = await revokeResultsPermission("member-1", "pool-1", "user-2")

    expect(result).toEqual({
      success: false,
      error: "Only pool admins can revoke results permission",
    })
    expect(mockPoolMember.update).not.toHaveBeenCalled()
  })

  it("rejects when target is not an active pool member", async () => {
    mockPoolMember.findUnique
      .mockResolvedValueOnce({ role: "ADMIN", leftAt: null })
      .mockResolvedValueOnce({ role: "RESULTS_MANAGER", leftAt: new Date() })

    const result = await revokeResultsPermission("admin-1", "pool-1", "stranger")

    expect(result).toEqual({
      success: false,
      error: "User is not a member of this pool",
    })
  })

  it("rejects when target does not have RESULTS_MANAGER role", async () => {
    mockPoolMember.findUnique
      .mockResolvedValueOnce({ role: "ADMIN", leftAt: null })
      .mockResolvedValueOnce({ role: "MEMBER", leftAt: null })

    const result = await revokeResultsPermission("admin-1", "pool-1", "user-2")

    expect(result).toEqual({
      success: false,
      error: "User does not have results manager role",
    })
  })
})

