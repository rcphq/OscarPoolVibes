const siteAdminEmails = new Set(
  (process.env.SITE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export function isSiteAdmin(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  return siteAdminEmails.has(email.trim().toLowerCase());
}

export function isSiteAdminConfigured(): boolean {
  return siteAdminEmails.size > 0;
}

