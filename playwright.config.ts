import { defineConfig, devices } from '@playwright/test';

/**
 * Testes ponta a ponta da Roleta V2.
 * Pré-requisitos (nunca contra produção):
 *   1. Postgres local descartável: E2E_DATABASE_URL=postgresql://postgres@localhost:5433/aceleragt_e2e
 *   2. `DATABASE_URL=$E2E_DATABASE_URL npx prisma db push --skip-generate`
 *   3. `DATABASE_URL=$E2E_DATABASE_URL npm run dev` (porta 9004)
 *   4. `npm run test:e2e`
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:9004',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
