import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ADMIN_ORDER_STATUSES } from "@/lib/admin-shared";
import {
  adminGetOrder,
  adminListOrders,
  adminSetShipping,
  adminTransitionOrder,
} from "@/server/admin/orders";

const idSchema = z.string().min(1).max(64);
const statusSchema = z.enum(ADMIN_ORDER_STATUSES);

export const listAdminOrders = createServerFn({ method: "GET" })
  .validator(z.object({ status: statusSchema.nullable() }))
  .handler(({ data }) => adminListOrders(data.status));

export const getAdminOrder = createServerFn({ method: "GET" })
  .validator(z.object({ id: idSchema }))
  .handler(({ data }) => adminGetOrder(data.id));

export const setAdminOrderShipping = createServerFn({ method: "POST" })
  .validator(
    z.object({ id: idSchema, shippingCents: z.number().int().min(0).max(1_000_000).nullable() }),
  )
  .handler(({ data }) => adminSetShipping(data.id, data.shippingCents));

export const transitionAdminOrder = createServerFn({ method: "POST" })
  .validator(z.object({ id: idSchema, from: statusSchema, to: statusSchema }))
  .handler(({ data }) => adminTransitionOrder(data.id, data.from, data.to));
