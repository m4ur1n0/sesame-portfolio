import type { MetadataRoute } from "next";
import { listPublished } from "@/lib/db";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const artworks = await listPublished();
  return [
    ...["", "/gallery", "/purchase", "/contact"].map((path) => ({ url: `${SITE.url}${path}` })),
    ...artworks.map((a) => ({
      url: `${SITE.url}/gallery/${a.slug}`,
      lastModified: a.updated_at.replace(" ", "T") + "Z",
    })),
  ];
}
