import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { FEED_REFRESH_MS } from "@/lib/community-rules";
import {
  loadDonationFeed,
  loadDonationProgress,
  loadHelpers,
  loadLeaderboard,
} from "@/server/community";

export const getDonationProgress = createServerFn({ method: "GET" }).handler(() =>
  loadDonationProgress(),
);

export const getLeaderboard = createServerFn({ method: "GET" }).handler(() => loadLeaderboard());
export const getHelpers = createServerFn({ method: "GET" }).handler(() => loadHelpers());
export const getDonationFeed = createServerFn({ method: "GET" }).handler(() => loadDonationFeed());

export const donationProgressQuery = queryOptions({
  queryKey: ["snobi", "donation-progress"],
  queryFn: () => getDonationProgress(),
  staleTime: 60_000,
  retry: 1,
});

export const leaderboardQuery = queryOptions({
  queryKey: ["snobi", "leaderboard"],
  queryFn: () => getLeaderboard(),
  staleTime: 60_000,
  retry: 1,
});

export const helpersQuery = queryOptions({
  queryKey: ["snobi", "helpers"],
  queryFn: () => getHelpers(),
  staleTime: 60_000,
  retry: 1,
});

// Polls while the page is open and visible; react-query pauses it in background tabs. Each poll
// counts towards the Workers free plan's daily requests, so don't shorten this casually.
export const donationFeedQuery = queryOptions({
  queryKey: ["snobi", "donation-feed"],
  queryFn: () => getDonationFeed(),
  staleTime: FEED_REFRESH_MS,
  refetchInterval: FEED_REFRESH_MS,
  retry: 1,
});
