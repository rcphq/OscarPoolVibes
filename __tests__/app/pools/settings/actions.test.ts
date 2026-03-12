import { describe, it, expect, vi, beforeEach } from "vitest"

const {
  mockAuth,
  mockGetMemberRole,
  mockUpdatePool,
  mockArchivePool,
  mockRemoveMember,
  mockUpdateMemberRole,
  mockRedirect,
  mockRevalidatePath,
  mockTrack,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetMemberRole: vi.fn(),
  mockUpdatePool: vi.fn(),
  mockArchivePool: vi.fn(),
  mockRemoveMember: vi.fn(),
  mockUpdateMemberRole: vi.fn(),
  mockRedirect: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockTrack: vi.fn(),
}))

vi.mock("@/lib/auth/auth", () => ({ auth: mockAuth }))
vi.mock("@/lib/db/pool-members", () => ({
  getMemberRole: mockGetMemberRole,
  removeMember: mockRemoveMember,
  updateMemberRole: mockUpdateMemberRole,
}))
vi.mock("@/lib/db/pools", () => ({
  updatePool: mockUpdatePool,
  archivePool: mockArchivePool,
}))
vi.mock("next/navigation", () => ({ redirect: mockRedirect }))
vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }))
vi.mock("@/lib/analytics/posthog-server", () => ({ trackServerEvent: mockTrack }))

import {
  updatePoolSettings,
  archivePoolAction,
  removeMemberAction,
  changeMemberRoleAction,
  leavePoolAction,
} from "@/app/pools/[id]/settings/actions"

const POOL_ID = "pool-1"
const ADMIN_ID = "user-admin"
const MEMBER_ID = "user-member"
const adminSession = { user: { id: ADMIN_ID } }
const memberSession = { user: { id: MEMBER_ID } }

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData()
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  return fd
}

const validSettingsFormData = () =>
  makeFormData({ name: "Updated Pool", accessType: "OPEN", maxMembers: "" })

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue(adminSession)
  mockGetMemberRole.mockResolvedValue("ADMIN")
  mockUpdatePool.mockResolvedValue({})
  mockArchivePool.mockResolvedValue({})
  mockRemoveMember.mockResolvedValue({})
  mockUpdateMemberRole.mockResolvedValue({})
})

describe("updatePoolSettings", () => {
  it("redirects to signin when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    mockRedirect.mockImplementationOnce(() => { throw new Error("REDIRECT") })
    await expect(updatePoolSettings(POOL_ID, validSettingsFormData())).rejects.toThrow("REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/auth/signin")
  })

  it("throws when non-admin tries to update", async () => {
    mockGetMemberRole.mockResolvedValue("MEMBER")
    await expect(updatePoolSettings(POOL_ID, validSettingsFormData())).rejects.toThrow(
      "Only admins can perform this action"
    )
  })

  it("returns validation error for empty pool name", async () => {
    const result = await updatePoolSettings(
      POOL_ID,
      makeFormData({ name: "", accessType: "OPEN", maxMembers: "" })
    )
    expect(result?.error).toBeDefined()
  })

  it("updates pool and returns success for admin", async () => {
    const result = await updatePoolSettings(POOL_ID, validSettingsFormData())
    expect(result?.success).toBe(true)
    expect(mockUpdatePool).toHaveBeenCalledWith(POOL_ID, {
      name: "Updated Pool",
      accessType: "OPEN",
      maxMembers: null,
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/pools/${POOL_ID}/settings`)
  })

  it("returns error when updatePool throws", async () => {
    mockUpdatePool.mockRejectedValue(new Error("Cannot downgrade access"))
    const result = await updatePoolSettings(POOL_ID, validSettingsFormData())
    expect(result?.error).toBeDefined()
  })
})

describe("archivePoolAction", () => {
  it("redirects to signin when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    mockRedirect.mockImplementationOnce(() => { throw new Error("REDIRECT") })
    await expect(archivePoolAction(POOL_ID)).rejects.toThrow("REDIRECT")
    expect(mockRedirect).toHaveBeenCalledWith("/auth/signin")
  })

  it("throws when non-admin tries to archive", async () => {
    mockGetMemberRole.mockResolvedValue("MEMBER")
    await expect(archivePoolAction(POOL_ID)).rejects.toThrow("Only admins can perform this action")
  })

  it("archives pool and redirects to /pools", async () => {
    await archivePoolAction(POOL_ID)
    expect(mockArchivePool).toHaveBeenCalledWith(POOL_ID)
    expect(mockRedirect).toHaveBeenCalledWith("/pools")
  })
})

describe("removeMemberAction", () => {
  it("returns error when admin tries to remove themselves", async () => {
    const result = await removeMemberAction(POOL_ID, ADMIN_ID)
    expect(result?.error).toContain("cannot remove yourself")
  })

  it("removes member and returns success", async () => {
    const result = await removeMemberAction(POOL_ID, MEMBER_ID)
    expect(result?.success).toBe(true)
    expect(mockRemoveMember).toHaveBeenCalledWith(POOL_ID, MEMBER_ID)
  })

  it("throws when non-admin calls action", async () => {
    mockGetMemberRole.mockResolvedValue("MEMBER")
    await expect(removeMemberAction(POOL_ID, "other-user")).rejects.toThrow(
      "Only admins can perform this action"
    )
  })
})

describe("changeMemberRoleAction", () => {
  it("returns error when trying to set role to ADMIN", async () => {
    const result = await changeMemberRoleAction(POOL_ID, MEMBER_ID, "ADMIN")
    expect(result?.error).toContain("MEMBER, RESULTS_MANAGER")
  })

  it("promotes member to RESULTS_MANAGER", async () => {
    const result = await changeMemberRoleAction(POOL_ID, MEMBER_ID, "RESULTS_MANAGER")
    expect(result?.success).toBe(true)
    expect(mockUpdateMemberRole).toHaveBeenCalledWith(POOL_ID, MEMBER_ID, "RESULTS_MANAGER")
  })

  it("demotes RESULTS_MANAGER back to MEMBER", async () => {
    const result = await changeMemberRoleAction(POOL_ID, MEMBER_ID, "MEMBER")
    expect(result?.success).toBe(true)
    expect(mockUpdateMemberRole).toHaveBeenCalledWith(POOL_ID, MEMBER_ID, "MEMBER")
  })

  it("throws when non-admin calls action", async () => {
    mockGetMemberRole.mockResolvedValue("MEMBER")
    await expect(
      changeMemberRoleAction(POOL_ID, MEMBER_ID, "RESULTS_MANAGER")
    ).rejects.toThrow("Only admins can perform this action")
  })
})

describe("leavePoolAction", () => {
  it("redirects to signin when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null)
    await leavePoolAction(POOL_ID)
    expect(mockRedirect).toHaveBeenCalledWith("/auth/signin")
  })

  it("removes member and redirects to /pools", async () => {
    mockAuth.mockResolvedValue(memberSession)
    await leavePoolAction(POOL_ID)
    expect(mockRemoveMember).toHaveBeenCalledWith(POOL_ID, MEMBER_ID)
    expect(mockRedirect).toHaveBeenCalledWith("/pools")
  })

  it("returns error when removeMember throws", async () => {
    mockAuth.mockResolvedValue(memberSession)
    mockRemoveMember.mockRejectedValue(new Error("not a member"))
    const result = await leavePoolAction(POOL_ID)
    expect(result?.error).toBeDefined()
  })
})
