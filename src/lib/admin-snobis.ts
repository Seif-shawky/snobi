import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { snobiNamesSchema } from "@/lib/admin-layers";
import {
  adminAddSnobi,
  adminDeleteSnobi,
  adminListSnobis,
  adminMoveSnobi,
  adminRenameSnobi,
  adminRestoreSnobi,
  adminRetireSnobi,
} from "@/server/admin/snobis";

const idSchema = z.string().min(1).max(64);
const idInput = z.object({ id: idSchema });

export const listAdminSnobis = createServerFn({ method: "GET" }).handler(() => adminListSnobis());

export const addAdminSnobi = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected form data");
    return data;
  })
  .handler(({ data }) => adminAddSnobi(data));

export const renameAdminSnobi = createServerFn({ method: "POST" })
  .validator(snobiNamesSchema.extend({ id: idSchema }))
  .handler(({ data }) => adminRenameSnobi(data.id, data.nameEn, data.nameAr));

export const moveAdminSnobi = createServerFn({ method: "POST" })
  .validator(z.object({ id: idSchema, delta: z.union([z.literal(-1), z.literal(1)]) }))
  .handler(({ data }) => adminMoveSnobi(data.id, data.delta));

export const retireAdminSnobi = createServerFn({ method: "POST" })
  .validator(idInput)
  .handler(({ data }) => adminRetireSnobi(data.id));

export const restoreAdminSnobi = createServerFn({ method: "POST" })
  .validator(idInput)
  .handler(({ data }) => adminRestoreSnobi(data.id));

export const deleteAdminSnobi = createServerFn({ method: "POST" })
  .validator(idInput)
  .handler(({ data }) => adminDeleteSnobi(data.id));
