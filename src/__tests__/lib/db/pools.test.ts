import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPoolCompletionStats } from "@/lib/db/pools";

// Mock the Prisma client singleton so tests don't hit a real database.
// The module path must match exactly what pools.ts imports.
vi.mock("@/lib/db/client", () => ({
  prisma: {
    category: { count: vi.fn() },
    poolMember: { findMany: vi.fn() },
  },
}));

// Pull the mocked prisma instance so we can configure return values per test.
const { prisma } = await import("@/lib/db/client");
const mockCategoryCount = vi.mocked(prisma.category.count);
const mockMemberFindMany = vi.mocked(prisma.poolMember.findMany);

describe("getPoolCompletionStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("classifies members correctly across all three states", async () => {
    // 3 total categories for this ceremony year.
    mockCategoryCount.mockResolvedValue(3);

    // Member A: all 3 picked → complete.
    // Member B: 1 picked    → incomplete.
    // Member C: 0 picked    → not started.
    mockMemberFindMany.mockResolvedValue([
      { id: "a", _count: { predictions: 3 } },
      { id: "b", _count: { predictions: 1 } },
      { id: "c", _count: { predictions: 0 } },
    ] as never);

    const stats = await getPoolCompletionStats("pool-1", "year-1");

    expect(stats).toEqual({
      total: 3,
      complete: 1,
      incomplete: 1,
      notStarted: 1,
      totalCategories: 3,
    });
  });

  it("returns all-complete when every member has filled every category", async () => {
    mockCategoryCount.mockResolvedValue(5);
    mockMemberFindMany.mockResolvedValue([
      { id: "a", _count: { predictions: 5 } },
      { id: "b", _count: { predictions: 5 } },
    ] as never);

    const stats = await getPoolCompletionStats("pool-1", "year-1");

    expect(stats.complete).toBe(2);
    expect(stats.incomplete).toBe(0);
    expect(stats.notStarted).toBe(0);
  });

  it("returns all-notStarted when no member has made any predictions", async () => {
    mockCategoryCount.mockResolvedValue(10);
    mockMemberFindMany.mockResolvedValue([
      { id: "a", _count: { predictions: 0 } },
      { id: "b", _count: { predictions: 0 } },
      { id: "c", _count: { predictions: 0 } },
    ] as never);

    const stats = await getPoolCompletionStats("pool-2", "year-1");

    expect(stats.notStarted).toBe(3);
    expect(stats.complete).toBe(0);
    expect(stats.incomplete).toBe(0);
    expect(stats.total).toBe(3);
  });

  it("returns total 0 and all zeros when the pool has no active members", async () => {
    mockCategoryCount.mockResolvedValue(8);
    mockMemberFindMany.mockResolvedValue([] as never);

    const stats = await getPoolCompletionStats("pool-empty", "year-1");

    expect(stats).toEqual({
      total: 0,
      complete: 0,
      incomplete: 0,
      notStarted: 0,
      totalCategories: 8,
    });
  });

  it("queries with correct poolId filter and leftAt: null to exclude departed members", async () => {
    mockCategoryCount.mockResolvedValue(1);
    mockMemberFindMany.mockResolvedValue([] as never);

    await getPoolCompletionStats("pool-xyz", "year-abc");

    expect(mockMemberFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { poolId: "pool-xyz", leftAt: null },
      })
    );
  });

  it("queries category count with the correct ceremonyYearId", async () => {
    mockCategoryCount.mockResolvedValue(2);
    mockMemberFindMany.mockResolvedValue([] as never);

    await getPoolCompletionStats("pool-1", "year-2026");

    expect(mockCategoryCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { ceremonyYearId: "year-2026" },
      })
    );
  });
});
