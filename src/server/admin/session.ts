// Pure WebCrypto helpers for the admin session; no bindings, so they run in unit tests too.

export const SESSION_COOKIE = "snobi_admin";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MIN_SECRET_LENGTH = 32;

const encoder = new TextEncoder();

function toBase64Url(buffer: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

const payload = (expiresMs: number) => encoder.encode(`snobi-admin:${expiresMs}`);

export async function signSession(secret: string, expiresMs: number): Promise<string> {
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(secret), payload(expiresMs));
  return `${expiresMs}.${toBase64Url(signature)}`;
}

export async function verifySession(
  secret: string,
  token: string | undefined,
  now = Date.now(),
): Promise<boolean> {
  if (!token) return false;
  const match = /^(\d{1,16})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match?.[1] || !match[2]) return false;
  const expiresMs = Number(match[1]);
  if (!Number.isSafeInteger(expiresMs) || expiresMs <= now) return false;
  // subtle.verify compares the MAC in constant time.
  return crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret),
    fromBase64Url(match[2]),
    payload(expiresMs),
  );
}

// Hashing both sides first gives equal-length inputs, so the loop's timing reveals nothing
// about the password's length or content.
export async function passwordMatches(input: string, expected: string): Promise<boolean> {
  if (!expected) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(input)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

// Returns an owner-facing explanation when the admin secrets are not set up, otherwise null.
export function adminConfigProblem(
  adminPassword: string | undefined,
  sessionSecret: string | undefined,
): string | null {
  if (!adminPassword) {
    return "ADMIN_PASSWORD is not set. Add it to .dev.vars for local use, or run `npx wrangler secret put ADMIN_PASSWORD` for the live site.";
  }
  if (!sessionSecret || sessionSecret.length < MIN_SECRET_LENGTH) {
    return `SESSION_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters. Generate one with \`openssl rand -base64 32\` and add it to .dev.vars, or run \`npx wrangler secret put SESSION_SECRET\` for the live site.`;
  }
  return null;
}
