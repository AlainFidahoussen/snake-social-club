import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  resolve: {
    // Avoid duplicate React/TanStack Query copies causing invalid-hook-call errors.
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      // nitro/vite builds from this
      server: { entry: "server" },
    }),
    // Emit a plain static bundle (.output/public) instead of the Cloudflare Workers bundle, so the
    // FastAPI backend can serve the frontend directly (see backend/app/main.py) instead of running
    // a separate Node/Workers server. Only needed for `vite build`, not `vite dev`.
    //
    // Nitro's static preset currently throws after prerendering ("rolldownOptions.input should not
    // be an html file when building for SSR" — https://github.com/nitrojs/nitro/issues/3843, still
    // open upstream). The prerendered files under .output/public are already written correctly by
    // that point, so the Dockerfile's build step checks for them rather than the build's exit code.
    ...(command === "build" ? [nitro({ preset: "static" })] : []),
    viteReact(),
  ],
}));
