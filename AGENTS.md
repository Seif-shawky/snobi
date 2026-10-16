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
- Load catalog data from Shopify Storefront API through TanStack Query; never substitute invented products or purchase activity for missing store data.
- Display unconfirmed clothing mockups in a separate design-preview gallery, never as Shopify inventory, so missing prices and variants cannot be mistaken for purchasable products.
- Keep visual styling and semantic color tokens in src/styles.css, so the paper-and-ink system remains consistent across pages.
- Keep the full story in the /story leaf route and homepage story content as a teaser, so each page has a distinct purpose without duplicating the full narrative.
- Keep the full supporters experience in /supporters and its homepage section as a teaser; until verified activity and consent storage exist, profile edits are session-only previews and never imply publication.
- Keep FAQ answers in the bilingual /faq leaf route, linked from the shared footer, and explicitly label unconfirmed business policies instead of supplying defaults.
- Keep the bag dialog and /cart page on one persistent Zustand cart, hydrated after mount and updated from Shopify cart snapshots, so totals and line IDs stay authoritative without SSR hydration mismatches.
- Create checkout only through Shopify Cart API and open its returned HTTPS URL in a new tab with channel=online_store, so checkout never relies on constructed store permalinks.
- Keep the bilingual contact form in /contact with client-side validation and explicit not-sent feedback until actual message delivery is connected, so previews never imply receipt or storage.
