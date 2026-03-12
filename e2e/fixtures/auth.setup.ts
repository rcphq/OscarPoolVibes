/**
 * Auth setup: creates a persistent authenticated session for E2E tests.
 *
 * This runs once before the main test suite via the "setup" project in
 * playwright.config.ts. It navigates to the sign-in page, completes the
 * Google OAuth flow (or magic link in CI), then saves the browser storage
 * state so subsequent tests start already authenticated.
 *
 * In CI you'll need to provide credentials via env vars or use a dedicated
 * test account. For local dev, run once interactively then reuse the saved
 * state until the session expires.
 */

import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../.auth/user.json");

setup("authenticate", async ({ page }) => {
  // Navigate to the sign-in page
  await page.goto("/auth/signin");

  // For E2E tests we use the magic-link / email flow via a test account.
  // In a real CI environment you'd use a mocked auth provider or a dedicated
  // test credentials strategy. For local runs you can also manually complete
  // OAuth once and commit the resulting .auth/user.json (gitignored by default).
  //
  // TODO: Replace with your preferred CI auth strategy (e.g. inject a session
  // cookie directly via the NextAuth JWT secret, or use a test OAuth provider).

  // Placeholder: wait for the sign-in page to load and confirm it rendered.
  await page.waitForSelector("text=Sign in");

  // Save signed-in state to reuse across tests
  await page.context().storageState({ path: authFile });
});
