/**
 * Types for the results management system.
 *
 * Results are global per ceremony - Oscar winners are the same for every pool.
 * Permissions to set results are granted at the pool level:
 * - Pool creators (ADMIN) always have permission
 * - RESULTS_MANAGER role can be granted to specific pool members
 *
 * Conflict prevention uses optimistic concurrency control (version field).
 *
 * Ties: When a category results in a tie, both `winnerId` and `tiedWinnerId`
 * are set. Scoring awards full points for a match against either winner.
 */

export type SetResultRequest = {
  categoryId: string;
  winnerId: string;
  /** Optional second winner for tied categories. Must differ from winnerId and
   *  belong to the same category. When null/omitted the result is treated as
   *  a normal (non-tied) single winner. */
  tiedWinnerId?: string | null;
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
  | { code: "INVALID_TIED_NOMINEE"; message: string }
  | { code: "CATEGORY_NOT_FOUND"; message: string };

export type ConflictDetail = {
  winnerId: string;
  winnerName: string;
  /** Null when the conflicting result was not a tie. */
  tiedWinnerId: string | null;
  tiedWinnerName: string | null;
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
  /** Null when the result is not a tie. */
  tiedWinnerId: string | null;
  tiedWinnerName: string | null;
  setByName: string | null;
  version: number;
  updatedAt: string | null;
};

export type ResultsPermission = {
  canSetResults: boolean;
  reason: "pool_creator" | "results_manager" | "no_permission";
};
