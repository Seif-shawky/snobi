import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { quoteCartServer } from "@/server/cart";
import { cartLinesSchema, type CartLineInput } from "./order-schema";

// Authoritative bag details from D1: names, sizes, prices, stock status and totals.
export const quoteCart = createServerFn({ method: "POST" })
  .validator(z.object({ lines: cartLinesSchema }))
  .handler(({ data }) => quoteCartServer(data.lines));

export const cartQuoteKey = ["snobi", "cart-quote"] as const;

export const cartQuoteQuery = (lines: CartLineInput[]) =>
  queryOptions({
    queryKey: [...cartQuoteKey, lines],
    queryFn: () => quoteCart({ data: { lines } }),
    enabled: lines.length > 0,
    staleTime: 15_000,
    retry: 1,
    placeholderData: keepPreviousData,
  });
