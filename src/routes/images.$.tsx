import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

// Streams product images uploaded through the admin from the IMAGES R2 bucket.
export const Route = createFileRoute("/images/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params._splat ?? "";
        if (!/^products\/[\w-]+\/[\w.-]+$/.test(key))
          return new Response("Not found", { status: 404 });
        const object = await env.IMAGES.get(key);
        if (!object) return new Response("Not found", { status: 404 });
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        // Keys are unique per upload, so images can be cached indefinitely.
        headers.set("cache-control", "public, max-age=31536000, immutable");
        return new Response(object.body, { headers });
      },
    },
  },
});
