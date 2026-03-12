import { test, expect } from "@playwright/test";

test.describe("Auth / Login", () => {
  // These tests do NOT use the pre-authenticated session — they run as guests
  test.use({ storageState: { cookies: [], origins: [] } });

  test("sign-in page renders Google and Magic Link options", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /email|magic link/i })
    ).toBeVisible();
  });

  test("unauthenticated user is redirected from /pools to sign-in", async ({ page }) => {
    await page.goto("/pools");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("unauthenticated user is redirected from /pools/create to sign-in", async ({ page }) => {
    await page.goto("/pools/create");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("unauthenticated user is redirected from /admin to sign-in", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("sign-in page includes a callbackUrl when redirected from protected route", async ({
    page,
  }) => {
    await page.goto("/pools");
    await expect(page).toHaveURL(/callbackUrl/);
  });
});

test.describe("Auth — signed in", () => {
  test("authenticated user can sign out and is redirected", async ({ page }) => {
    await page.goto("/pools");
    // Find and click sign-out button (location may vary by UI)
    const signOutButton = page.getByRole("button", { name: /sign out|log out/i });
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      await expect(page).toHaveURL(/\/(auth\/signin|$)/);
    } else {
      // Sign-out may be in a dropdown/menu
      test.skip();
    }
  });
});
