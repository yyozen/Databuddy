/** biome-ignore-all lint/performance/noNamespaceImport: "Required" */

import { drizzle } from "drizzle-orm/node-postgres";
import * as relations from "./drizzle/relations";
import * as schema from "./drizzle/schema";

const fullSchema = { ...schema, ...relations };

const databaseUrl = "postgres://databuddy:databuddy_dev_password@localhost:5432/databuddy";

if (!databaseUrl) {
	throw new Error("DATABASE_URL is not set");
}

export const db = drizzle(databaseUrl, { schema: fullSchema });
