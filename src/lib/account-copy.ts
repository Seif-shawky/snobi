// English and Arabic text for account error codes (zod rules and AccountError).
const MESSAGES: Record<string, [string, string]> = {
  snobi_required: ["Pick a Snobi. Any Snobi.", "اختار سنوبي. أي سنوبي."],
  snobi_unavailable: [
    "That Snobi just retired. Pick another one.",
    "السنوبي ده لسه طالع معاش. اختار غيره.",
  ],
  display_name_required: [
    "What do we call you? Two letters at least.",
    "نقولك إيه؟ حرفين على الأقل.",
  ],
  display_name_too_long: ["Keep the name to 30 characters.", "خلّي الاسم ٣٠ حرف بالكتير."],
  display_name_invalid: [
    "Just a name, please: no links, emails or phone numbers.",
    "اسم بس لو سمحت: من غير لينكات أو إيميلات أو أرقام تليفون.",
  ],
  display_name_taken: ["That name’s taken. By him. Forever.", "الاسم ده محجوز. ليه هو. للأبد."],
  title_required: ["Two letters at least, or leave it empty.", "حرفين على الأقل، أو سيبه فاضي."],
  title_too_long: ["Keep the title to 40 characters.", "خلّي اللقب ٤٠ حرف بالكتير."],
  title_invalid: [
    "Just a title, please: no links, emails or phone numbers.",
    "لقب بس لو سمحت: من غير لينكات أو إيميلات أو أرقام تليفون.",
  ],
  phone_invalid: [
    "Enter an Egyptian mobile number, like 01012345678.",
    "اكتب رقم موبايل مصري، زي 01012345678.",
  ],
  phone_taken: ["This number already has a Snobi.", "الرقم ده عنده سنوبي بالفعل."],
  password_required: ["Enter your password.", "اكتب الباسورد."],
  password_too_short: [
    "At least 8 characters. Snobi’s is 4. Don’t be Snobi.",
    "٨ حروف على الأقل. باسورد سنوبي ٤. متبقاش زيه.",
  ],
  password_too_long: ["That’s too long. 128 characters at most.", "طويل أوي. ١٢٨ حرف بالكتير."],
  bad_credentials: ["Wrong mobile number or password.", "رقم الموبايل أو الباسورد غلط."],
  too_many_attempts: [
    "Too many tries. Wait 15 minutes and try again.",
    "محاولات كتير. استنى ١٥ دقيقة وجرّب تاني.",
  ],
};

export function accountErrorText(code: string, ar: boolean) {
  const pair = MESSAGES[code];
  if (pair) return ar ? pair[1] : pair[0];
  return ar ? "حصلت مشكلة. جرّب تاني." : "Something went wrong. Try again.";
}

export interface FieldErrors {
  snobiOptionId?: string;
  displayName?: string;
  title?: string;
  phone?: string;
  password?: string;
  currentPassword?: string;
  newPassword?: string;
  form?: string;
}
export type ErrorField = keyof FieldErrors;

// Keeps the first error per field, in the order zod reported them.
export function fieldErrors(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    errors[String(issue.path[0]) as ErrorField] ??= issue.message;
  }
  return errors;
}
