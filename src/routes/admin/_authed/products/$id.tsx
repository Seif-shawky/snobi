import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { productToForm } from "@/components/admin/product-form-state";
import { ProductImages } from "@/components/admin/product-images";
import { getAdminProduct } from "@/lib/admin-products";

export const Route = createFileRoute("/admin/_authed/products/$id")({
  loader: async ({ params }) => {
    const data = await getAdminProduct({ data: { id: params.id } });
    if (!data) throw notFound();
    return data;
  },
  notFoundComponent: () => (
    <div>
      <h1 className="admin-title">Product not found</h1>
      <Link to="/admin/products">Back to products</Link>
    </div>
  ),
  component: EditProduct,
});

function EditProduct() {
  const data = Route.useLoaderData();
  const { product } = data;
  return (
    <div>
      <div className="admin-heading-row">
        <h1 className="admin-title">{product.nameEn}</h1>
        {product.status === "active" && (
          <a
            href={`/product/${product.slug}`}
            target="_blank"
            rel="noreferrer"
            className="admin-link"
          >
            View in shop <ExternalLink aria-hidden className="admin-inline-icon" />
          </a>
        )}
      </div>
      <ProductImages
        key={data.images.map((i) => `${i.id}:${i.sortOrder}`).join(",")}
        productId={product.id}
        images={data.images}
      />
      <ProductForm
        key={`form-${product.updatedAt}`}
        productId={product.id}
        initial={productToForm(data)}
      />
    </div>
  );
}
