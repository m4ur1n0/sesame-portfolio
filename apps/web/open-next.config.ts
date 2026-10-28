import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// every page reads D1 per request, so no incremental cache is configured
export default defineCloudflareConfig();
