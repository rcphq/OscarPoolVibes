import { describe, it, expect, vi, beforeEach } from "vitest"

const { mockAuth, mockIsSiteAdmin, mockPrisma, mockRevalidatePath, mockTrack } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockIsSiteAdmin: vi.fn(),
    mockPrisma: {
      ceremonyYear: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      category: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      nominee: {
        create: vi.fn(),
      },
    },
    mockRevalidatePath: vi.fn(),
    mockTrack: vi.fn(),
  }))

vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/auth/admin", () => ({ isSiteAdmin: mockIsSiteAdmin }))
vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }))
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }))
vi.mock("@/lib/analytics/posthog-server", () => ({ trackServerEvent: mockTrack }))

import { togglePredictionsLocked } from "@/app/admin/actions"

const adminSession = { user: { id: "admin-1", email: "admin@test.com" } }
const CEREMONY_ID = "cy-1"

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(adminSession)
  mockIsSiteAdmin.mockReturnValue(true)
  mockPrisma.ceremonyYear.findUnique.mockResolvedValue({ predictionsLocked: false })
  mockPrisma.ceremonyYear.update.mockResolvedValue({ predictionsLocked: true })
})

describe("togglePredictionsLocked", () => {
  describe("auth / authorization", () => {
    it("returns error when unauthenticated", async () => {
      mockAuth.mockResolvedValue(null)
      const result = await togglePredictionsLocked(CEREMONY_ID)
      expect(result.success).toBe(false)
      expect(result.error).toContain("authenticated")
    })

    it("returns error when user is not a site admin", async () => {
      mockIsSiteAdmin.mockReturnValue(false)
      const result = await togglePredictionsLocked(CEREMONY_ID)
      expect(result.success).toBe(false)
      expect(result.error).toContain("admin")
    })
  })

  describe("ceremony year checks", () => {
    it("returns error when ceremony year not found", async () => {
      mockPrisma.ceremonyYear.findUnique.mockResolvedValue(null)
      const result = await togglePredictionsLocked(CEREMONY_ID)
      expect(result.success).toBe(false)
      expect(result.error).toContain("not found")
    })
  })

  describe("toggling", () => {
    it("locks predictions when currently unlocked", async () => {
      mockPrisma.ceremonyYear.findUnique.mockResolvedValue({ predictionsLocked: false })
      const result = await togglePredictionsLocked(CEREMONY_ID)
      expect(result.success).toBe(true)
      expect(mockPrisma.ceremonyYear.update).toHaveBeenCalledWith({
        where: { id: CEREMONY_ID },
        data: { predictionsLocked: true },
      })
    })

    it("unlocks predictions when currently locked", async () => {
      mockPrisma.ceremonyYear.findUnique.mockResolvedValue({ predictionsLocked: true })
      const result = await togglePredictionsLocked(CEREMONY_ID)
      expect(result.success).toBe(true)
      expect(mockPrisma.ceremonyYear.update).toHaveBeenCalledWith({
        where: { id: CEREMONY_ID },
        data: { predictionsLocked: false },
      })
    })

    it("tracks admin_predictions_locked event", async () => {
      await togglePredictionsLocked(CEREMONY_ID)
      expect(mockTrack).toHaveBeenCalledWith("admin-1", "admin_predictions_locked", {
        ceremonyYearId: CEREMONY_ID,
        locked: true,
      })
    })

    it("revalidates /admin path", async () => {
      await togglePredictionsLocked(CEREMONY_ID)
      expect(mockRevalidatePath).toHaveBeenCalledWith("/admin")
    })
  })
})
