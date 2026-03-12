import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockAuth, mockCreatePool, mockPrisma, mockRedirect, mockTrack } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockCreatePool: vi.fn(),
    mockPrisma: {
      ceremonyYear: { findUnique: vi.fn() },
    },
    mockRedirect: vi.fn(),
    mockTrack: vi.fn(),
  }))

vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/db/pools", () => ({ createPool: mockCreatePool }))
vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }))
vi.mock("next/navigation", () => ({ redirect: mockRedirect }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/analytics/posthog-server", () => ({ trackServerEvent: mockTrack }))

import { createPoolAction } from "@/app/pools/create/actions"

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  return fd
}

const validFormData = () =>
  makeFormData({ name: "Test Pool", ceremonyYearId: "cy-1", accessType: "OPEN" })

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma.ceremonyYear.findUnique.mockResolvedValue({ isActive: true })
  mockCreatePool.mockResolvedValue({ id: "pool-new" })
})

describe("createPoolAction", () => {
  describe("auth", () => {
    it("returns form error when unauthenticated", async () => {
      mockAuth.mockResolvedValue(null)
      const result = await createPoolAction({}, validFormData())
      expect(result.errors?._form).toBeDefined()
    })

    it("returns form error when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: {} })
      const result = await createPoolAction({}, validFormData())
      expect(result.errors?._form).toBeDefined()
    })
  })

  describe("validation", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    })

    it("returns name error when name is empty", async () => {
      const result = await createPoolAction(
        {},
        makeFormData({ name: "", ceremonyYearId: "cy-1", accessType: "OPEN" })
      )
      expect(result.errors?.name).toBeDefined()
    })

    it("returns name error when name exceeds 100 characters", async () => {
      const result = await createPoolAction(
        {},
        makeFormData({ name: "a".repeat(101), ceremonyYearId: "cy-1", accessType: "OPEN" })
      )
      expect(result.errors?.name).toBeDefined()
    })

    it("returns accessType error for invalid access type", async () => {
      const result = await createPoolAction(
        {},
        makeFormData({ name: "Test", ceremonyYearId: "cy-1", accessType: "INVALID" })
      )
      expect(result.errors?.accessType).toBeDefined()
    })
  })

  describe("ceremony year checks", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    })

    it("returns error when ceremony year does not exist", async () => {
      mockPrisma.ceremonyYear.findUnique.mockResolvedValue(null)
      const result = await createPoolAction({}, validFormData())
      expect(result.errors?.ceremonyYearId).toBeDefined()
    })

    it("returns error when ceremony year is not active", async () => {
      mockPrisma.ceremonyYear.findUnique.mockResolvedValue({ isActive: false })
      const result = await createPoolAction({}, validFormData())
      expect(result.errors?.ceremonyYearId?.[0]).toContain("no longer active")
    })
  })

  describe("happy path", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    })

    it("calls createPool with correct args", async () => {
      await createPoolAction({}, validFormData())
      expect(mockCreatePool).toHaveBeenCalledWith({
        name: "Test Pool",
        ceremonyYearId: "cy-1",
        accessType: "OPEN",
        maxMembers: undefined,
        userId: "user-1",
      })
    })

    it("redirects to pool page with created param", async () => {
      await createPoolAction({}, validFormData())
      expect(mockRedirect).toHaveBeenCalledWith("/pools/pool-new?created=1")
    })

    it("tracks pool_created event", async () => {
      await createPoolAction({}, validFormData())
      expect(mockTrack).toHaveBeenCalledWith("user-1", "pool_created", expect.any(Object))
    })

    it("passes maxMembers when provided", async () => {
      const fd = makeFormData({
        name: "Test Pool",
        ceremonyYearId: "cy-1",
        accessType: "INVITE_ONLY",
        maxMembers: "10",
      })
      await createPoolAction({}, fd)
      expect(mockCreatePool).toHaveBeenCalledWith(
        expect.objectContaining({ maxMembers: 10, accessType: "INVITE_ONLY" })
      )
    })
  })

  describe("error handling", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } })
    })

    it("returns form error when createPool throws", async () => {
      mockCreatePool.mockRejectedValue(new Error("DB error"))
      const result = await createPoolAction({}, validFormData())
      expect(result.errors?._form).toBeDefined()
    })
  })
})
