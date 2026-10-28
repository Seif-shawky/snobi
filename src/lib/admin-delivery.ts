import { createServerFn } from "@tanstack/react-start";
import {
  adminCountActiveDeliveryRates,
  adminListDeliveryRates,
  adminSaveDeliveryRates,
} from "@/server/admin/delivery";
import { deliveryFormSchema } from "./delivery-rules";

export const listAdminDeliveryRates = createServerFn({ method: "GET" }).handler(() =>
  adminListDeliveryRates(),
);

export const countAdminActiveDeliveryRates = createServerFn({ method: "GET" }).handler(() =>
  adminCountActiveDeliveryRates(),
);

export const saveAdminDeliveryRates = createServerFn({ method: "POST" })
  .validator(deliveryFormSchema)
  .handler(({ data }) => adminSaveDeliveryRates(data));
