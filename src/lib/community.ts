import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { loadDonationTotalCents, loadSupporters } from "@/server/community";

export const getDonationTotal = createServerFn({ method: "GET" }).handler(() =>
  loadDonationTotalCents(),
);

export const getSupporters = createServerFn({ method: "GET" }).handler(() => loadSupporters());

export const donationTotalQuery = queryOptions({
  queryKey: ["snobi", "donation-total"],
  queryFn: () => getDonationTotal(),
  staleTime: 60_000,
  retry: 1,
});

export const supportersQuery = queryOptions({
  queryKey: ["snobi", "supporters"],
  queryFn: () => getSupporters(),
  staleTime: 60_000,
  retry: 1,
});
