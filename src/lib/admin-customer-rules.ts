// Pure rules for /admin/customers, safe for the browser and unit tests.

// No i, l, o, 0 or 1, which look alike when read off a screen and typed on a phone.
const TEMP_PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const TEMP_PASSWORD_GROUPS = 3;
const TEMP_PASSWORD_GROUP_LENGTH = 4;

// e.g. "k7mp-3xqr-9tbn": 12 random characters, about 59 bits.
export function generateTempPassword(): string {
  const size = TEMP_PASSWORD_ALPHABET.length;
  // Bytes at or above this would favour the first letters of the alphabet.
  const limit = 256 - (256 % size);
  const wanted = TEMP_PASSWORD_GROUPS * TEMP_PASSWORD_GROUP_LENGTH;
  let chars = "";
  while (chars.length < wanted) {
    for (const byte of crypto.getRandomValues(new Uint8Array(wanted * 2))) {
      if (byte < limit && chars.length < wanted) chars += TEMP_PASSWORD_ALPHABET[byte % size];
    }
  }
  return chars.match(new RegExp(`.{${TEMP_PASSWORD_GROUP_LENGTH}}`, "g"))!.join("-");
}

export interface CustomerSearch {
  // LIKE patterns; digits is null when the search can't be part of a mobile number.
  name: string;
  digits: string | null;
}

const escapeLike = (text: string) => text.replace(/[\\%_]/g, "\\$&");

// Mobiles are stored as 01XXXXXXXXX, so "+20 10 12" has to search for "01012".
export function customerSearch(raw: string): CustomerSearch | null {
  const text = raw.trim();
  if (!text) return null;
  const western = text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  let digits: string | null = null;
  if (/^[+\d\s\-().]+$/.test(western) && /\d/.test(western)) {
    digits = western.replace(/\D/g, "");
    if (digits.startsWith("0020")) digits = `0${digits.slice(4)}`;
    else if (digits.startsWith("20") && (western.startsWith("+") || digits.length === 12)) {
      digits = `0${digits.slice(2)}`;
    }
  }
  return { name: `%${escapeLike(text)}%`, digits: digits && `%${digits}%` };
}

const MODERATION_MESSAGES: Record<string, string> = {
  display_name_required: "The name needs at least 2 characters",
  display_name_too_long: "The name can be 30 characters at most",
  display_name_invalid: "Names can't contain links, email addresses or phone numbers",
  display_name_taken: "Only the original can be called Snobi",
  title_required: "The title needs at least 2 characters, or leave it empty",
  title_too_long: "The title can be 40 characters at most",
  title_invalid: "Titles can't contain links, email addresses or phone numbers",
};

// The account schemas report codes that the customer pages translate; the admin is English only.
export function moderationMessage(code: string): string {
  return MODERATION_MESSAGES[code] ?? "This doesn't look right";
}

export function customerVisibilityLabel(isPublic: boolean, hiddenByAdmin: boolean) {
  if (hiddenByAdmin) return "Hidden by you";
  return isPublic ? "Public" : "Hidden by them";
}
