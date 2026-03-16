import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { mockAuth, mockSetResult, mockUnsetResult, mockGetResultsByCeremony, mockPrisma, mockTrack, mockRevalidatePath } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockSetResult: vi.fn(),
    mockUnsetResult: vi.fn(),
    mockGetResultsByCeremony: vi.fn(),
    mockPrisma: {
      user: { findUnique: vi.fn() },
      category: { findUnique: vi.fn() },
      pool: { findMany: vi.fn() },
    },
    mockTrack: vi.fn(),
    mockRevalidatePath: vi.fn(),
  }))

vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/results", () => ({
  setResult: mockSetResult,
  unsetResult: mockUnsetResult,
  getResultsByCeremony: mockGetResultsByCeremony,
}))
vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/analytics/posthog-server", () => ({ trackServerEvent: mockTrack }))
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }))

import { GET, POST, DELETE } from "@/app/api/results/route"

const authedSession = { user: { id: "user-1", email: "user@test.com" } }

function makeRequest(
  method: string,
  url: string,
  body?: unknown
): NextRequest {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : {},
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(authedSession)
  mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1" })
  mockPrisma.category.findUnique.mockResolvedValue({ ceremonyYearId: "cy-1" })
  mockPrisma.pool.findMany.mockResolvedValue([{ id: "pool-1" }, { id: "pool-2" }])
  mockSetResult.mockResolvedValue({ success: true, version: 1 })
  mockUnsetResult.mockResolvedValue({ success: true })
  mockGetResultsByCeremony.mockResolvedValue([])
})

