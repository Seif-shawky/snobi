import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Snobi admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => (
    // Owner-facing pages stay English/LTR even when the storefront is switched to Arabic.
    <div className="admin-root" dir="ltr" lang="en">
      <Outlet />
    </div>
  ),
});
