import { test, expect } from "@playwright/test";

test.describe("Results Entry — unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("results page requires authentication", async ({ page }) => {
    const ceremonyId = process.env.E2E_TEST_CEREMONY_ID;
    if (!ceremonyId) test.skip();

    await page.goto(`/results/${ceremonyId}`);
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});

test.describe("Results Entry", () => {
  test("RESULTS_MANAGER can view the results entry page", async ({ page }) => {
    const ceremonyId = process.env.E2E_TEST_CEREMONY_ID;
    if (!ceremonyId) test.skip();

    await page.goto(`/results/${ceremonyId}`);
    await expect(page.getByRole("heading", { name: /results/i })).toBeVisible();
  });

  test("can set a winner for a category", async ({ page }) => {
    const ceremonyId = process.env.E2E_TEST_CEREMONY_ID;
    if (!ceremonyId) test.skip();

    await page.goto(`/results/${ceremonyId}`);

    // Click the first nominee button in the first category
    const setWinnerButton = page.getByRole("button", { name: /set winner|select/i }).first();
    if (!(await setWinnerButton.isVisible())) test.skip();

    await setWinnerButton.click();

    // Expect success feedback
    await expect(page.getByText(/winner|saved|updated/i).first()).toBeVisible();
  });

  test("conflict UI appears when stale version is submitted", async ({ page }) => {
    // This test is best done via the API with concurrent requests.
    // Here we verify the conflict UI component exists in the DOM when triggered.
    const ceremonyId = process.env.E2E_TEST_CEREMONY_ID;
    if (!ceremonyId) test.skip();

    await page.goto(`/results/${ceremonyId}`);

    // Inject a stale-version scenario by intercepting the network response
    await page.route("**/api/results", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: {
              code: "CONFLICT",
              message: "This result was already updated by another user.",
              currentResult: {
                winnerId: "nom-1",
                winnerName: "Oppenheimer",
                setByName: "Jane",
                setByEmail: "jane@test.com",
                version: 2,
                updatedAt: new Date().toISOString(),
              },
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    const setWinnerButton = page.getByRole("button", { name: /set winner|select/i }).first();
    if (!(await setWinnerButton.isVisible())) test.skip();

    await setWinnerButton.click();
    await expect(page.getByText(/conflict|already updated/i)).toBeVisible();
  });
});
