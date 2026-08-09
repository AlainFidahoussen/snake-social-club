// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Emit a plain static bundle (.output/public) instead of the Cloudflare Workers bundle, so the
  // FastAPI backend can serve the frontend directly (see backend/app/main.py) instead of running
  // a separate Node/Workers server. Ignored inside the Lovable sandbox, which forces its own
  // Cloudflare preset regardless of this setting.
  //
  // Nitro's static preset currently throws after prerendering ("rolldownOptions.input should not
  // be an html file when building for SSR" — https://github.com/nitrojs/nitro/issues/3843, still
  // open upstream). The prerendered files under .output/public are already written correctly by
  // that point, so the Dockerfile's build step checks for them rather than the build's exit code.
  nitro: { preset: "static" },
});
