import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useHydrated } from "@tanstack/react-router";
import { cartQuoteQuery } from "@/lib/cart";
import { useCartStore } from "@/stores/cart";

// The bag's lines from the browser, priced by the server. Before hydration the bag is
// treated as unknown (not empty) so the server render never claims the bag is empty.
export function useCartQuote() {
  const hydrated = useHydrated();
  const stored = useCartStore((s) => s.lines);
  const pruneRemoved = useCartStore((s) => s.pruneRemoved);
  const lines = hydrated ? stored : [];
  const query = useQuery(cartQuoteQuery(lines));
  const removed = query.data?.removed;
  useEffect(() => {
    if (removed?.length) pruneRemoved(removed);
  }, [removed, pruneRemoved]);
  const empty = hydrated && lines.length === 0;
  return {
    hydrated,
    lines,
    empty,
    quote: empty ? undefined : query.data,
    // True while prices for the current lines are not in yet (first load or after a change).
    updating:
      !empty && !query.isError && (query.isPending || query.isPlaceholderData || query.isFetching),
    // Prices couldn't be checked; any data shown is stale, so checkout must stay disabled.
    failed: !empty && query.isError,
    refetch: query.refetch,
  };
}
