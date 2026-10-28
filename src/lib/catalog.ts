import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { loadCatalog } from "@/server/catalog";

export interface CatalogVariant {
  id: string;
  size: string;
  priceCents: number;
  available: boolean;
  lowStock: number | null;
}

export interface CatalogProduct {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  images: { url: string; altEn: string; altAr: string }[];
  variants: CatalogVariant[];
  minPriceCents: number | null;
  available: boolean;
}

export const getProducts = createServerFn({ method: "GET" }).handler(() => loadCatalog());

export const getProduct = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().min(1).max(120) }))
  .handler(async ({ data }) => {
    const [product] = await loadCatalog({ slug: data.slug });
    if (!product) throw notFound();
    return product;
  });

export const productsQuery = queryOptions({
  queryKey: ["snobi", "products"],
  queryFn: () => getProducts(),
  staleTime: 60_000,
  retry: 1,
});

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["snobi", "product", slug],
    queryFn: () => getProduct({ data: { slug } }),
    staleTime: 60_000,
    retry: false,
  });
