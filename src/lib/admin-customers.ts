import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  adminDeleteCustomer,
  adminGetCustomer,
  adminListCustomers,
  adminResetCustomerPassword,
  adminSetCustomerHidden,
  adminUpdateCustomer,
} from "@/server/admin/customers";

const idSchema = z.string().min(1).max(64);
const idInput = z.object({ id: idSchema });

export const listAdminCustomers = createServerFn({ method: "GET" })
  .validator(z.object({ q: z.string().max(100) }))
  .handler(({ data }) => adminListCustomers(data.q));

export const getAdminCustomer = createServerFn({ method: "GET" })
  .validator(idInput)
  .handler(({ data }) => adminGetCustomer(data.id));

export const setAdminCustomerHidden = createServerFn({ method: "POST" })
  .validator(z.object({ id: idSchema, hidden: z.boolean() }))
  .handler(({ data }) => adminSetCustomerHidden(data.id, data.hidden));

// Name rules run in the handler, so their messages can reach the form.
export const updateAdminCustomer = createServerFn({ method: "POST" })
  .validator(
    z.object({ id: idSchema, displayName: z.string().max(200), title: z.string().max(200) }),
  )
  .handler(({ data }) => adminUpdateCustomer(data.id, data.displayName, data.title));

export const resetAdminCustomerPassword = createServerFn({ method: "POST" })
  .validator(idInput)
  .handler(({ data }) => adminResetCustomerPassword(data.id));

export const deleteAdminCustomer = createServerFn({ method: "POST" })
  .validator(idInput)
  .handler(({ data }) => adminDeleteCustomer(data.id));
