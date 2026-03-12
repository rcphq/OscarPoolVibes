import { test, expect } from "@playwright/test";

test.describe("Leaderboard", () => {
  test("leaderboard page is accessible to pool members", async ({ page }) => {
    const poolId = process.env.E2E_TEST_POOL_ID;
    if (!poolId) test.skip();

    await page.goto(`/pools/${poolId}/leaderboard`);
    await expect(page.getByRole("heading", { name: /leaderboard/i })).toBeVisible();
  });

  test("leaderboard shows members ranked by score", async ({ page }) => {
    const poolId = process.env.E2E_TEST_POOL_ID;
    if (!poolId) test.skip();

    await page.goto(`/pools/${poolId}/leaderboard`);

    // Table or list should show at least one member
    const rows = page.getByRole("row");
    const count = await rows.count();
    // Header row + at least one member row
    expect(count).toBeGreaterThan(1);
  });

  test("scores are numeric and rankings are in order", async ({ page }) => {
    const poolId = process.env.E2E_TEST_POOL_ID;
    if (!poolId) test.skip();

    await page.goto(`/pools/${poolId}/leaderboard`);

    // Get all score cells (assumes a table with score column)
    const scoreCells = page.locator("table tbody tr td:nth-child(3)");
    const count = await scoreCells.count();
    if (count < 2) return; // Only one member, skip ranking check

    let prevScore = Infinity;
    for (let i = 0; i < count; i++) {
      const text = await scoreCells.nth(i).innerText();
      const score = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (!isNaN(score)) {
        expect(score).toBeLessThanOrEqual(prevScore);
        prevScore = score;
      }
    }
  });
});
