import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    // Runs SSR inside workerd (dev and build) so D1/R2 bindings from wrangler.jsonc work locally.
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // src/server.ts wraps the TanStack handler with the SSR error page.
      server: { entry: "server" },
      importProtection: {
        behavior: "error",
        client: { files: ["**/server/**"], specifiers: ["server-only"] },
      },
    }),
    viteReact(),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core"],
  },
  environments: {
    ssr: {
      // Pre-bundle up front: a mid-request re-optimization in workerd loads a second
      // React copy and breaks hooks ("Cannot read properties of null (reading 'useCallback')").
      optimizeDeps: {
        include: [
          "react",
          "react-dom",
          "react-dom/server",
          "react/jsx-runtime",
          "react/jsx-dev-runtime",
          "zustand",
          "zustand/middleware",
          "@tanstack/react-query",
          "drizzle-orm",
          "drizzle-orm/d1",
          "drizzle-orm/sqlite-core",
          "zod",
          "lucide-react",
          // Admin UI dependencies.
          "sonner",
          "@radix-ui/react-label",
          "@radix-ui/react-switch",
          "@radix-ui/react-alert-dialog",
        ],
      },
    },
  },
});
