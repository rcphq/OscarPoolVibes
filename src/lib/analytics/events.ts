export type EventMap = {
  // Auth
  auth_sign_in_clicked: { method: "google" | "email" }
  auth_sign_in_failed: { method: string; error: string }

  // Pool
  pool_created: { poolId: string; accessType: string; ceremonyYear: string }
  pool_viewed: { poolId: string }
  pool_joined: { poolId: string; method: "code" | "invite" }
  pool_settings_updated: { poolId: string }
  pool_archived: { poolId: string }
  pool_left: { poolId: string }
  pool_invite_link_copied: { poolId: string }

  // Invite
  invite_sent: { poolId: string }
  invite_revoked: { poolId: string }
  invite_link_clicked: { poolId: string; method: string }

  // Prediction
  predictions_saved: { poolId: string; categoryCount: number }

  // Leaderboard
  leaderboard_viewed: { poolId: string; memberCount: number }

  // Results
  result_set: { ceremonyYearId: string; categoryId: string }
  result_conflict: { ceremonyYearId: string; categoryId: string }

  // Admin
  admin_predictions_locked: { ceremonyYearId: string; locked: boolean }
  admin_ceremony_created: { ceremonyYearId: string }
  member_role_changed: { poolId: string; newRole: string }
  member_removed: { poolId: string }
}

export type EventName = keyof EventMap
