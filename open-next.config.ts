import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext configuration for Cloudflare Workers.
 *
 * First cut uses the default in-memory setup (no incremental cache binding).
 * To enable ISR/Data Cache later, wire an R2 or KV incremental cache here, e.g.
 *   import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
 *   export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache });
 */
export default defineCloudflareConfig();
