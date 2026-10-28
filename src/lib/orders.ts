import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getOrderServer, placeOrderServer } from "@/server/orders";
import { placeOrderSchema, REFERENCE_PATTERN } from "./order-schema";

// Creates a cash-on-delivery order. Prices and stock are re-read on the server.
export const placeOrder = createServerFn({ method: "POST" })
  .validator(placeOrderSchema)
  .handler(({ data }) => placeOrderServer(data));

export const orderLookupSchema = z.object({
  reference: z.string().regex(REFERENCE_PATTERN),
  token: z.string().min(32).max(128),
});

export const getOrder = createServerFn({ method: "GET" })
  .validator(orderLookupSchema)
  .handler(({ data }) => getOrderServer(data.reference, data.token));

export const orderQuery = (reference: string, token: string) =>
  queryOptions({
    queryKey: ["snobi", "order", reference, token],
    queryFn: () => getOrder({ data: { reference, token } }),
    staleTime: 30_000,
    retry: false,
  });
