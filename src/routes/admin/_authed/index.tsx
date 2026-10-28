import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAdminDashboard } from "@/lib/admin-products";
import { LOW_STOCK_THRESHOLD } from "@/lib/admin-shared";

export const Route = createFileRoute("/admin/_authed/")({
  loader: () => getAdminDashboard(),
  component: AdminDashboard,
});

function AdminDashboard() {
  const stats = Route.useLoaderData();
  return (
    <div>
      <h1 className="admin-title">Overview</h1>
      <div className="admin-stats">
        <Link to="/admin/orders" search={{ status: "pending" }} className="admin-stat">
          <span className="admin-stat-value">{stats.pendingOrders}</span>
          <span>Orders waiting for your call</span>
        </Link>
        <Link to="/admin/products" className="admin-stat">
          <span className="admin-stat-value">{stats.activeProducts}</span>
          <span>Products live in the shop</span>
        </Link>
        <Link to="/admin/products" className="admin-stat">
          <span className="admin-stat-value">{stats.lowStockVariants}</span>
          <span>Sizes with {LOW_STOCK_THRESHOLD} or fewer left</span>
        </Link>
      </div>
      <Button asChild variant="ink">
        <Link to="/admin/products/new">
          <Plus aria-hidden /> Add a product
        </Link>
      </Button>
    </div>
  );
}
