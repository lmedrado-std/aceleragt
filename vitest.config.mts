import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Testes unitários sempre rodam. Os de integração exigem TEST_DATABASE_URL
// apontando para um Postgres DESCARTÁVEL (nunca o banco de produção).
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
