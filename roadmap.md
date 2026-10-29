# Snobi homepage

## Home redesign (phases)

- [x] Nav "Shop" link replaced by the red current-phase stamp; hero "Phase 0?" button and a "What's Phase 0?" explainer on /shop.
- [x] Frameless hero (transparent PNG), new tagline, "— Donations" counter, slowly spinning asterisks.
- [x] Receipt Snobi: two slips (current phase spending, next phase tease) with a head that follows the cursor/touch.
- [ ] Owner: upload hero art with the background removed (PNG/WebP) when the phase changes; edit src/lib/phase.ts.

## Phase 5: content, delivery fees and policies

- [x] Per-governorate delivery fees managed in /admin/delivery; fee shown at checkout, re-checked by placeOrder and stored on the order; checkout pauses when no governorate is active.
- [x] /shipping published: live fee table, 14-day returns from delivery, delivery fees non-refundable, return/exchange conditions.
- [x] Contact form stores messages (honeypot, 5/IP/hour) with an /admin/messages inbox; official email and Instagram in footer and contact page.
- [x] Privacy policy and terms (/privacy, /terms) in English and Arabic, linked from the footer.
- [x] Homepage hero picture replaceable from /admin/site; default Phase 0 roadside drawing.
- [x] Removed the static clothing mockups from the shop.
- [ ] Owner: set real delivery fees per governorate in /admin/delivery before launch.
- [ ] Publish a size guide; decide restock policy (still labelled undecided in the FAQ).
- [ ] Auto-delete contact messages older than 12 months (privacy policy promise).
- [ ] Order notifications to the owner (email/WhatsApp) and checkout spam protection.
- [ ] Phase 6: deploy to Cloudflare (D1, R2, secrets), domain, one real test order.

## Own backend: cash-on-delivery purchase flow

- [x] Product page from D1: image gallery with no-photo state, per-language copy, accessible size radios (sold-out disabled), low-stock note, explicit no-size error, quantity 1–10.
- [x] Cart store stores only variant IDs/quantities ("snobi-cart-v1"); bag and /cart render from the server quoteCart (prices, stock flags, removed variants pruned with a notice).
- [x] Checkout with COD delivery form (Egyptian mobile validation/normalisation, 27 governorates, shared zod schema client + server) and honest delivery-fee copy.
- [x] placeOrder: server re-pricing, idempotency key, atomic D1 batch (order + items + stock decrement; CHECK constraint rejects oversells with nothing written).
- [x] Order confirmation by reference + secret token (constant-time compare), not-found state otherwise; cart cleared after a successful order.
- [x] Removed Shopify code and copy; FAQ/shipping rewritten for cash on delivery with unconfirmed policies still labelled.
- [x] Unit tests (schema, codes, cart store, pricing) and a local end-to-end run (order, stock, idempotent retry, oversell race, wrong token).
- [ ] Confirm delivery areas, fees and times, then record the fee on orders (admin).
- [ ] Rate-limit placeOrder and add bot protection before launch.
- [ ] Send order notifications (WhatsApp/email) once contact channels are confirmed.
- [ ] Online payment methods (not planned for launch).

- [x] Build Page 11 Shipping, Returns & Exchanges with all policies marked unconfirmed.
- [x] Build and verify Page 10 Contact: bilingual form, accessible validation, honest not-sent feedback and footer navigation.
- [ ] Activate contact delivery and official email/Instagram links; blocked by missing confirmed business contact details and delivery setup.
- [x] Build and verify Page 9 FAQ: twelve honest bilingual answers, accessible accordion and footer link.
- [x] Build Page 8 Supporters from the original brief, with verified-only empty states, ranking safeguards and a private profile preview.
- [x] Verify Page 8 in English/Arabic, profile controls and narrow layouts.
- [ ] Activate verified supporter feed, rankings and saved opt-out choices; blocked by missing verified purchases and public-profile consent service.
- [x] Align Page 7 at /story with the original document: title, Phase 0 chronology and fictional-versus-real finances.
- [x] Verify Page 7 in English/Arabic and its clothing-gallery link.
- [x] Build Page 5 checkout review in English/Arabic and connect bag checkout navigation.
- [x] Add real-product add-to-bag controls in the collection; keep mockups non-purchasable.
- [x] Test checkout navigation, cart actions, and empty checkout (now on the own COD backend).
- [x] Build Page 4 cart with shared bag navigation and English/Arabic empty and populated states.
- [x] Connect real cart updates and checkout (Shopify, since replaced by the own COD backend); keep mockups non-purchasable.
- [x] Verify cart rendering and navigation in the browser; test cart updates and errors (8 tests passed). Live purchase verification awaits confirmed store products; store count is zero.
- [x] Build Page 3 as Snobi’s Phase 0 story with English and Arabic copy.
- [x] Verify story page, language switching and navigation.
- [x] Build Page 2 Shop with uploaded clothing mockups and an enlarged image view.
- [x] Keep mockups separate from real purchasable inventory; prices and sizes await the user.
- [x] Verify Shop in English/Arabic and narrow screens.
- [x] Create Phase 0 paper-and-ink homepage using the original mascot.
- [x] Connect collection to real products (now D1); show honest empty states.
- [x] Add English/Arabic layouts and working navigation/bag controls.
- [x] Verify page rendering and interactions.
- [x] Build Page 6 order confirmation.
