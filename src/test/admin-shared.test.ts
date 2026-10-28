import { describe, expect, it } from "vitest";
import {
  ADMIN_ORDER_STATUSES,
  canTransitionOrder,
  productFormSchema,
  sniffImageType,
  suggestSlug,
  toFieldErrors,
  variantFormSchema,
  whatsappUrl,
  type ProductFormInput,
} from "@/lib/admin-shared";

const variant = { size: "M", sku: "", price: "450", stock: "3", active: true };
const product: ProductFormInput = {
  nameEn: "Snobi Tee",
  nameAr: "تيشيرت سنوبي",
  slug: "snobi-tee",
  descriptionEn: "",
  descriptionAr: "",
  status: "active",
  phase: "0",
  sortOrder: "0",
  variants: [variant],
};

describe("suggestSlug", () => {
  it("turns names into url-safe slugs", () => {
    expect(suggestSlug("Snobi Needs Money Tee")).toBe("snobi-needs-money-tee");
    expect(suggestSlug("  Café — Crème  ")).toBe("cafe-creme");
    expect(suggestSlug("Black & White!!")).toBe("black-and-white");
    expect(suggestSlug("تيشيرت")).toBe("");
    expect(suggestSlug("a".repeat(100)).length).toBe(80);
  });
});

describe("variantFormSchema", () => {
  it("converts pounds to piastres and stock to a number", () => {
    const parsed = variantFormSchema.parse({ ...variant, price: "450.5", sku: " SKU-1 " });
    expect(parsed).toMatchObject({ price: 45050, stock: 3, sku: "SKU-1" });
    expect(variantFormSchema.parse(variant).sku).toBeNull();
  });

  it("rejects bad prices and stock", () => {
    for (const price of ["0", "-5", "abc", "4.555", ""]) {
      expect(variantFormSchema.safeParse({ ...variant, price }).success).toBe(false);
    }
    for (const stock of ["-1", "1.5", "x", ""]) {
      expect(variantFormSchema.safeParse({ ...variant, stock }).success).toBe(false);
    }
    expect(variantFormSchema.safeParse({ ...variant, size: " " }).success).toBe(false);
  });
});

describe("productFormSchema", () => {
  it("accepts a valid product", () => {
    expect(productFormSchema.safeParse(product).success).toBe(true);
  });

  it("validates the slug format", () => {
    for (const slug of ["Snobi", "snobi tee", "snobi--tee", "-snobi", "snobi_tee", ""]) {
      expect(productFormSchema.safeParse({ ...product, slug }).success).toBe(false);
    }
  });

  it("blocks activating a product without an active size", () => {
    const result = productFormSchema.safeParse({
      ...product,
      variants: [{ ...variant, active: false }],
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(toFieldErrors(result.error)["status"]).toMatch(/active size/);
    expect(productFormSchema.safeParse({ ...product, status: "draft", variants: [] }).success).toBe(
      true,
    );
  });

  it("reports per-row variant errors and duplicate sizes", () => {
    const result = productFormSchema.safeParse({
      ...product,
      variants: [variant, { ...variant, size: "m", price: "nope" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = toFieldErrors(result.error);
      expect(errors["variants.1.price"]).toBeDefined();
      expect(errors["variants.1.size"]).toMatch(/twice/);
    }
  });
});

describe("order status transitions", () => {
  it("allows only the documented moves", () => {
    const allowed = new Set([
      "pending>confirmed",
      "pending>cancelled",
      "confirmed>shipped",
      "confirmed>cancelled",
      "shipped>delivered",
    ]);
    for (const from of ADMIN_ORDER_STATUSES) {
      for (const to of ADMIN_ORDER_STATUSES) {
        expect(canTransitionOrder(from, to)).toBe(allowed.has(`${from}>${to}`));
      }
    }
  });
});

describe("sniffImageType", () => {
  const bytes = (...values: number[]) => new Uint8Array(values);
  const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));

  it("recognises JPEG, PNG and WebP signatures", () => {
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0))).toBe("image/jpeg");
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))).toBe(
      "image/png",
    );
    expect(sniffImageType(bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBPVP8 ")))).toBe(
      "image/webp",
    );
  });

  it("rejects other or truncated files", () => {
    expect(sniffImageType(bytes())).toBeNull();
    expect(sniffImageType(bytes(0xff, 0xd8))).toBeNull();
    expect(sniffImageType(bytes(...ascii("GIF89a")))).toBeNull();
    expect(sniffImageType(bytes(...ascii("<svg xmlns")))).toBeNull();
    expect(sniffImageType(bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WAVE")))).toBeNull();
  });
});

describe("whatsappUrl", () => {
  it("normalises Egyptian mobile numbers", () => {
    expect(whatsappUrl("01012345678")).toBe("https://wa.me/201012345678");
    expect(whatsappUrl("+20 101 234 5678")).toBe("https://wa.me/201012345678");
    expect(whatsappUrl("00201012345678")).toBe("https://wa.me/201012345678");
    expect(whatsappUrl("12345")).toBeNull();
  });
});
