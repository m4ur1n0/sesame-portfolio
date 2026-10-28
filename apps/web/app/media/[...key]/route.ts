import { env } from "@/lib/db";

const KEY = /^[0-9a-f-]{36}\/(thumb|large)\.(webp|jpg)$/;

// keys are random and never reused, so files can be cached forever
export async function GET(_request: Request, ctx: RouteContext<"/media/[...key]">) {
  const key = (await ctx.params).key.join("/");
  if (!KEY.test(key)) return new Response("Not found", { status: 404 });

  const object = await env().MEDIA.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body as ReadableStream, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      ETag: object.httpEtag,
    },
  });
}
