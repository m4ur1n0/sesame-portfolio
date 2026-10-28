// bindings from wrangler.jsonc; hand-written because `wrangler types` needs workerd
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    MEDIA: R2Bucket;
    TURNSTILE_SITE_KEY: string;
    // secrets
    ADMIN_PASSWORD: string;
    SESSION_SECRET: string;
    TURNSTILE_SECRET_KEY: string;
  }
}

export {};
