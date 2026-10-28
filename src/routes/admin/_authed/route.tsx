import { Link, Outlet, createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, LogOut, Package, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { adminLogoutFn, getAdminStatusFn } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/_authed")({
  beforeLoad: async () => {
    const status = await getAdminStatusFn();
    if (status.state !== "ok") throw redirect({ to: "/admin/login" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const router = useRouter();
  const logout = useServerFn(adminLogoutFn);

  async function onLogout() {
    try {
      await logout();
    } finally {
      await router.navigate({ to: "/admin/login" });
    }
  }

  return (
    <div className="admin-page">
      <nav className="admin-nav" aria-label="Admin">
        <Link to="/admin" activeOptions={{ exact: true }} activeProps={{ "aria-current": "page" }}>
          <LayoutDashboard aria-hidden /> Overview
        </Link>
        <Link to="/admin/products" activeProps={{ "aria-current": "page" }}>
          <Package aria-hidden /> Products
        </Link>
        <Link to="/admin/orders" activeProps={{ "aria-current": "page" }}>
          <ReceiptText aria-hidden /> Orders
        </Link>
        <Button type="button" variant="ghost" size="sm" onClick={onLogout}>
          <LogOut aria-hidden /> Sign out
        </Button>
      </nav>
      <Outlet />
      <Toaster position="top-center" richColors />
    </div>
  );
}
