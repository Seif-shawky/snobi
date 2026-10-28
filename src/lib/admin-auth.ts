import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAdminStatus, login, logout, requireAdmin } from "@/server/admin/auth";

export const getAdminStatusFn = createServerFn({ method: "GET" }).handler(() => getAdminStatus());

export const adminLoginFn = createServerFn({ method: "POST" })
  .validator(z.object({ password: z.string().min(1, "Enter the password").max(200) }))
  .handler(({ data }) => login(data.password));

export const adminLogoutFn = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdmin();
  return logout();
});
