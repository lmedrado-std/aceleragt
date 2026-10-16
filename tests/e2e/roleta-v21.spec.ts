/**
 * Roleta V2.1 — testes de aceitação da Tarefa 002 (giro de 12 s, áudio, celebração).
 * Mesmos pré-requisitos de roleta.spec.ts (Postgres local descartável + `npm run dev`).
 */
import { expect, test, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { indexAtAngle } from '../../src/lib/wheel/engine';

const STORE_ID = '11111111-1111-4111-8111-111111111111';
const SELLER_ID = '22222222-2222-4222-8222-222222222222';
const DB = process.env.E2E_DATABASE_URL || 'postgresql://postgres@localhost:5433/aceleragt_e2e';
const SHOTS = process.env.E2E_SHOTS_DIR;

test.setTimeout(120_000);

function seed(credits = 3) {
  execFileSync('node', [path.join(__dirname, 'seed.cjs')], {
    env: { ...process.env, DATABASE_URL: DB, SEED_CREDITS: String(credits) },
    stdio: 'pipe',
  });
}

async function openSellerWheel(page: Page, opts: { muted?: boolean } = {}) {
  await page.addInitScript(
    ({ id, muted }) => {
      sessionStorage.setItem(`sellerAuthenticated-${id}`, 'true');
      localStorage.setItem('aceleragt.roleta.som', muted ? 'off' : 'on');
    },
    { id: SELLER_ID, muted: !!opts.muted },
  );
  await page.goto(`/loja/${STORE_ID}/dashboard?tab=${SELLER_ID}`, { waitUntil: 'networkidle' });
  await page.getByRole('tab', { name: /Roleta/ }).click();
  await expect(page.getByTestId('wheel-spin')).toBeVisible();
}

/** Registra o ângulo acumulado do rotor a cada quadro, para medir duração e voltas reais. */
async function startRotationProbe(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __probe: { samples: [number, number][]; celebrationAt: number | null } };
    w.__probe = { samples: [], celebrationAt: null };
    const rotor = document.querySelector('[data-testid="wheel-rotor"]') as SVGGElement;
    let last: number | null = null;
    let total = 0;
    const loop = (t: number) => {
      const m = new DOMMatrix(getComputedStyle(rotor).transform);
      const a = (((Math.atan2(m.b, m.a) * 180) / Math.PI) % 360 + 360) % 360;
      if (last !== null) {
        let d = a - last;
        if (d < -180) d += 360;
        if (d > 180) d -= 360;
        total += d;
      }
      last = a;
      w.__probe.samples.push([t, total]);
      if (w.__probe.celebrationAt === null && document.querySelector('[data-testid="wheel-celebration"]')) w.__probe.celebrationAt = t;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}

async function readProbe(page: Page) {
  return page.evaluate(() => {
    const w = window as unknown as { __probe: { samples: [number, number][]; celebrationAt: number | null } };
    const s = w.__probe.samples;
    const firstMove = s.find(([, v]) => Math.abs(v) > 0.5);
    let lastMove = s[0];
    for (let i = 1; i < s.length; i++) if (Math.abs(s[i][1] - s[i - 1][1]) > 0.01) lastMove = s[i];
    return {
      startedAt: firstMove ? firstMove[0] : null,
      stoppedAt: lastMove ? lastMove[0] : null,
      totalDeg: s.length ? s[s.length - 1][1] : 0,
      celebrationAt: w.__probe.celebrationAt,
    };
  });
}

async function sliceUnderPointer(page: Page) {
  const { angle, ids } = await page.evaluate(() => {
    const rotor = document.querySelector('[data-testid="wheel-rotor"]') as SVGGElement;
    const m = new DOMMatrix(getComputedStyle(rotor).transform);
    return {
      angle: (Math.atan2(m.b, m.a) * 180) / Math.PI,
      ids: Array.from(rotor.querySelectorAll('[data-segment-id]')).map((el) => el.getAttribute('data-segment-id')),
    };
  });
  return ids[indexAtAngle(ids.length, angle)];
}

type AudioSnapshot = Record<'start' | 'tick' | 'drumroll' | 'stop' | 'fanfare' | 'retry' | 'active', number> & { state: string };

const audio = (page: Page): Promise<AudioSnapshot> =>
  page.evaluate(() => {
    const a = (window as unknown as { __aceleraWheelAudio: { counts: Record<string, number>; active: () => number; state: () => string } })
      .__aceleraWheelAudio;
    return { ...a.counts, active: a.active(), state: a.state() } as AudioSnapshot;
  });

const serverCredits = async (page: Page) => {
  const res = await page.request.get(`/api/wheel/status?storeId=${STORE_ID}&sellerId=${SELLER_ID}&limit=200`);
  const data = await res.json();
  return { credits: data.credits as number, spins: data.pagination.total as number };
};

test.describe('Roleta V2.1 — aceitação', () => {
  test('1-3, 5, 8: ~12 s de rotação, várias voltas, prêmio = servidor, celebração só depois da parada, 1 crédito', async ({ page }) => {
    seed(3);
    await openSellerWheel(page);
    await startRotationProbe(page);
    const spinResponse = page.waitForResponse((r) => r.url().includes('/api/wheel/spin'));
    await page.getByTestId('wheel-spin').click({ force: true });
    const data = await (await spinResponse).json();

    // no meio do giro não há celebração nem resultado
    await page.waitForTimeout(6000);
    await expect(page.getByTestId('wheel-celebration')).toHaveCount(0);
    await expect(page.getByTestId('prize-wheel')).toHaveAttribute('data-phase', 'spinning');

    await expect(page.getByTestId('wheel-celebration')).toBeVisible({ timeout: 20_000 });
    const probe = await readProbe(page);
    const rotationMs = probe.stoppedAt! - probe.startedAt!;
    expect(rotationMs).toBeGreaterThan(11_300);
    expect(rotationMs).toBeLessThan(12_800);
    expect(Number(await page.getByTestId('prize-wheel').getAttribute('data-last-spin-ms'))).toBeGreaterThanOrEqual(11_900);
    expect(probe.totalDeg).toBeGreaterThan(10 * 360);
    expect(probe.celebrationAt! - probe.stoppedAt!).toBeGreaterThanOrEqual(0);

    expect(await sliceUnderPointer(page)).toBe(data.prize.id);
    await expect(page.getByTestId('wheel-result')).toHaveAttribute('data-prize-id', data.prize.id);
    await expect(page.getByTestId('wheel-result-label')).toContainText(data.prize.label);
    // tics sincronizados com as divisas (8 fatias × ~11,8 voltas ≈ 94)
    expect(Number(await page.getByTestId('prize-wheel').getAttribute('data-ticks'))).toBeGreaterThan(80);

    // efeitos visuais não consomem crédito: exatamente 1 giro e 1 crédito
    await page.waitForTimeout(5500); // deixa a festa inteira terminar
    expect(await serverCredits(page)).toEqual({ credits: 2, spins: 1 });
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/v21-celebracao.png` });
  });

  test('4: áudio ativado toca cada som uma vez; silenciado não toca nada', async ({ page, browser }) => {
    seed(3);
    await openSellerWheel(page);
    await page.getByTestId('wheel-spin').click({ force: true });
    await expect(page.getByTestId('wheel-celebration')).toBeVisible({ timeout: 20_000 });
    const on = await audio(page);
    expect(on.state).toBe('running');
    expect(on.start).toBe(1);
    expect(on.drumroll).toBe(1);
    expect(on.stop).toBe(1);
    expect(on.fanfare + on.retry).toBe(1);
    expect(on.tick).toBeGreaterThan(40);

    seed(3);
    const ctx = await browser.newContext();
    const mutedPage = await ctx.newPage();
    await openSellerWheel(mutedPage, { muted: true });
    await expect(mutedPage.getByTestId('wheel-mute')).toHaveAttribute('aria-pressed', 'true');
    await mutedPage.getByTestId('wheel-spin').click({ force: true });
    await expect(mutedPage.getByTestId('wheel-celebration')).toBeVisible({ timeout: 20_000 });
    const off = await audio(mutedPage);
    expect(off).toMatchObject({ start: 0, tick: 0, drumroll: 0, stop: 0, fanfare: 0, retry: 0, state: 'none' });
    await ctx.close();
  });

  test('6: dois giros seguidos sem travar nem acumular sons; 2 créditos, 2 registros', async ({ page }) => {
    seed(3);
    await openSellerWheel(page);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.getByTestId('wheel-spin').click({ force: true });
    await expect(page.getByTestId('wheel-celebration')).toBeVisible({ timeout: 20_000 });
    await page.getByTestId('wheel-spin-again').click();
    await expect(page.getByTestId('wheel-celebration')).toHaveCount(0);
    await expect(page.getByTestId('prize-wheel')).toHaveAttribute('data-phase', 'spinning');
    await expect(page.getByTestId('wheel-celebration')).toBeVisible({ timeout: 20_000 });

    const a = await audio(page);
    expect(a.start).toBe(2);
    expect(a.fanfare + a.retry).toBe(2);
    // depois que a fanfarra termina, nenhuma fonte de áudio fica pendurada
    await page.getByTestId('wheel-celebration-close').click();
    await expect.poll(async () => (await audio(page)).active, { timeout: 6000 }).toBe(0);
    await expect(page.getByTestId('prize-wheel')).toHaveAttribute('data-phase', 'idle');
    expect(await serverCredits(page)).toEqual({ credits: 1, spins: 2 });
    expect(errors).toEqual([]);
  });

  test('7: 390 px — roleta no topo, sem transbordar, celebração legível', async ({ browser }) => {
    seed(2);
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await openSellerWheel(page);
    const box = await page.getByTestId('wheel-rotor').boundingBox();
    const side = await page.getByText('Gire & Ganhe').boundingBox();
    expect(box && side && box.y < side.y).toBeTruthy(); // roda acima dos textos
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
    await page.getByTestId('wheel-spin').click({ force: true });
    await expect(page.getByTestId('wheel-celebration')).toBeVisible({ timeout: 20_000 });
    const card = await page.getByTestId('wheel-result').boundingBox();
    expect(card!.x).toBeGreaterThanOrEqual(0);
    expect(card!.x + card!.width).toBeLessThanOrEqual(391);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/v21-mobile-celebracao.png` });
    await ctx.close();
  });

  test('movimento reduzido no sistema: ainda gira 12 s com efeitos (decisão do dono) e a fatia vencedora fica visível', async ({ browser }) => {
    seed(2);
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await openSellerWheel(page);
    await startRotationProbe(page);
    const spinResponse = page.waitForResponse((r) => r.url().includes('/api/wheel/spin'));
    await page.getByTestId('wheel-spin').click({ force: true });
    const data = await (await spinResponse).json();
    await expect(page.getByTestId('wheel-celebration')).toBeVisible({ timeout: 20_000 });
    const probe = await readProbe(page);
    expect(probe.stoppedAt! - probe.startedAt!).toBeGreaterThan(11_300);
    expect(await sliceUnderPointer(page)).toBe(data.prize.id);
    // o destaque da fatia vencedora é translúcido: o rótulo continua legível
    const opacity = await page.getByTestId('wheel-winner-glow').evaluate((el) => getComputedStyle(el).fillOpacity);
    expect(Number(opacity)).toBeLessThan(0.5);
    await ctx.close();
  });
});
