import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    // Os testes E2E do Playwright ficam em `e2e/` e não devem rodar no Vitest.
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**", "apps/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/app/**",
        "src/components/**",
        "src/lib/prisma.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
