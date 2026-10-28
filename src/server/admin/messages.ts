import { desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { contactMessages } from "../db/schema";
import { requireAdmin } from "./auth";

export async function adminListMessages() {
  await requireAdmin();
  return getDb()
    .select({
      id: contactMessages.id,
      name: contactMessages.name,
      email: contactMessages.email,
      orderReference: contactMessages.orderReference,
      message: contactMessages.message,
      readAt: contactMessages.readAt,
      createdAt: contactMessages.createdAt,
    })
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(300);
}

export async function adminSetMessageRead(id: string, read: boolean) {
  await requireAdmin();
  await getDb()
    .update(contactMessages)
    .set({ readAt: read ? Date.now() : null })
    .where(eq(contactMessages.id, id));
  return { ok: true as const };
}

export async function adminDeleteMessage(id: string) {
  await requireAdmin();
  await getDb().delete(contactMessages).where(eq(contactMessages.id, id));
  return { ok: true as const };
}
