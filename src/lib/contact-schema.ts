import { z } from "zod";

// Pure, client-safe contact form rules shared by the form and the server function.

export const CONTACT_LIMITS = { name: 100, email: 200, messageMin: 10, messageMax: 2000 } as const;
export const CONTACT_RATE_LIMIT = 5;
export const CONTACT_RATE_WINDOW_MS = 60 * 60 * 1000;

export const ORDER_REFERENCE_PATTERN = /^SNB-[A-Z0-9]{6}$/;

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1).max(CONTACT_LIMITS.name),
  email: z.string().trim().max(CONTACT_LIMITS.email).email(),
  orderReference: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || ORDER_REFERENCE_PATTERN.test(v))
    .transform((v) => v || null),
  message: z.string().trim().min(CONTACT_LIMITS.messageMin).max(CONTACT_LIMITS.messageMax),
  // Honeypot: hidden from people, filled in by naive bots.
  website: z.string().max(500).default(""),
});

export type ContactMessageInput = z.input<typeof contactMessageSchema>;
export type ContactField = "name" | "email" | "orderReference" | "message";

export function contactFieldErrors(error: z.ZodError): Partial<Record<ContactField, true>> {
  const out: Partial<Record<ContactField, true>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field === "name" || field === "email" || field === "orderReference" || field === "message")
      out[field] = true;
  }
  return out;
}

export type ContactDecision = "store" | "drop" | "rate-limited";

// recentCount includes the message being decided on.
export function decideContactMessage(input: {
  honeypot: string;
  recentCount: number;
}): ContactDecision {
  if (input.honeypot.trim() !== "") return "drop";
  if (input.recentCount > CONTACT_RATE_LIMIT) return "rate-limited";
  return "store";
}

export type ContactResult = { ok: true } | { ok: false; reason: "rate-limited" };
