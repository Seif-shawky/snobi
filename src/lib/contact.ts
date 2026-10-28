import { createServerFn } from "@tanstack/react-start";
import { contactMessageSchema } from "@/lib/contact-schema";
import { storeContactMessage } from "@/server/contact";

export const submitContactMessage = createServerFn({ method: "POST" })
  .validator(contactMessageSchema)
  .handler(({ data }) => storeContactMessage(data));
