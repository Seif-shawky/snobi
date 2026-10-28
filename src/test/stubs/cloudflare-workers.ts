// Vitest stand-in for the Workers runtime module. Tests never touch real bindings;
// anything that would reach D1/R2 must be mocked or factored into pure functions.
export const env = {} as Record<string, unknown>;
