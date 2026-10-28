import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/product-form";
import { emptyProductForm } from "@/components/admin/product-form-state";

export const Route = createFileRoute("/admin/_authed/products/new")({
  component: () => (
    <div>
      <h1 className="admin-title">Add a product</h1>
      <p className="admin-muted">Save the product first, then you can add photos.</p>
      <ProductForm productId={null} initial={emptyProductForm()} />
    </div>
  ),
});
