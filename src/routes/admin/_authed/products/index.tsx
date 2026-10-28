import { Link, createFileRoute } from "@tanstack/react-router";
import { ImageOff, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listAdminProducts } from "@/lib/admin-products";
import { LOW_STOCK_THRESHOLD } from "@/lib/admin-shared";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/_authed/products/")({
  loader: () => listAdminProducts(),
  component: AdminProducts,
});

function priceRange(min: number | null, max: number | null) {
  if (min === null || max === null) return "No price yet";
  return min === max
    ? formatMoney(min, false)
    : `${formatMoney(min, false)} – ${formatMoney(max, false)}`;
}

function AdminProducts() {
  const products = Route.useLoaderData();
  return (
    <div>
      <div className="admin-heading-row">
        <h1 className="admin-title">Products</h1>
        <Button asChild variant="ink">
          <Link to="/admin/products/new">
            <Plus aria-hidden /> Add product
          </Link>
        </Button>
      </div>
      {products.length === 0 ? (
        <p className="admin-muted">No products yet. Add your first one to start selling.</p>
      ) : (
        <ul className="admin-list">
          {products.map((p) => (
            <li key={p.id}>
              <Link to="/admin/products/$id" params={{ id: p.id }} className="admin-list-item">
                {p.coverKey ? (
                  <img src={`/images/${p.coverKey}`} alt="" className="admin-thumb" />
                ) : (
                  <span className="admin-thumb admin-thumb-empty" aria-label="No photo">
                    <ImageOff aria-hidden />
                  </span>
                )}
                <span className="admin-list-main">
                  <span className="admin-list-title">
                    {p.nameEn}{" "}
                    <span dir="rtl" lang="ar">
                      · {p.nameAr}
                    </span>
                  </span>
                  <span className="admin-muted">
                    {priceRange(p.minPriceCents, p.maxPriceCents)}
                  </span>
                  <span className="admin-sizes">
                    {p.sizes.length === 0 && <span className="admin-muted">No sizes</span>}
                    {p.sizes.map((s) => (
                      <span
                        key={s.size}
                        className="admin-size-chip"
                        data-low={s.active && s.stock <= LOW_STOCK_THRESHOLD ? "" : undefined}
                        data-inactive={s.active ? undefined : ""}
                      >
                        {s.size}: {s.stock}
                      </span>
                    ))}
                  </span>
                </span>
                <Badge variant={p.status === "active" ? "default" : "outline"}>{p.status}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
