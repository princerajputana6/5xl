import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "@/server/schema";

/**
 * Cloudflare D1 (SQLite) access via Drizzle ORM.
 *
 * D1 is a binding, not a network socket — there is no connection to open, pool
 * or cache, and none of the per-request isolation problems MongoDB had on
 * Workers. Each call wraps the request's `env.DB` binding in a Drizzle client;
 * creating the wrapper is free.
 */
export type DB = DrizzleD1Database<typeof schema>;

/** The D1 binding type, taken from what `drizzle()` accepts (no global types needed). */
type D1Binding = Parameters<typeof drizzle>[0];
type EnvWithDB = { DB: D1Binding };

/** Drizzle client bound to the current request's D1 database. */
export function db(): DB {
  const { env } = getCloudflareContext();
  const binding = (env as unknown as EnvWithDB).DB;
  if (!binding) {
    throw new Error(
      "D1 binding `DB` is not available. Check `d1_databases` in wrangler.jsonc."
    );
  }
  return drizzle(binding, { schema });
}

export { schema };
