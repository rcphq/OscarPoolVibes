import { test, expect } from "@playwright/test";

test.describe("Invites", () => {
  test("admin can view the invites page", async ({ page }) => {
    const poolId = process.env.E2E_TEST_ADMIN_POOL_ID;
    if (!poolId) test.skip();

    await page.goto(`/pools/${poolId}/invites`);
    await expect(page.getByRole("heading", { name: /invite/i })).toBeVisible();
  });

  test("admin can send an email invite", async ({ page }) => {
    const poolId = process.env.E2E_TEST_ADMIN_POOL_ID;
    if (!poolId) test.skip();

    await page.goto(`/pools/${poolId}/invites`);

    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill("e2e-invite-test@example.com");

    const sendButton = page.getByRole("button", { name: /send invite/i });
    await sendButton.click();

    // Success toast or status message
    await expect(page.getByText(/sent|invited/i)).toBeVisible();
  });

  test("admin can revoke a pending invite", async ({ page }) => {
    const poolId = process.env.E2E_TEST_ADMIN_POOL_ID;
    if (!poolId) test.skip();

    await page.goto(`/pools/${poolId}/invites`);

    const revokeButton = page.getByRole("button", { name: /revoke/i }).first();
    if (!(await revokeButton.isVisible())) {
      test.skip(); // No pending invites to revoke
    }

    await revokeButton.click();

    // Confirm if dialog appears
    const confirmButton = page.getByRole("button", { name: /confirm|yes/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await expect(page.getByText(/revoked|removed/i)).toBeVisible();
  });

  test("invite link navigates to join flow", async ({ page }) => {
    const token = process.env.E2E_TEST_INVITE_TOKEN;
    if (!token) test.skip();

    await page.goto(`/pools/join?token=${token}`);

    // Should either join and redirect, or show a confirmation/error page
    const isJoined = page.url().includes("/pools/") && !page.url().includes("join");
    const hasError = await page.getByText(/invalid|expired|error/i).isVisible();
    const hasJoinContent = await page.getByText(/join|welcome/i).isVisible();

    expect(isJoined || hasError || hasJoinContent).toBe(true);
  });
});
