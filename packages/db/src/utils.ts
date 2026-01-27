import { and, isNull, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { db } from "./client";

// ============================================================================
// Transaction Helper
// ============================================================================

type TransactionClient = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Execute a function within a database transaction.
 * Automatically rolls back on error.
 *
 * @example
 * ```ts
 * const result = await withTransaction(async (tx) => {
 *   const [flag] = await tx.insert(flags).values({...}).returning();
 *   await tx.insert(flagsToTargetGroups).values([...]);
 *   return flag;
 * });
 * ```
 */
export function withTransaction<T>(
	fn: (tx: TransactionClient) => Promise<T>
): Promise<T> {
	return db.transaction(fn);
}

/**
 * Type for the transaction client, useful for typing function parameters.
 *
 * @example
 * ```ts
 * async function createFlagWithGroups(
 *   tx: DbTransaction,
 *   flagData: NewFlag,
 *   groupIds: string[]
 * ) { ... }
 * ```
 */
export type DbTransaction = TransactionClient;

/**
 * Type for either the main db client or a transaction client.
 * Use this when a function should work with both.
 *
 * @example
 * ```ts
 * async function findUser(db: DbClient, id: string) {
 *   return db.query.users.findFirst({ where: eq(users.id, id) });
 * }
 *
 * // Works with main db
 * await findUser(db, "123");
 *
 * // Works inside transaction
 * await withTransaction(async (tx) => {
 *   await findUser(tx, "123");
 * });
 * ```
 */
export type DbClient = typeof db | TransactionClient;

// ============================================================================
// Soft Delete Helpers
// ============================================================================

/**
 * Creates a condition that filters out soft-deleted records.
 * Use this to avoid repeating `isNull(table.deletedAt)` everywhere.
 *
 * @example
 * ```ts
 * // Instead of:
 * db.select().from(flags).where(and(eq(flags.id, id), isNull(flags.deletedAt)))
 *
 * // Use:
 * db.select().from(flags).where(and(eq(flags.id, id), notDeleted(flags)))
 * ```
 */
export function notDeleted<T extends { deletedAt: PgColumn }>(table: T): SQL {
	return isNull(table.deletedAt);
}

/**
 * Combines a condition with the soft-delete filter.
 *
 * @example
 * ```ts
 * // Instead of:
 * .where(and(eq(flags.id, id), isNull(flags.deletedAt)))
 *
 * // Use:
 * .where(whereNotDeleted(flags, eq(flags.id, id)))
 * ```
 */
export function whereNotDeleted<T extends { deletedAt: PgColumn }>(
	table: T,
	...conditions: (SQL | undefined)[]
): SQL {
	return and(notDeleted(table), ...conditions) as SQL;
}

// ============================================================================
// Database Error Helpers
// ============================================================================

/**
 * PostgreSQL error codes for common constraint violations.
 */
export const PgErrorCode = {
	UNIQUE_VIOLATION: "23505",
	FOREIGN_KEY_VIOLATION: "23503",
	NOT_NULL_VIOLATION: "23502",
	CHECK_VIOLATION: "23514",
} as const;

/**
 * Typed database error with constraint information.
 */
export interface DbConstraintError {
	code: string;
	constraint?: string;
	detail?: string;
	table?: string;
	column?: string;
}

/**
 * Type guard to check if an error is a database constraint error.
 *
 * @example
 * ```ts
 * try {
 *   await db.insert(links).values({ slug: "taken" });
 * } catch (error) {
 *   if (isDbConstraintError(error)) {
 *     console.log(error.code, error.constraint);
 *   }
 * }
 * ```
 */
export function isDbConstraintError(
	error: unknown
): error is DbConstraintError & Error {
	return (
		error instanceof Error &&
		"code" in error &&
		typeof (error as DbConstraintError).code === "string"
	);
}

/**
 * Check if an error is a unique constraint violation.
 *
 * @example
 * ```ts
 * try {
 *   await db.insert(links).values({ slug: "taken" });
 * } catch (error) {
 *   if (isUniqueViolation(error)) {
 *     throw new ORPCError("CONFLICT", { message: "Already exists" });
 *   }
 *   throw error;
 * }
 * ```
 */
export function isUniqueViolation(error: unknown): boolean {
	return (
		isDbConstraintError(error) && error.code === PgErrorCode.UNIQUE_VIOLATION
	);
}

/**
 * Check if an error is a unique constraint violation for a specific constraint.
 *
 * @example
 * ```ts
 * if (isUniqueViolationFor(error, "links_slug_unique")) {
 *   throw new ORPCError("CONFLICT", { message: "Slug already taken" });
 * }
 * ```
 */
export function isUniqueViolationFor(
	error: unknown,
	constraintName: string
): boolean {
	return (
		isDbConstraintError(error) &&
		error.code === PgErrorCode.UNIQUE_VIOLATION &&
		error.constraint === constraintName
	);
}

/**
 * Check if an error is a foreign key constraint violation.
 */
export function isForeignKeyViolation(error: unknown): boolean {
	return (
		isDbConstraintError(error) &&
		error.code === PgErrorCode.FOREIGN_KEY_VIOLATION
	);
}

/**
 * Handle a unique constraint violation with a custom error.
 * Returns undefined if not a unique violation, allowing chaining.
 *
 * @example
 * ```ts
 * try {
 *   await db.insert(links).values({ slug });
 * } catch (error) {
 *   throwIfUniqueViolation(error, "links_slug_unique", () =>
 *     new ORPCError("CONFLICT", { message: "Slug taken" })
 *   );
 *   throw error;
 * }
 * ```
 */
export function throwIfUniqueViolation(
	error: unknown,
	constraintName: string,
	createError: () => Error
): void {
	if (isUniqueViolationFor(error, constraintName)) {
		throw createError();
	}
}
