import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config — generates SQLite migrations from `src/server/schema.ts`
 * into `./drizzle`. Migrations are applied to Cloudflare D1 with
 * `wrangler d1 migrations apply <db> --local|--remote`.
 */
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/schema.ts",
  out: "./drizzle",
});
