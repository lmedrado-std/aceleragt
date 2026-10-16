import { expect, test, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { indexAtAngle } from '../../src/lib/wheel/engine';

const STORE_ID = '11111111-1111-4111-8111-111111111111';
const SELLER_ID = '22222222-2222-4222-8222-222222222222';
const DB = process.env.E2E_DATABASE_URL || 'postgresql://postgres@localhost:5433/aceleragt_e2e';
const SHOTS = process.env.E2E_SHOTS_DIR;

function seed(credits = 3) {
  execFileSync('node', [path.join(__dirname, 'seed.cjs')], {
    env: { ...process.env, DATABASE_URL: DB, SEED_CREDITS: String(credits) },
    stdio: 'pipe',
  });
}

async function openSellerWheel(page: Page) {
  await page.addInitScript((id) => sessionStorage.setItem(`sellerAuthenticated-${id}`, 'true'), SELLER_ID);
  await page.goto(`/loja/${STORE_ID}/dashboard?tab=${SELLER_ID}`, { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: /Roleta/ }).click();
  await expect(page.getByTestId('wheel-spin')).toBeVisible();
}

/** Lê a rotação REAL do SVG no navegador e devolve o id da fatia sob o ponteiro. */
async function sliceUnderPointer(page: Page) {
  const { angle, ids } = await page.evaluate(() => {
    const rotor = document.querySelector('[data-testid="wheel-rotor"]') as SVGGElement;
    const m = new DOMMatrix(getComputedStyle(rotor).transform);
    return {
      angle: (Math.atan2(m.b, m.a) * 180) / Math.PI,
      ids: Array.from(rotor.querySelectorAll('[data-segment-id]')).map((el) => el.getAttribute('data-segment-id')),
    };
  });
  const idx = indexAtAngle(ids.length, angle);
  return { angle, idx, id: ids[idx] };
}

const credits = (page: Page) => page.getByTestId('wheel-credits').getAttribute('data-credits');

test.describe('Roleta V2 — vendedor', () => {
  test.beforeEach(() => seed(3));

  test('a fatia sob o ponteiro é o prêmio gravado no servidor e o saldo desce 3 → 2', async ({ page }) => {
    await openSellerWheel(page);
    expect(await credits(page)).toBe('3');
    const spinResponse = page.waitForResponse((r) => r.url().includes('/api/wheel/spin'));
    await page.getByTestId('wheel-spin').click({ force: true });
    const data = await (await spinResponse).json();
    const result = page.getByTestId('wheel-result');
    await expect(result).toBeVisible({ timeout: 20_000 });

    const landed = await sliceUnderPointer(page);
    expect(landed.id).toBe(data.prize.id);
    await expect(result).toHaveAttribute('data-prize-id', data.prize.id);
    await expect(page.getByTestId('wheel-result-label')).toContainText(data.prize.label);
    expect(await credits(page)).toBe('2');
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/e2e-resultado.png`, fullPage: true });
  });

  test('clique duplo rápido gera um único giro', async ({ page }) => {
    await openSellerWheel(page);
    const calls: number[] = [];
    page.on('response', (r) => {
      if (r.url().includes('/api/wheel/spin')) calls.push(r.status());
    });
    const btn = page.getByTestId('wheel-spin');
    await btn.dblclick({ force: true });
    await btn.click({ force: true }).catch(() => {});
    await expect(page.getByTestId('wheel-result')).toBeVisible({ timeout: 20_000 });
    expect(calls.filter((s) => s === 200)).toHaveLength(1);
    expect(await credits(page)).toBe('2');
  });

  test('gestor muda os prêmios com a tela do vendedor aberta: o giro usa a roda nova, sem erro', async ({ page, request }) => {
    await openSellerWheel(page);
    const save = await request.post('/api/wheel/settings', {
      data: {
        storeId: STORE_ID,
        segments: [
          { label: 'Novo A', type: 'money', value: 7, weight: 1, color: '#16A34A' },
          { label: 'Novo B', type: 'retry', weight: 1, color: '#1E3A8A' },
          { label: 'Novo C', type: 'voucher', weight: 1, color: '#DB2777' },
        ],
      },
    });
    expect(save.ok()).toBeTruthy();
    const spinResponse = page.waitForResponse((r) => r.url().includes('/api/wheel/spin'));
    await page.getByTestId('wheel-spin').click({ force: true });
    const data = await (await spinResponse).json();
    expect(['Novo A', 'Novo B', 'Novo C']).toContain(data.prize.label);
    await expect(page.getByTestId('wheel-result')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-segment-id]')).toHaveCount(3);
    expect((await sliceUnderPointer(page)).id).toBe(data.prize.id);
    await expect(page.getByTestId('wheel-error')).toHaveCount(0);
  });

  test('sem saldo o botão fica desabilitado', async ({ page }) => {
    seed(0);
    await openSellerWheel(page);
    await expect(page.getByTestId('wheel-spin')).toBeDisabled();
    await expect(page.getByTestId('wheel-spin')).toHaveText(/Sem giros/i);
  });

  test('preferência de som persiste no navegador', async ({ page }) => {
    await openSellerWheel(page);
    const mute = page.getByTestId('wheel-mute');
    await expect(mute).toHaveAttribute('aria-pressed', 'false');
    await mute.click();
    await expect(mute).toHaveAttribute('aria-pressed', 'true');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: /Roleta/ }).click();
    await expect(page.getByTestId('wheel-mute')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Roleta V2 — celular e movimento reduzido', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test.beforeEach(() => seed(2));

  test('390 px: a roleta cabe na tela; giro curto ainda sincronizado', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openSellerWheel(page);
    // Mede só a área da roleta (o cabeçalho do painel já transborda antes desta tarefa — fora do escopo).
    const bounds = await page.evaluate(() => {
      let left = Infinity;
      let right = -Infinity;
      for (const el of document.querySelectorAll('[data-testid="prize-wheel"] *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
      }
      return { left, right, vw: window.innerWidth };
    });
    expect(bounds.left).toBeGreaterThanOrEqual(-1);
    expect(bounds.right).toBeLessThanOrEqual(bounds.vw + 1);
    const spinResponse = page.waitForResponse((r) => r.url().includes('/api/wheel/spin'));
    const started = Date.now();
    await page.getByTestId('wheel-spin').click({ force: true });
    const data = await (await spinResponse).json();
    const tResp = Date.now() - started;
    await expect(page.getByTestId('wheel-result')).toBeVisible({ timeout: 10_000 });
    console.log('tempo até resposta', tResp, 'até resultado', Date.now() - started);
    expect(Date.now() - started).toBeLessThan(6000);
    expect((await sliceUnderPointer(page)).id).toBe(data.prize.id);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/e2e-mobile.png`, fullPage: true });
  });
});

