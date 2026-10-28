import { queryOptions, useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getActiveDeliveryRates } from "@/server/delivery";
import type { PublicDeliveryRate } from "./delivery-rules";

// Active delivery fees per governorate, for checkout and the /shipping fee table.
export const getDeliveryRates = createServerFn({ method: "GET" }).handler(() =>
  getActiveDeliveryRates(),
);

export const deliveryRatesKey = ["snobi", "delivery-rates"] as const;

export const deliveryRatesQuery = queryOptions({
  queryKey: deliveryRatesKey,
  queryFn: () => getDeliveryRates(),
  staleTime: 60_000,
  retry: 1,
});

// Route loader: rates travel in the serialized loader data, so the server render and the
// client's first render agree. Never throws; pages show their own retry state instead.
export async function loadDeliveryRates(): Promise<PublicDeliveryRate[] | null> {
  try {
    return await getDeliveryRates();
  } catch {
    return null;
  }
}

export function useDeliveryRates(fromLoader: PublicDeliveryRate[] | null) {
  return useQuery({ ...deliveryRatesQuery, initialData: () => fromLoader ?? undefined });
}
