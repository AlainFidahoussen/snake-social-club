import { createMockServices } from "./mock";
import type { Services } from "./types";

let instance: Services | null = null;

/**
 * Single entry point for every backend call in the app.
 * Swap this factory for a real implementation (HTTP / server functions)
 * without touching any component. Lazy so no I/O or randomness runs at
 * module scope (the SSR runtime forbids that).
 */
export function getServices(): Services {
  instance ??= createMockServices();
  return instance;
}

export * from "./types";
