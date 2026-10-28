import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  adminDeleteMessage,
  adminListMessages,
  adminSetMessageRead,
} from "@/server/admin/messages";

const idSchema = z.string().min(1).max(64);

export const listAdminMessages = createServerFn({ method: "GET" }).handler(() =>
  adminListMessages(),
);

export const setAdminMessageRead = createServerFn({ method: "POST" })
  .validator(z.object({ id: idSchema, read: z.boolean() }))
  .handler(({ data }) => adminSetMessageRead(data.id, data.read));

export const deleteAdminMessage = createServerFn({ method: "POST" })
  .validator(z.object({ id: idSchema }))
  .handler(({ data }) => adminDeleteMessage(data.id));

// Reply in the owner's own mail app; nothing is sent from the site.
export function replyMailto(email: string, name: string, orderReference: string | null): string {
  const subject = orderReference ? `Re: Snobi (${orderReference})` : "Re: Snobi";
  const body = `Hi ${name},\n\n`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
