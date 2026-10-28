import {
  centsToPoundsInput,
  type AdminProductStatus,
  type ProductFormInput,
  type VariantFormInput,
} from "@/lib/admin-shared";

export type VariantRow = VariantFormInput & { key: string };
export type ProductFormState = Omit<ProductFormInput, "variants"> & { variants: VariantRow[] };

const newKey = () => crypto.randomUUID();

// The initial row is server-rendered, so it needs a stable key (it becomes the input ids);
// rows added later are created client-side after hydration.
export const blankVariant = (key: string = newKey()): VariantRow => ({
  key,
  size: "",
  sku: "",
  price: "",
  stock: "0",
  active: true,
});

export function emptyProductForm(): ProductFormState {
  return {
    nameEn: "",
    nameAr: "",
    slug: "",
    descriptionEn: "",
    descriptionAr: "",
    status: "draft",
    phase: "0",
    sortOrder: "0",
    variants: [blankVariant("initial")],
  };
}

interface LoadedProduct {
  product: {
    slug: string;
    nameEn: string;
    nameAr: string;
    descriptionEn: string;
    descriptionAr: string;
    status: AdminProductStatus;
    phase: number;
    sortOrder: number;
  };
  variants: {
    id: string;
    size: string;
    sku: string | null;
    priceCents: number;
    stock: number;
    active: boolean;
  }[];
}

export function productToForm({ product, variants }: LoadedProduct): ProductFormState {
  return {
    nameEn: product.nameEn,
    nameAr: product.nameAr,
    slug: product.slug,
    descriptionEn: product.descriptionEn,
    descriptionAr: product.descriptionAr,
    status: product.status,
    phase: String(product.phase),
    sortOrder: String(product.sortOrder),
    variants: variants.map((v) => ({
      key: v.id,
      id: v.id,
      size: v.size,
      sku: v.sku ?? "",
      price: centsToPoundsInput(v.priceCents),
      stock: String(v.stock),
      active: v.active,
    })),
  };
}
