import type { ArtworkImage } from "./types";

// ponytail: served by this Worker at /media/*. Once the site has its own domain, attach a
// custom domain to the R2 bucket (e.g. https://media.example.com) and put it here — images
// then come straight from Cloudflare's CDN without invoking the Worker.
export const MEDIA_BASE = "/media";

export type Variant = "thumb" | "large";

export function mediaKey(img: Pick<ArtworkImage, "id" | "ext">, variant: Variant) {
  return `${img.id}/${variant}.${img.ext}`;
}

export function mediaUrl(img: Pick<ArtworkImage, "id" | "ext">, variant: Variant) {
  return `${MEDIA_BASE}/${mediaKey(img, variant)}`;
}
