import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MAX_ALT_LENGTH } from "@/lib/site-content";
import {
  adminGetSite,
  adminResetHero,
  adminSaveHeroAlt,
  adminUploadHero,
} from "@/server/admin/site";

export const getAdminSite = createServerFn({ method: "GET" }).handler(() => adminGetSite());

export const uploadAdminHero = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected form data");
    return data;
  })
  .handler(({ data }) => adminUploadHero(data));

export const saveAdminHeroAlt = createServerFn({ method: "POST" })
  .validator(
    z.object({
      altEn: z.string().trim().max(MAX_ALT_LENGTH),
      altAr: z.string().trim().max(MAX_ALT_LENGTH),
    }),
  )
  .handler(({ data }) => adminSaveHeroAlt(data.altEn, data.altAr));

export const resetAdminHero = createServerFn({ method: "POST" }).handler(() => adminResetHero());
