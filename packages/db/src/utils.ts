import { isNull } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "./client";

export function notDeleted<T extends PgTable>(
	table: T & { deletedAt: unknown }
) {
	return isNull(table.deletedAt);
}

export function withTransaction<T>(
	callback: (tx: typeof db) => Promise<T>
): Promise<T> {
	return db.transaction(callback);
}

export function isUniqueViolationFor(
	error: unknown,
	constraintName: string
): boolean {
	if (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		"constraint" in error
	) {
		return (
			error.code === "23505" && error.constraint === constraintName
		);
	}
	return false;
}
