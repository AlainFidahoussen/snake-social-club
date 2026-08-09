import { createHttpServices } from "./http";
import type { Services } from "./types";

let instance: Services | null = null;

/**
 * Single entry point for every backend call in the app.
 * Lazy so no I/O or randomness runs at module scope (the SSR runtime
 * forbids that).
 */
export function getServices(): Services {
  instance ??= createHttpServices();
  return instance;
}

export * from "./types";
