import { isAdmin } from "@/lib/auth";
import { env } from "@/lib/db";
import { mediaKey } from "@/lib/media";

const TYPES: Record<string, "webp" | "jpg"> = { "image/webp": "webp", "image/jpeg": "jpg" };
const MAX_BYTES = 8 * 1024 * 1024;

// receives the two browser-resized variants of one image and stores them in R2
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData();
  const thumb = form.get("thumb");
  const large = form.get("large");
  if (!(thumb instanceof File) || !(large instanceof File)) {
    return Response.json({ error: "thumb and large files are required" }, { status: 400 });
  }

  const ext = TYPES[large.type];
  if (!ext || TYPES[thumb.type] !== ext) {
    return Response.json({ error: "images must be WebP or JPEG" }, { status: 400 });
  }
  if (thumb.size > MAX_BYTES || large.size > MAX_BYTES) {
    return Response.json({ error: "image too large" }, { status: 413 });
  }

  const img = { id: crypto.randomUUID(), ext };
  const httpMetadata = { contentType: large.type };
  await Promise.all([
    env().MEDIA.put(mediaKey(img, "thumb"), await thumb.arrayBuffer(), { httpMetadata }),
    env().MEDIA.put(mediaKey(img, "large"), await large.arrayBuffer(), { httpMetadata }),
  ]);

  return Response.json(img);
}
