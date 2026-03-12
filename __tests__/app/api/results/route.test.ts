import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { mockAuth, mockSetResult, mockGetResultsByCeremony, mockPrisma, mockTrack } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockSetResult: vi.fn(),
    mockGetResultsByCeremony: vi.fn(),
    mockPrisma: {
      user: { findUnique: vi.fn() },
      category: { findUnique: vi.fn() },
    },
    mockTrack: vi.fn(),
  }))

vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/results", () => ({
  setResult: mockSetResult,
  getResultsByCeremony: mockGetResultsByCeremony,
}))
vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/analytics/posthog-server", () => ({ trackServerEvent: mockTrack }))

import { GET, POST } from "@/app/api/results/route"

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
  mockSetResult.mockResolvedValue({ success: true, version: 1 })
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
})
