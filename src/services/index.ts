import { createMockServices } from "./mock";
import type { Services } from "./types";

/**
 * Single entry point for every backend call in the app.
 * Swap this factory for a real implementation (HTTP / server functions)
 * without touching any component.
 */
export const services: Services = createMockServices();

export * from "./types";
