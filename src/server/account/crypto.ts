// Pure WebCrypto helpers for customer accounts; no bindings, so they run in unit tests too.
import { fromBase64Url, hmacKey, toBase64Url } from "../admin/session";

const encoder = new TextEncoder();

export const USER_COOKIE = "snobi_user";
export const USER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Workers' free plan allows 10 ms of CPU per request, so this can't reach the iteration counts
// recommended for servers. The count is stored in each hash, so it can be raised for new
// passwords later (e.g. on the paid plan); login attempts are rate limited in the meantime.
export const PBKDF2_ITERATIONS = 50_000;

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
}

export async function hashPassword(password: string, iterations = PBKDF2_ITERATIONS) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, iterations);
  return `pbkdf2$${iterations}$${toBase64Url(salt.buffer)}$${toBase64Url(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterations, salt, expected] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterations || !salt || !expected) return false;
  const actual = new Uint8Array(await derive(password, fromBase64Url(salt), Number(iterations)));
  const wanted = fromBase64Url(expected);
  if (actual.length !== wanted.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= (actual[i] ?? 0) ^ (wanted[i] ?? 0);
  return diff === 0;
}

// The "snobi-user:" prefix keeps a customer cookie from ever passing as an admin one, which signs
// a different payload with the same secret.
const payload = (userId: string, version: number, expiresMs: number) =>
  encoder.encode(`snobi-user:${userId}:${version}:${expiresMs}`);

export async function signUserSession(
  secret: string,
  userId: string,
  version: number,
  expiresMs: number,
) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret),
    payload(userId, version, expiresMs),
  );
  return `${userId}.${version}.${expiresMs}.${toBase64Url(signature)}`;
}

export async function readUserSession(
  secret: string,
  token: string | undefined,
  now = Date.now(),
): Promise<{ userId: string; version: number } | null> {
  if (!token) return null;
  const match = /^([\w-]{1,64})\.(\d{1,9})\.(\d{1,16})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match?.[1] || !match[2] || !match[3] || !match[4]) return null;
  const userId = match[1];
  const version = Number(match[2]);
  const expiresMs = Number(match[3]);
  if (!Number.isSafeInteger(expiresMs) || expiresMs <= now) return null;
  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(secret),
    fromBase64Url(match[4]),
    payload(userId, version, expiresMs),
  );
  return valid ? { userId, version } : null;
}
