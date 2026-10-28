// Random identifiers for orders. Pure (Web Crypto only), so they run in Workers and in tests.

// No 0/O, 1/I/L or U, so references survive being read out over the phone.
export const REFERENCE_ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

export function generateReference(): string {
  const n = REFERENCE_ALPHABET.length;
  // Rejection sampling keeps every character equally likely.
  const limit = 256 - (256 % n);
  let out = "";
  while (out.length < 6) {
    const bytes = crypto.getRandomValues(new Uint8Array(12));
    for (const b of bytes) {
      if (b < limit && out.length < 6) out += REFERENCE_ALPHABET[b % n];
    }
  }
  return `SNB-${out}`;
}

// 32 random bytes as base64url: 43 URL-safe characters.
export function generateAccessToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Compares secrets without exiting early on the first mismatching character.
export function constantTimeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}
