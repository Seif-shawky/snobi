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
- Keep visual styling and semantic color tokens in src/styles.css, so the paper-and-ink system remains consistent across pages.
