import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { listAdminOrders } from "@/lib/admin-orders";
import {
  ADMIN_ORDER_STATUSES,
  adminDateFormat as dateFormat,
  isAdminOrderStatus,
  type AdminOrderStatus,
} from "@/lib/admin-shared";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/_authed/orders/")({
  validateSearch: (search: Record<string, unknown>): { status?: AdminOrderStatus } => {
    const status = search["status"];
    return typeof status === "string" && isAdminOrderStatus(status) ? { status } : {};
  },
  loaderDeps: ({ search }) => ({ status: search.status ?? null }),
  loader: ({ deps }) => listAdminOrders({ data: { status: deps.status } }),
  component: AdminOrders,
});

function AdminOrders() {
  const orders = Route.useLoaderData();
  const { status } = Route.useSearch();
  return (
    <div>
      <h1 className="admin-title">Orders</h1>
      <nav className="admin-filters" aria-label="Filter orders by status">
        <Link to="/admin/orders" search={{}} aria-current={!status ? "page" : undefined}>
          All
        </Link>
        {ADMIN_ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            to="/admin/orders"
            search={{ status: s }}
            aria-current={status === s ? "page" : undefined}
          >
            {s}
          </Link>
        ))}
      </nav>
      {orders.length === 0 ? (
        <p className="admin-muted">No {status ?? ""} orders yet.</p>
      ) : (
        <ul className="admin-list">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to="/admin/orders/$id" params={{ id: o.id }} className="admin-list-item">
                <span className="admin-list-main">
                  <span className="admin-list-title">
                    {o.reference} · {o.customerName}
                  </span>
                  <span className="admin-muted">
                    {dateFormat.format(o.createdAt)} · {o.governorate} · {o.phone}
                  </span>
                  <span className="admin-muted">
                    {o.itemCount} {o.itemCount === 1 ? "item" : "items"} ·{" "}
                    {formatMoney(o.subtotalCents, false)}
                  </span>
                </span>
                <Badge variant={o.status === "pending" ? "default" : "outline"}>{o.status}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
