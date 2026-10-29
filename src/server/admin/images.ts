import { and, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_EXTENSIONS,
  MAX_IMAGE_BYTES,
  sniffImageType,
  type AllowedImageType,
} from "@/lib/admin-shared";
import { getDb } from "../db/client";
import { productImages, products } from "../db/schema";
import { requireAdmin } from "./auth";
import { imagesBucket, PHOTO_STORAGE_MISSING } from "../images-bucket";

export type UploadResult = { ok: true; id: string; r2Key: string } | { ok: false; error: string };

export type ValidatedImage =
  | { ok: true; bytes: Uint8Array; type: AllowedImageType; extension: string }
  | { ok: false; error: string };

// Shared by every admin upload: size and type limits, and the real type from the file's bytes.
export async function readUploadedImage(file: FormDataEntryValue | null): Promise<ValidatedImage> {
  if (!(file instanceof File)) return { ok: false, error: "Choose a photo to upload" };
  if (file.size === 0) return { ok: false, error: "That file is empty" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "Photos must be 5 MB or smaller" };
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Only JPEG, PNG or WebP photos are allowed" };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) return { ok: false, error: "This file is not a real JPEG, PNG or WebP image" };
  return { ok: true, bytes, type, extension: IMAGE_EXTENSIONS[type] };
}

export async function adminUploadImage(form: FormData): Promise<UploadResult> {
  await requireAdmin();
  const productId = form.get("productId");
  if (typeof productId !== "string" || !/^[\w-]{1,64}$/.test(productId)) {
    return { ok: false, error: "Missing product" };
  }
  const bucket = imagesBucket();
  if (!bucket) return { ok: false, error: PHOTO_STORAGE_MISSING };
  const image = await readUploadedImage(form.get("file"));
  if (!image.ok) return image;
  const { bytes, type } = image;

  const db = getDb();
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId));
  if (!product) return { ok: false, error: "This product no longer exists" };

  const id = crypto.randomUUID();
  const r2Key = `products/${productId}/${id}.${image.extension}`;
  await bucket.put(r2Key, bytes, { httpMetadata: { contentType: type } });
  try {
    const [last] = await db
      .select({ max: sql<number | null>`max(${productImages.sortOrder})` })
      .from(productImages)
      .where(eq(productImages.productId, productId));
    await db.insert(productImages).values({
      id,
      productId,
      r2Key,
      sortOrder: (last?.max ?? -1) + 1,
    });
  } catch (error) {
    await bucket.delete(r2Key);
    throw error;
  }
  return { ok: true, id, r2Key };
}

export async function adminUpdateImages(
  productId: string,
  images: { id: string; altEn: string; altAr: string }[],
) {
  await requireAdmin();
  const db = getDb();
  if (images.length === 0) return { ok: true as const };
  const statements: BatchItem<"sqlite">[] = images.map((img, index) =>
    db
      .update(productImages)
      .set({ altEn: img.altEn, altAr: img.altAr, sortOrder: index })
      .where(and(eq(productImages.id, img.id), eq(productImages.productId, productId))),
  );
  await db.batch(statements as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
  return { ok: true as const };
}

export async function adminDeleteImage(id: string) {
  await requireAdmin();
  const db = getDb();
  const [image] = await db
    .delete(productImages)
    .where(eq(productImages.id, id))
    .returning({ r2Key: productImages.r2Key });
  if (image) await imagesBucket()?.delete(image.r2Key);
  return { ok: true as const };
}