test.describe('Roleta V2 — gestor', () => {
  test.beforeEach(() => seed(3));

  test('concede giro, configura com prévia e consulta histórico sem botão de apagar', async ({ page }) => {
    await page.addInitScript((id) => sessionStorage.setItem(`storeAuthenticated-${id}`, 'true'), STORE_ID);
    await page.goto(`/loja/${STORE_ID}/dashboard?tab=admin`, { waitUntil: 'networkidle' });
    await page.getByRole('tab', { name: /^Roleta$/ }).click();

    const row = page.locator(`[data-testid="wheel-manager-row"][data-seller-id="${SELLER_ID}"]`);
    await expect(row.getByTestId('wheel-manager-credits')).toHaveText('3');
    await row.getByTestId('wheel-grant-1').dblclick();
    await expect(row.getByTestId('wheel-manager-credits')).toHaveText(/^[45]$/);
    // a trava de envio impede concessão em dobro no clique duplo
    await page.waitForTimeout(800);
    await expect(row.getByTestId('wheel-manager-credits')).toHaveText('4');

    await page.getByRole('tab', { name: /Configurar Prêmios/ }).click();
    const rows = page.getByTestId('wheel-settings-row');
    await expect(rows).toHaveCount(8);
    await rows.first().getByLabel('Peso').fill('0');
    await page.getByTestId('wheel-settings-save').click();
    await expect(page.getByText('Peso precisa ser inteiro maior que zero.')).toBeVisible();
    await rows.first().getByLabel('Peso').fill('60');
    await page.getByTestId('wheel-settings-save').click();
    await expect(page.getByText('Roleta salva').first()).toBeVisible();
    await expect(page.getByTestId('wheel-settings-chance').first()).toHaveText('36.4%');

    await page.getByRole('tab', { name: /Histórico/ }).click();
    await expect(page.getByTestId('wheel-history')).toBeVisible();
    await expect(page.getByRole('button', { name: /Apagar/i })).toHaveCount(0);
  });
});
