import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockPool, mockPoolMember, mockTransaction } = vi.hoisted(() => ({
  mockPool: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  mockPoolMember: {
    create: vi.fn(),
  },
  mockTransaction: vi.fn(),
}))

vi.mock("@/lib/db/client", () => ({
  prisma: {
    pool: mockPool,
    poolMember: mockPoolMember,
    $transaction: mockTransaction,
  },
}))

// Mock nanoid to return a predictable value
vi.mock("nanoid", () => ({
  nanoid: () => "testcode",
}))

import {
  createPool,
  getPool,
  getUserPools,
  updatePool,
  archivePool,
} from "@/lib/db/pools"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("createPool", () => {
  it("creates a pool and an ADMIN member in a transaction", async () => {
    const txPool = { create: vi.fn(), findUnique: vi.fn() }
    const txPoolMember = { create: vi.fn() }

    const createdPool = {
      id: "pool-1",
      name: "Test Pool",
      ceremonyYearId: "cy-1",
      accessType: "OPEN",
      inviteCode: "testcode",
      createdById: "user-1",
    }

    txPool.create.mockResolvedValue(createdPool)
    txPoolMember.create.mockResolvedValue({})

    mockTransaction.mockImplementation(async (fn: (clients: Record<string, unknown>) => unknown) =>
      fn({ pool: txPool, poolMember: txPoolMember })
    )

    const result = await createPool({
      name: "Test Pool",
      ceremonyYearId: "cy-1",
      accessType: "OPEN" as const,
      userId: "user-1",
    })

    expect(result).toEqual(createdPool)
    expect(txPool.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Test Pool",
        ceremonyYearId: "cy-1",
        accessType: "OPEN",
        inviteCode: "testcode",
        createdById: "user-1",
        maxMembers: null,
      }),
    })
    expect(txPoolMember.create).toHaveBeenCalledWith({
      data: {
        poolId: "pool-1",
        userId: "user-1",
        role: "ADMIN",
      },
    })
  })

  it("passes maxMembers when provided", async () => {
    const txPool = { create: vi.fn() }
    const txPoolMember = { create: vi.fn() }

    txPool.create.mockResolvedValue({ id: "pool-2" })
    mockTransaction.mockImplementation(async (fn: (clients: Record<string, unknown>) => unknown) =>
      fn({ pool: txPool, poolMember: txPoolMember })
    )

    await createPool({
      name: "Limited Pool",
      ceremonyYearId: "cy-1",
      accessType: "INVITE_ONLY" as const,
      maxMembers: 10,
      userId: "user-1",
    })

    expect(txPool.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        maxMembers: 10,
      }),
    })
  })
})

describe("getPool", () => {
  it("returns a pool with members when it exists and is not archived", async () => {
    const poolData = {
      id: "pool-1",
      name: "Test Pool",
      archivedAt: null,
      members: [{ userId: "user-1", leftAt: null }],
      ceremonyYear: { id: "cy-1" },
    }

    mockPool.findFirst.mockResolvedValue(poolData)

    const result = await getPool("pool-1")

    expect(result).toEqual(poolData)
    expect(mockPool.findFirst).toHaveBeenCalledWith({
      where: { id: "pool-1", archivedAt: null },
      include: expect.objectContaining({
        members: expect.any(Object),
        ceremonyYear: true,
      }),
    })
  })

  it("returns null for an archived pool", async () => {
    mockPool.findFirst.mockResolvedValue(null)

    const result = await getPool("pool-archived")

    expect(result).toBeNull()
  })

  it("returns null for a non-existent pool", async () => {
    mockPool.findFirst.mockResolvedValue(null)

    const result = await getPool("pool-nonexistent")

    expect(result).toBeNull()
  })
})

describe("getUserPools", () => {
  it("returns pools where user has active membership", async () => {
    const pools = [
      { id: "pool-1", name: "Pool 1", archivedAt: null },
      { id: "pool-2", name: "Pool 2", archivedAt: null },
    ]

    mockPool.findMany.mockResolvedValue(pools)

    const result = await getUserPools("user-1")

    expect(result).toEqual(pools)
    expect(mockPool.findMany).toHaveBeenCalledWith({
      where: {
        archivedAt: null,
        members: {
          some: {
            userId: "user-1",
            leftAt: null,
          },
        },
      },
      include: expect.any(Object),
      orderBy: { createdAt: "desc" },
    })
  })

  it("returns empty array when user has no active pools", async () => {
    mockPool.findMany.mockResolvedValue([])

    const result = await getUserPools("user-lonely")

    expect(result).toEqual([])
  })
})

describe("updatePool", () => {
  it("updates pool name successfully", async () => {
    const updated = { id: "pool-1", name: "New Name" }
    mockPool.update.mockResolvedValue(updated)

    const result = await updatePool("pool-1", { name: "New Name" })

    expect(result).toEqual(updated)
    expect(mockPool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { name: "New Name" },
    })
  })

  it("throws when trying to change OPEN to INVITE_ONLY", async () => {
    mockPool.findUnique.mockResolvedValue({ accessType: "OPEN" })

    await expect(
      updatePool("pool-1", { accessType: "INVITE_ONLY" as const })
    ).rejects.toThrow("Cannot change access type from OPEN to INVITE_ONLY")
  })

  it("allows changing INVITE_ONLY to INVITE_ONLY (no-op)", async () => {
    mockPool.findUnique.mockResolvedValue({ accessType: "INVITE_ONLY" })
    mockPool.update.mockResolvedValue({ id: "pool-1", accessType: "INVITE_ONLY" })

    const result = await updatePool("pool-1", { accessType: "INVITE_ONLY" as const })

    expect(result).toBeDefined()
    expect(mockPool.update).toHaveBeenCalled()
  })

  it("allows changing to OPEN without restriction", async () => {
    mockPool.update.mockResolvedValue({ id: "pool-1", accessType: "OPEN" })

    const result = await updatePool("pool-1", { accessType: "OPEN" as const })

    expect(result).toBeDefined()
    // Should NOT have called findUnique since we're not setting INVITE_ONLY
    expect(mockPool.findUnique).not.toHaveBeenCalled()
  })
})

describe("archivePool", () => {
  it("sets archivedAt to a date", async () => {
    const now = new Date()
    vi.setSystemTime(now)

    mockPool.update.mockResolvedValue({ id: "pool-1", archivedAt: now })

    const result = await archivePool("pool-1")

    expect(result.archivedAt).toEqual(now)
    expect(mockPool.update).toHaveBeenCalledWith({
      where: { id: "pool-1" },
      data: { archivedAt: expect.any(Date) },
    })

    vi.useRealTimers()
  })
})
