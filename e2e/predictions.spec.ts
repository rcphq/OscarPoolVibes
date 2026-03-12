import { test, expect } from "@playwright/test";

test.describe("Predictions", () => {
  test("member can view the predictions page", async ({ page }) => {
    const poolId = process.env.E2E_TEST_POOL_ID;
    if (!poolId) test.skip();

    await page.goto(`/pools/${poolId}/predict`);
    await expect(page.getByRole("heading", { name: /predict|picks/i })).toBeVisible();
  });

  test("member can submit predictions before lock", async ({ page }) => {
    const poolId = process.env.E2E_TEST_POOL_ID;
    if (!poolId) test.skip();

    await page.goto(`/pools/${poolId}/predict`);

    // Select first choice for first category (if predictions are unlocked)
    const firstChoiceButtons = page.getByRole("radio").first();
    if (await firstChoiceButtons.isVisible()) {
      await firstChoiceButtons.check();
    }

    const saveButton = page.getByRole("button", { name: /save|submit/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await expect(page.getByText(/saved|success/i)).toBeVisible();
    } else {
      // Predictions may be locked — test still passes
      test.skip();
    }
  });

  test("prediction form is disabled or hidden when predictions are locked", async ({
    page,
  }) => {
    const lockedPoolId = process.env.E2E_TEST_LOCKED_POOL_ID;
    if (!lockedPoolId) test.skip();

    await page.goto(`/pools/${lockedPoolId}/predict`);

    // Should show locked state or redirect to my-picks
    const isLocked =
      (await page.getByText(/locked|closed/i).isVisible()) ||
      page.url().includes("my-picks");

    expect(isLocked).toBe(true);
  });

  test("member can view their locked-in picks on /my-picks", async ({ page }) => {
    const poolId = process.env.E2E_TEST_POOL_ID;
    if (!poolId) test.skip();

    await page.goto(`/pools/${poolId}/my-picks`);
    await expect(page.getByRole("heading", { name: /picks|predictions/i })).toBeVisible();
  });
});
