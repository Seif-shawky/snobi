# Snobi

Snobi is a bilingual (English / Arabic) clothing shop made in Egypt. Customers browse the
clothes, pick a size and order with **cash on delivery**. You (the owner) add clothes and handle
orders from a private admin area at `/admin`.

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19) for pages and server functions
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) for hosting
- Cloudflare **D1** (SQLite) for products, sizes, stock and orders, through Drizzle ORM
- Cloudflare **R2** for product photos (served at `/images/...`)

## Run it on your computer

You need Node.js 22 or newer.

```sh
npm install
cp .dev.vars.example .dev.vars   # then edit: set ADMIN_PASSWORD and SESSION_SECRET
npm run db:migrate:local         # creates the local database
npm run dev
```

For `SESSION_SECRET`, paste the output of `openssl rand -base64 32` (32+ characters).
Open the address printed by `npm run dev` and go to `/admin`. Sign in with your
`ADMIN_PASSWORD`.

## Adding a product

1. Go to **/admin → Products → Add product**.
2. Fill in the English and Arabic name. The web address (e.g. `red-tee`) is suggested from the
   English name; you can change it.
3. Add the descriptions (optional).
4. Under **Sizes, prices and stock**, add one row per size: size label (S, M, L…), price in EGP
   (e.g. `450` or `450.50`), and how many you have. SKU is optional. Use the arrows to reorder
   sizes and the **On sale** switch to hide one size without deleting it.
5. Leave the status on **Draft** and click **Create product**.
6. On the next page, click **Upload photos** (JPEG, PNG or WebP, up to 5 MB each). The first
   photo is the cover; use the arrows to reorder and add short descriptions, then click
   **Save photo order and descriptions**.
7. When everything looks right, set status to **Active** and save. Only active products show in
   the shop, and a product needs at least one size on sale to be active.

To stop selling something, **Archive** it rather than deleting it. Deleting removes the product,
its sizes and photos for good (past orders still keep their details).

## How orders work

- Customers order without paying online; they pay cash when the parcel arrives.
- Stock goes down as soon as an order is placed, so the shop never sells more than you have.
- New orders appear under **/admin → Orders** as **pending**. Open one, then call or WhatsApp
  the customer to confirm.
- Enter the agreed **delivery fee** and save it; the page shows the total to collect.
- Move the order along: pending → confirmed → shipped → delivered.
- **Cancel** (possible while pending or confirmed) puts the items back into stock. Cancelling
  twice never adds the stock back twice.

## Scripts

| Command                     | What it does                                 |
| --------------------------- | -------------------------------------------- |
| `npm run dev`               | Run the site locally with a local D1 and R2  |
| `npm run build`             | Build for production                         |
| `npm test`                  | Run the unit tests                           |
| `npm run lint`              | Check code style                             |
| `npm run typecheck`         | Check TypeScript types                       |
| `npm run db:generate`       | Create a migration after changing the schema |
| `npm run db:migrate:local`  | Apply migrations to the local database       |
| `npm run db:migrate:remote` | Apply migrations to the live database        |
| `npm run deploy`            | Build and deploy to Cloudflare               |

## Deploying to Cloudflare

One-time setup:

```sh
npx wrangler login
npx wrangler d1 create snobi            # copy the printed database_id into wrangler.jsonc
npx wrangler r2 bucket create snobi-images
npm run db:migrate:remote
npx wrangler secret put ADMIN_PASSWORD  # choose a long password
openssl rand -base64 32                 # copy the output...
npx wrangler secret put SESSION_SECRET  # ...and paste it here
```

Then, every time you want to publish changes:

```sh
npm run db:migrate:remote   # only needed when there are new migrations
npm run deploy
```

Security notes: admin sign-ins last 7 days. Five wrong passwords from the same connection pause
sign-in for 15 minutes. To sign out every device at once, set a new `SESSION_SECRET`.
