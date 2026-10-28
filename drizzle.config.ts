import { defineConfig } from "drizzle-kit";

// Generates SQL migrations into ./drizzle; wrangler applies them to D1
// (`npm run db:migrate:local` / `npm run db:migrate:remote`).
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
});
