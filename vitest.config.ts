import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/main.ts', 'src/ui/renderer.ts', 'src/ui/sound.ts'],
    },
  },
  resolve: {
    alias: {
      // Remove .js extensions for test imports
    },
  },
});