describe("GET /api/results", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const req = makeRequest("GET", "http://localhost/api/results?ceremonyYearId=cy-1")
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it("returns 400 when ceremonyYearId is missing", async () => {
    const req = makeRequest("GET", "http://localhost/api/results")
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it("returns results for valid ceremonyYearId", async () => {
    mockGetResultsByCeremony.mockResolvedValue([{ categoryId: "cat-1", winnerId: null }])
    const req = makeRequest("GET", "http://localhost/api/results?ceremonyYearId=cy-1")
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })
})

describe("POST /api/results", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const req = makeRequest("POST", "http://localhost/api/results", {
      categoryId: "cat-1",
      winnerId: "nom-1",
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("returns 401 when session user is not found in DB", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    const req = makeRequest("POST", "http://localhost/api/results", {
      categoryId: "cat-1",
      winnerId: "nom-1",
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("returns 400 for invalid request body", async () => {
    const req = new NextRequest("http://localhost/api/results", {
      method: "POST",
      body: "not json",
      headers: { "content-type": "application/json" },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 200 with version on success", async () => {
    const req = makeRequest("POST", "http://localhost/api/results", {
      categoryId: "cat-1",
      winnerId: "nom-1",
      expectedVersion: null,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toMatchObject({ success: true, version: 1 })
  })

  it("returns 409 on CONFLICT", async () => {
    mockSetResult.mockResolvedValue({
      success: false,
      error: {
        code: "CONFLICT",
        message: "Conflict",
        currentResult: { winnerId: "nom-1", winnerName: "Film A", version: 1 },
      },
    })
    const req = makeRequest("POST", "http://localhost/api/results", {
      categoryId: "cat-1",
      winnerId: "nom-2",
      expectedVersion: 0,
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })

  it("returns 403 on UNAUTHORIZED", async () => {
    mockSetResult.mockResolvedValue({
      success: false,
      error: { code: "UNAUTHORIZED", message: "No permission" },
    })
    const req = makeRequest("POST", "http://localhost/api/results", {
      categoryId: "cat-1",
      winnerId: "nom-1",
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it("revalidates leaderboard paths for all ceremony pools on success", async () => {
    mockPrisma.pool.findMany.mockResolvedValue([
      { id: "pool-A" },
      { id: "pool-B" },
    ])
    const req = makeRequest("POST", "http://localhost/api/results", {
      categoryId: "cat-1",
      winnerId: "nom-1",
      expectedVersion: null,
    })
    await POST(req)
    expect(mockPrisma.pool.findMany).toHaveBeenCalledWith({
      where: { ceremonyYearId: "cy-1" },
      select: { id: true },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith("/pools/pool-A/leaderboard")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/pools/pool-A")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/pools/pool-B/leaderboard")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/pools/pool-B")
  })

  it("does not revalidate when result fails", async () => {
    mockSetResult.mockResolvedValue({
      success: false,
      error: { code: "UNAUTHORIZED", message: "No permission" },
    })
    const req = makeRequest("POST", "http://localhost/api/results", {
      categoryId: "cat-1",
      winnerId: "nom-1",
    })
    await POST(req)
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })

  it("returns 400 on INVALID_NOMINEE", async () => {
    mockSetResult.mockResolvedValue({
      success: false,
      error: { code: "INVALID_NOMINEE", message: "Bad nominee" },
    })
    const req = makeRequest("POST", "http://localhost/api/results", {
      categoryId: "cat-1",
      winnerId: "nom-bad",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  // ─── Tied winner tests ───────────────────────────────────────────────────────

  it("returns 200 when tiedWinnerId is provided with a valid tied result", async () => {
    const req = makeRequest("POST", "http://localhost/api/results", {
      categoryId: "cat-1",
      winnerId: "nom-1",
      tiedWinnerId: "nom-2",
      expectedVersion: null,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockSetResult).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        categoryId: "cat-1",
        winnerId: "nom-1",
        tiedWinnerId: "nom-2",
      })
    )
  })

  it("returns 400 on INVALID_TIED_NOMINEE", async () => {
    mockSetResult.mockResolvedValue({
      success: false,
      error: { code: "INVALID_TIED_NOMINEE", message: "Tied nominee same as primary" },
    })
    const req = makeRequest("POST", "http://localhost/api/results", {
      categoryId: "cat-1",
      winnerId: "nom-1",
      tiedWinnerId: "nom-1", // same — server returns INVALID_TIED_NOMINEE
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("passes tiedWinnerId: null when tiedWinnerId is omitted (normal result)", async () => {
    const req = makeRequest("POST", "http://localhost/api/results", {
      categoryId: "cat-1",
      winnerId: "nom-1",
      expectedVersion: null,
    })
    await POST(req)
    expect(mockSetResult).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ tiedWinnerId: null })
    )
  })
})

describe("DELETE /api/results", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const req = makeRequest("DELETE", "http://localhost/api/results", {
      categoryId: "cat-1",
      expectedVersion: 1,
    })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it("returns 400 for invalid request body", async () => {
    const req = new NextRequest("http://localhost/api/results", {
      method: "DELETE",
      body: "not json",
      headers: { "content-type": "application/json" },
    })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it("returns 400 when expectedVersion is missing", async () => {
    const req = makeRequest("DELETE", "http://localhost/api/results", {
      categoryId: "cat-1",
    })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it("returns 200 on successful unset", async () => {
    const req = makeRequest("DELETE", "http://localhost/api/results", {
      categoryId: "cat-1",
      expectedVersion: 1,
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toMatchObject({ success: true })
  })

  it("calls unsetResult with correct parameters", async () => {
    const req = makeRequest("DELETE", "http://localhost/api/results", {
      categoryId: "cat-1",
      expectedVersion: 3,
    })
    await DELETE(req)
    expect(mockUnsetResult).toHaveBeenCalledWith("user-1", {
      categoryId: "cat-1",
      expectedVersion: 3,
    })
  })

  it("revalidates leaderboard paths on success", async () => {
    mockPrisma.pool.findMany.mockResolvedValue([{ id: "pool-X" }])
    const req = makeRequest("DELETE", "http://localhost/api/results", {
      categoryId: "cat-1",
      expectedVersion: 1,
    })
    await DELETE(req)
    expect(mockRevalidatePath).toHaveBeenCalledWith("/pools/pool-X/leaderboard")
    expect(mockRevalidatePath).toHaveBeenCalledWith("/pools/pool-X")
  })

  it("returns 409 on CONFLICT", async () => {
    mockUnsetResult.mockResolvedValue({
      success: false,
      error: {
        code: "CONFLICT",
        message: "Version mismatch",
        currentResult: { winnerId: "nom-1", winnerName: "Film A", version: 2 },
      },
    })
    const req = makeRequest("DELETE", "http://localhost/api/results", {
      categoryId: "cat-1",
      expectedVersion: 1,
    })
    const res = await DELETE(req)
    expect(res.status).toBe(409)
  })

  it("returns 403 on UNAUTHORIZED", async () => {
    mockUnsetResult.mockResolvedValue({
      success: false,
      error: { code: "UNAUTHORIZED", message: "No permission" },
    })
    const req = makeRequest("DELETE", "http://localhost/api/results", {
      categoryId: "cat-1",
      expectedVersion: 1,
    })
    const res = await DELETE(req)
    expect(res.status).toBe(403)
  })

  it("does not revalidate when unset fails", async () => {
    mockUnsetResult.mockResolvedValue({
      success: false,
      error: { code: "UNAUTHORIZED", message: "No permission" },
    })
    const req = makeRequest("DELETE", "http://localhost/api/results", {
      categoryId: "cat-1",
      expectedVersion: 1,
    })
    await DELETE(req)
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
