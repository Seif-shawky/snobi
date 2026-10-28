import { createFileRoute } from "@tanstack/react-router";
import { Collection } from "@/components/snobi";
import { productsQuery } from "@/lib/catalog";
import { ShopIntro } from "@/components/shop-intro";
export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Snobi Needs Money. — The Clothes" },
      {
        name: "description",
        content:
          "Shop Snobi’s Phase 0 clothes. Limited drops, cash on delivery across Egypt. Clothes for you. Hope for Snobi.",
      },
      { property: "og:title", content: "Snobi Needs Money. — The Clothes" },
      {
        property: "og:description",
        content: "Snobi’s first drop. Pick a size, pay cash on delivery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(productsQuery);
  },
  component: () => (
    <>
      <ShopIntro />
      <Collection />
    </>
  ),
});
