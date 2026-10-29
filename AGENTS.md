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
- Load catalog data from D1 through server functions (src/lib/_.ts wrapping src/server/_) and TanStack Query; never substitute invented products or purchase activity for missing store data.
- Manage products, sizes, stock and photos only through the password-protected /admin (every admin server function calls requireAdmin() first); never show mockups or unconfirmed designs as store items.
- Keep visual styling and semantic color tokens in src/styles.css, so the paper-and-ink system remains consistent across pages.
- Keep the full story in the /story leaf route and homepage story content as a teaser, so each page has a distinct purpose without duplicating the full narrative.
- Keep the full supporters experience in /supporters and its homepage section as a teaser; until verified activity and consent storage exist, profile edits are session-only previews and never imply publication.
- Keep FAQ answers in the bilingual /faq leaf route, linked from the shared footer, and explicitly label any still-undecided business policy instead of supplying defaults.
- Keep the bag dialog and /cart page on one persistent Zustand cart ("snobi-cart-v1") that stores only variant IDs and quantities, hydrated after mount; render names, prices, stock and totals only from the server quoteCart response, so the client never decides what anything costs.
- Create cash-on-delivery orders only through placeOrder, which re-prices from D1 and inserts the order, items and stock decrements in one atomic D1 batch with an idempotency key; the delivery fee comes from delivery_rates on the server and must match the fee the customer saw (otherwise no_delivery / delivery_fee_changed, nothing written).
- Show order confirmation only from server-confirmed data fetched by reference plus secret access token, and never describe a cash-on-delivery order as paid.
- Keep delivery fees per governorate in delivery_rates, edited only in /admin/delivery; governorates without an active rate can't be chosen at checkout, zero active rates pauses checkout, and delivery estimates show only where the owner set them.
- Keep /shipping as the published shipping, returns (14 days from delivery, delivery fees non-refundable) and exchanges policy, with its fee table rendered live from active delivery rates.
- Store contact-form messages in D1 after zod validation, a silent honeypot and a 5-per-IP-per-hour limit, and answer them from /admin/messages via mailto links; keep official contact channels in src/lib/contact-details.ts.
- Keep the homepage hero picture owner-editable through /admin/site (site_settings + R2 under site/hero/), falling back to the bundled Phase 0 drawing; serve R2 objects publicly only for keys accepted by isPublicImageKey.
- Keep /privacy and /terms as bilingual leaf routes linked from the footer, and update them whenever data collection, sharing, payment, delivery or returns change, so the policies match the real implementation.
- Hand SSR-fetched queries to the browser through setupRouterSsrQueryIntegration in src/router.tsx, so useSuspenseQuery hydrates with server data instead of refetching or mismatching.
- Keep the current story phase number and the homepage receipt lists in src/lib/phase.ts, so moving to the next phase updates the nav stamp, hero button, drop copy and receipts in one place; the nav's shop link is the current phase stamp.
