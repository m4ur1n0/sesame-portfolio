import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {};

export default nextConfig;

// exposes D1/R2 bindings to `next dev` via the local workerd runtime (macOS 13.5+).
// Builds don't need it: every data-reading route renders per request.
if (process.argv.includes("dev")) initOpenNextCloudflareForDev();
