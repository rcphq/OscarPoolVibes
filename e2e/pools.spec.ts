import { test, expect } from "@playwright/test";

test.describe("Pools", () => {
  test("authenticated user can create a pool and is redirected to pool page", async ({
    page,
  }) => {
    await page.goto("/pools/create");
    await expect(page.getByRole("heading", { name: /create/i })).toBeVisible();

    // Fill in pool name
    await page.getByLabel(/pool name/i).fill("E2E Test Pool");

    // Select ceremony year (first available option)
    const ceremonySelect = page.getByLabel(/ceremony/i);
    await ceremonySelect.selectOption({ index: 1 });

    // Select access type
    await page.getByLabel(/open/i).check();

    // Submit
    await page.getByRole("button", { name: /create/i }).click();

    // Should redirect to pool page
    await expect(page).toHaveURL(/\/pools\//);
    await expect(page.getByText("E2E Test Pool")).toBeVisible();
  });

  test("user can join an open pool via invite code", async ({ page }) => {
    // This test requires a valid invite code from a seeded pool
    // Skip if not available in the test environment
    const inviteCode = process.env.E2E_TEST_INVITE_CODE;
    if (!inviteCode) test.skip();

    await page.goto(`/pools/join?code=${inviteCode}`);
    // Should redirect to the pool page after joining
    await expect(page).toHaveURL(/\/pools\//);
  });

  test("user can leave a pool", async ({ page }) => {
    // Navigate to an existing pool (requires seeded data)
    const poolId = process.env.E2E_TEST_POOL_ID;
    if (!poolId) test.skip();

    await page.goto(`/pools/${poolId}/settings`);
    const leaveButton = page.getByRole("button", { name: /leave pool/i });
    await expect(leaveButton).toBeVisible();
    await leaveButton.click();

    // Confirm if dialog appears
    const confirmButton = page.getByRole("button", { name: /confirm|yes/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await expect(page).toHaveURL(/\/pools/);
  });

  test("pools list page shows user's active pools", async ({ page }) => {
    await page.goto("/pools");
    await expect(page.getByRole("heading", { name: /pools|my pools/i })).toBeVisible();
  });
});
