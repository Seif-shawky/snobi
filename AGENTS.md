<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Keep shared storefront chrome and English/Arabic state in the Snobi shell around the root Outlet, so all pages share navigation and mirrored layouts.
- Load catalog data from D1 through server functions (src/lib/*.ts wrapping src/server/*) and TanStack Query; never substitute invented products or purchase activity for missing store data.
- Display unconfirmed clothing mockups in a separate design-preview gallery, never as store inventory, so missing prices and variants cannot be mistaken for purchasable products.
- Keep visual styling and semantic color tokens in src/styles.css, so the paper-and-ink system remains consistent across pages.
- Keep the full story in the /story leaf route and homepage story content as a teaser, so each page has a distinct purpose without duplicating the full narrative.
- Keep the full supporters experience in /supporters and its homepage section as a teaser; until verified activity and consent storage exist, profile edits are session-only previews and never imply publication.
- Keep FAQ answers in the bilingual /faq leaf route, linked from the shared footer, and explicitly label unconfirmed business policies instead of supplying defaults.
- Keep the bag dialog and /cart page on one persistent Zustand cart ("snobi-cart-v1") that stores only variant IDs and quantities, hydrated after mount; render names, prices, stock and totals only from the server quoteCart response, so the client never decides what anything costs.
- Create cash-on-delivery orders only through placeOrder, which re-prices from D1 and inserts the order, items and stock decrements in one atomic D1 batch with an idempotency key; never invent delivery fees or times — they are confirmed with the customer before shipping.
- Show order confirmation only from server-confirmed data fetched by reference plus secret access token, and never describe a cash-on-delivery order as paid.
- Keep the bilingual contact form in /contact with client-side validation and explicit not-sent feedback until actual message delivery is connected, so previews never imply receipt or storage.
