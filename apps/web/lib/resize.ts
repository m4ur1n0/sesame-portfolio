// Browser-side image preparation: originals (often 10–25 MB camera files) never leave
// the admin's machine. Each upload becomes two web-sized variants.

const LARGE_EDGE = 2400; // detail page + lightbox
const THUMB_EDGE = 1200; // cards and grids, sharp on 2x screens
const QUALITY = 0.85;

export interface PreparedImage {
  thumb: Blob;
  large: Blob;
  ext: "webp" | "jpg";
  w: number;
  h: number;
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), type, QUALITY),
  );
}

async function encode(source: ImageBitmap, maxEdge: number, type: string) {
  const scale = Math.min(1, maxEdge / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.width * scale);
  canvas.height = Math.round(source.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return { blob: await toBlob(canvas, type), w: canvas.width, h: canvas.height };
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  // applies EXIF rotation, so phone photos come out upright
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    let large = await encode(bitmap, LARGE_EDGE, "image/webp");
    let type = "image/webp";
    // older Safari can't encode WebP and silently returns PNG; fall back to JPEG
    if (large.blob.type !== "image/webp") {
      type = "image/jpeg";
      large = await encode(bitmap, LARGE_EDGE, type);
    }
    const thumb = await encode(bitmap, THUMB_EDGE, type);
    return {
      large: large.blob,
      thumb: thumb.blob,
      ext: type === "image/webp" ? "webp" : "jpg",
      w: large.w,
      h: large.h,
    };
  } finally {
    bitmap.close();
  }
}
