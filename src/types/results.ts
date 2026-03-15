/**
 * Types for the results management system.
 *
 * Results are global per ceremony - Oscar winners are the same for every pool.
 * Permissions to set results are granted at the pool level:
 * - Pool creators (ADMIN) always have permission
 * - RESULTS_MANAGER role can be granted to specific pool members
 *
 * Conflict prevention uses optimistic concurrency control (version field).
 */

export type SetResultRequest = {
  categoryId: string;
  winnerId: string;
  /** Current version the client last saw. Null for first-time set. */
  expectedVersion: number | null;
};

export type SetResultResponse =
  | { success: true; version: number }
  | { success: false; error: ResultError };

export type ResultError =
  | { code: "CONFLICT"; message: string; currentResult: ConflictDetail }
  | { code: "UNAUTHORIZED"; message: string }
  | { code: "INVALID_NOMINEE"; message: string }
  | { code: "CATEGORY_NOT_FOUND"; message: string };

export type ConflictDetail = {
  winnerId: string;
  winnerName: string;
  setByName: string;
  setByEmail: string;
  version: number;
  updatedAt: string;
};

export type UnsetResultRequest = {
  categoryId: string;
  /** Current version the client last saw. Required to prevent accidental overwrites. */
  expectedVersion: number;
};

export type UnsetResultResponse =
  | { success: true }
  | { success: false; error: ResultError };

export type CategoryResultView = {
  categoryId: string;
  categoryName: string;
  winnerId: string | null;
  winnerName: string | null;
  setByName: string | null;
  version: number;
  updatedAt: string | null;
};

export type ResultsPermission = {
  canSetResults: boolean;
  reason: "pool_creator" | "results_manager" | "no_permission";
};
