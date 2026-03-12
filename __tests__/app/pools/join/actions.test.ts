import { describe, it, expect, vi, beforeEach } from "vitest"

const {
  mockAuth,
  mockGetPoolByInviteCode,
  mockAddMember,
  mockAcceptInvite,
  mockGetInviteByToken,
  mockRedirect,
  mockTrack,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetPoolByInviteCode: vi.fn(),
  mockAddMember: vi.fn(),
  mockAcceptInvite: vi.fn(),
  mockGetInviteByToken: vi.fn(),
  mockRedirect: vi.fn(),
  mockTrack: vi.fn(),
}))

vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/db/pools", () => ({ getPoolByInviteCode: mockGetPoolByInviteCode }))
vi.mock("@/lib/db/pool-members", () => ({ addMember: mockAddMember }))
vi.mock("@/lib/db/invites", () => ({
  acceptInvite: mockAcceptInvite,
  getInviteByToken: mockGetInviteByToken,
}))
vi.mock("next/navigation", () => ({ redirect: mockRedirect }))
vi.mock("@/lib/analytics/posthog-server", () => ({ trackServerEvent: mockTrack }))

import { joinOpenPool, joinViaInvite } from "@/app/pools/join/actions"

const authedSession = { user: { id: "user-1", email: "user@test.com" } }
const openPool = { id: "pool-1", accessType: "OPEN" }
const inviteOnlyPool = { id: "pool-2", accessType: "INVITE_ONLY" }

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(authedSession)
  mockGetPoolByInviteCode.mockResolvedValue(openPool)
  mockAddMember.mockResolvedValue({})
})

describe("joinOpenPool", () => {
  it("redirects to signin when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    await joinOpenPool("ABCD1234")
    expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining("/auth/signin"))
  })

  it("returns error for invalid/unknown invite code", async () => {
    mockGetPoolByInviteCode.mockResolvedValue(null)
    const result = await joinOpenPool("BADCODE1")
    expect(result?.error).toBeDefined()
  })

  it("returns error for INVITE_ONLY pool", async () => {
    mockGetPoolByInviteCode.mockResolvedValue(inviteOnlyPool)
    const result = await joinOpenPool("ABCD1234")
    expect(result?.error).toBeDefined()
  })

  it("adds member and redirects on valid code", async () => {
    await joinOpenPool("ABCD1234")
    expect(mockAddMember).toHaveBeenCalledWith("pool-1", "user-1")
    expect(mockRedirect).toHaveBeenCalledWith("/pools/pool-1")
  })

  it("tracks pool_joined event with method=code", async () => {
    await joinOpenPool("ABCD1234")
    expect(mockTrack).toHaveBeenCalledWith("user-1", "pool_joined", { poolId: "pool-1", method: "code" })
  })

  it("returns error when user is already a member", async () => {
    mockAddMember.mockRejectedValue(new Error("User is already an active member of this pool"))
    const result = await joinOpenPool("ABCD1234")
    expect(result?.error).toContain("already an active member")
  })

  it("returns generic error when addMember fails", async () => {
    mockAddMember.mockRejectedValue("unknown")
    const result = await joinOpenPool("ABCD1234")
    expect(result?.error).toBeDefined()
  })
})

describe("joinViaInvite", () => {
  const validInvite = { poolId: "pool-1", email: "user@test.com" }

  beforeEach(() => {
    mockGetInviteByToken.mockResolvedValue(validInvite)
    mockAcceptInvite.mockResolvedValue({})
  })

  it("redirects to signin when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    mockRedirect.mockImplementationOnce(() => { throw new Error("REDIRECT") })
    await expect(joinViaInvite("tok-abc")).rejects.toThrow("REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining("/auth/signin"))
  })

  it("returns error for invalid/expired token", async () => {
    mockGetInviteByToken.mockResolvedValue(null)
    const result = await joinViaInvite("tok-bad")
    expect(result?.error).toBeDefined()
  })

  it("returns error when email does not match invite", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-2", email: "other@test.com" } })
    const result = await joinViaInvite("tok-abc")
    expect(result?.error).toBeDefined()
  })

  it("accepts invite and redirects on success", async () => {
    await joinViaInvite("tok-abc")
    expect(mockAcceptInvite).toHaveBeenCalledWith("tok-abc", "user-1")
    expect(mockRedirect).toHaveBeenCalledWith("/pools/pool-1")
  })

  it("tracks pool_joined event with method=invite", async () => {
    await joinViaInvite("tok-abc")
    expect(mockTrack).toHaveBeenCalledWith("user-1", "pool_joined", { poolId: "pool-1", method: "invite" })
  })

  it("returns error when acceptInvite throws", async () => {
    mockAcceptInvite.mockRejectedValue(new Error("Invite already used"))
    const result = await joinViaInvite("tok-abc")
    expect(result?.error).toContain("Invite already used")
  })
})
