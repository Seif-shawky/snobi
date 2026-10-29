import { env } from "cloudflare:workers";

// The IMAGES R2 binding is optional: the site runs without photo storage (product pages fall
// back to the mascot, the homepage to the bundled drawing) until R2 is enabled on the account.
export function imagesBucket(): R2Bucket | null {
  return (env as { IMAGES?: R2Bucket }).IMAGES ?? null;
}

export const PHOTO_STORAGE_MISSING =
  "Photo storage (Cloudflare R2) isn't set up yet, so photos can't be uploaded. Everything else works.";
