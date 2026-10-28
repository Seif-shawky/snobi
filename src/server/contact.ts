import { and, count, eq, gte } from "drizzle-orm";
import {
  CONTACT_RATE_WINDOW_MS,
  decideContactMessage,
  type ContactResult,
} from "@/lib/contact-schema";
import { clientIp } from "./admin/auth";
import { getDb } from "./db/client";
import { contactMessages } from "./db/schema";

export interface ContactMessageData {
  name: string;
  email: string;
  orderReference: string | null;
  message: string;
  website: string;
}

export async function storeContactMessage(data: ContactMessageData): Promise<ContactResult> {
  // Bots get the same success response so they learn nothing.
  if (decideContactMessage({ honeypot: data.website, recentCount: 0 }) === "drop") {
    return { ok: true };
  }
  const db = getDb();
  const ip = clientIp();
  const id = crypto.randomUUID();
  const now = Date.now();
  // Insert first, then count: D1 serializes writes, so parallel submits can't all slip under.
  await db.insert(contactMessages).values({
    id,
    name: data.name,
    email: data.email,
    orderReference: data.orderReference,
    message: data.message,
    ip,
    createdAt: now,
  });
  const [row] = await db
    .select({ n: count() })
    .from(contactMessages)
    .where(
      and(eq(contactMessages.ip, ip), gte(contactMessages.createdAt, now - CONTACT_RATE_WINDOW_MS)),
    );
  if (decideContactMessage({ honeypot: "", recentCount: row?.n ?? 0 }) === "rate-limited") {
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
    return { ok: false, reason: "rate-limited" };
  }
  return { ok: true };
}
