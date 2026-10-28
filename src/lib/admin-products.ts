import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { productFormSchema } from "@/lib/admin-shared";
import { adminDeleteImage, adminUpdateImages, adminUploadImage } from "@/server/admin/images";
import {
  adminDashboard,
  adminDeleteProduct,
  adminGetProduct,
  adminListProducts,
  adminSaveProduct,
} from "@/server/admin/products";

const idSchema = z.string().min(1).max(64);

export const getAdminDashboard = createServerFn({ method: "GET" }).handler(() => adminDashboard());

export const listAdminProducts = createServerFn({ method: "GET" }).handler(() =>
  adminListProducts(),
);

export const getAdminProduct = createServerFn({ method: "GET" })
  .validator(z.object({ id: idSchema }))
  .handler(({ data }) => adminGetProduct(data.id));

export const saveAdminProduct = createServerFn({ method: "POST" })
  .validator(z.object({ id: idSchema.nullable(), product: productFormSchema }))
  .handler(({ data }) => adminSaveProduct(data.id, data.product));

export const deleteAdminProduct = createServerFn({ method: "POST" })
  .validator(z.object({ id: idSchema }))
  .handler(({ data }) => adminDeleteProduct(data.id));

export const uploadAdminImage = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) throw new Error("Expected form data");
    return data;
  })
  .handler(({ data }) => adminUploadImage(data));

export const updateAdminImages = createServerFn({ method: "POST" })
  .validator(
    z.object({
      productId: idSchema,
      images: z
        .array(
          z.object({
            id: idSchema,
            altEn: z.string().trim().max(200),
            altAr: z.string().trim().max(200),
          }),
        )
        .max(50),
    }),
  )
  .handler(({ data }) => adminUpdateImages(data.productId, data.images));

export const deleteAdminImage = createServerFn({ method: "POST" })
  .validator(z.object({ id: idSchema }))
  .handler(({ data }) => adminDeleteImage(data.id));
