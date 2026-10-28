import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { loadSiteContent } from "@/server/site";

export const getSiteContent = createServerFn({ method: "GET" }).handler(() => loadSiteContent());

export const siteContentQuery = queryOptions({
  queryKey: ["snobi", "site-content"],
  queryFn: () => getSiteContent(),
  staleTime: 60_000,
  retry: 1,
});
