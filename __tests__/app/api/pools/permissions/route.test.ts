import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

const { mockAuth, mockPrisma, mockGrantPermission, mockRevokePermission } =
  vi.hoisted(() => ({
    mockAuth: vi.fn(),
    mockPrisma: {
      poolMember: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
    },
    mockGrantPermission: vi.fn(),
    mockRevokePermission: vi.fn(),
  }))

vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/db/client", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/results", () => ({
  grantResultsPermission: mockGrantPermission,
  revokeResultsPermission: mockRevokePermission,
}))

import { GET, POST } from "@/app/api/pools/[poolId]/permissions/route"

const POOL_ID = "pool-1"
const ADMIN_ID = "user-admin"
const MEMBER_ID = "user-member"
const adminSession = { user: { id: ADMIN_ID } }
const memberSession = { user: { id: MEMBER_ID } }

const routeContext = { params: Promise.resolve({ poolId: POOL_ID }) }

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/pools/${POOL_ID}/permissions`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : {},
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(adminSession)
  mockPrisma.poolMember.findUnique.mockResolvedValue({
    role: "ADMIN",
    leftAt: null,
  })
  mockPrisma.poolMember.findMany.mockResolvedValue([
    {
      role: "ADMIN",
      joinedAt: new Date(),
      user: { id: ADMIN_ID, name: "Admin", email: "admin@test.com", image: null },
    },
  ])
  mockGrantPermission.mockResolvedValue({ success: true })
  mockRevokePermission.mockResolvedValue({ success: true })
})

describe("GET /api/pools/[poolId]/permissions", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeRequest("GET"), routeContext)
    expect(res.status).toBe(401)
  })

  it("returns 403 when caller is not a pool admin", async () => {
    mockAuth.mockResolvedValue(memberSession)
    mockPrisma.poolMember.findUnique.mockResolvedValue({ role: "MEMBER", leftAt: null })
    const res = await GET(makeRequest("GET"), routeContext)
    expect(res.status).toBe(403)
  })

  it("returns 403 when caller has left the pool", async () => {
    mockPrisma.poolMember.findUnique.mockResolvedValue({ role: "ADMIN", leftAt: new Date() })
    const res = await GET(makeRequest("GET"), routeContext)
    expect(res.status).toBe(403)
  })

  it("returns 403 when caller is not a member at all", async () => {
    mockPrisma.poolMember.findUnique.mockResolvedValue(null)
    const res = await GET(makeRequest("GET"), routeContext)
    expect(res.status).toBe(403)
  })

  it("returns member list for pool admin", async () => {
    const res = await GET(makeRequest("GET"), routeContext)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data[0]).toMatchObject({
      userId: ADMIN_ID,
      role: "ADMIN",
      canManageResults: true,
    })
  })
})

describe("POST /api/pools/[poolId]/permissions", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(
      makeRequest("POST", { targetUserId: MEMBER_ID, action: "grant" }),
      routeContext
    )
    expect(res.status).toBe(401)
  })

  it("returns 400 for invalid request body", async () => {
    const req = new NextRequest(`http://localhost/api/pools/${POOL_ID}/permissions`, {
      method: "POST",
      body: "bad json",
      headers: { "content-type": "application/json" },
    })
    const res = await POST(req, routeContext)
    expect(res.status).toBe(400)
  })

  it("grants RESULTS_MANAGER permission", async () => {
    const res = await POST(
      makeRequest("POST", { targetUserId: MEMBER_ID, action: "grant" }),
      routeContext
    )
    expect(res.status).toBe(200)
    expect(mockGrantPermission).toHaveBeenCalledWith(ADMIN_ID, POOL_ID, MEMBER_ID)
  })

  it("revokes RESULTS_MANAGER permission", async () => {
    const res = await POST(
      makeRequest("POST", { targetUserId: MEMBER_ID, action: "revoke" }),
      routeContext
    )
    expect(res.status).toBe(200)
    expect(mockRevokePermission).toHaveBeenCalledWith(ADMIN_ID, POOL_ID, MEMBER_ID)
  })

  it("returns 403 when grantResultsPermission fails", async () => {
    mockGrantPermission.mockResolvedValue({ success: false, error: "Not an admin" })
    const res = await POST(
      makeRequest("POST", { targetUserId: MEMBER_ID, action: "grant" }),
      routeContext
    )
    expect(res.status).toBe(403)
  })
})
