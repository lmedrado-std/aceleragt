import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { assertDisposableDatabase, call, jsonRequest, TEST_DB } from './helpers';

assertDisposableDatabase();

// Importações dinâmicas: DATABASE_URL precisa estar definido antes do PrismaClient nascer.
let prisma: typeof import('@/lib/db').prisma;
let spin: typeof import('@/app/api/wheel/spin/route');
let settings: typeof import('@/app/api/wheel/settings/route');
let grant: typeof import('@/app/api/wheel/grant/route');
let status: typeof import('@/app/api/wheel/status/route');
let history: typeof import('@/app/api/wheel/history/route');
let engine: typeof import('@/lib/wheel/engine');
let SPIN_COOLDOWN_MS = 0;

const run = describe.skipIf(!TEST_DB);

async function resetDb() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE prize_wheel_spins, prize_wheel_segments, prize_wheel_settings, prize_wheel_credits, sellers, goals, "SellerHistory", stores CASCADE',
  );
}

async function createStore(name = 'Loja Teste') {
  return prisma.stores.create({ data: { name }, select: { id: true } });
}

async function createSeller(storeId: string, name: string) {
  return prisma.sellers.create({
    data: { store_id: storeId, name, password: 'x', avatar_id: 'avatar1' },
    select: { id: true },
  });
}

type SegSeed = { label: string; type?: string; value?: number | null; weight?: number | null; is_active?: boolean | null; color?: string };

async function seedWheel(storeId: string, segs: SegSeed[]) {
  const s = await prisma.prize_wheel_settings.create({ data: { store_id: storeId }, select: { id: true } });
  const ids: string[] = [];
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const row = await prisma.prize_wheel_segments.create({
      data: {
        settings_id: s.id,
        label: seg.label,
        type: seg.type ?? 'money',
        value: seg.value === undefined ? 10 : seg.value,
        weight: seg.weight === undefined ? 10 : seg.weight,
        is_active: seg.is_active === undefined ? true : seg.is_active,
        color: seg.color ?? '#123456',
        position: i,
      },
      select: { id: true },
    });
    ids.push(row.id);
  }
  return { settingsId: s.id, ids };
}

async function setCredits(storeId: string, sellerId: string, credits: number) {
  await prisma.prize_wheel_credits.upsert({
    where: { store_id_seller_id: { store_id: storeId, seller_id: sellerId } },
    create: { store_id: storeId, seller_id: sellerId, credits },
    update: { credits },
  });
}

const getCredits = async (storeId: string, sellerId: string) =>
  (await prisma.prize_wheel_credits.findUnique({
    where: { store_id_seller_id: { store_id: storeId, seller_id: sellerId } },
    select: { credits: true },
  }))?.credits ?? null;

const doSpin = (storeId: string, sellerId: string) =>
  call(spin.POST, jsonRequest('/api/wheel/spin', 'POST', { storeId, sellerId }));

run('Roleta V2 — APIs contra Postgres descartável', () => {
  beforeAll(async () => {
    prisma = (await import('@/lib/db')).prisma;
    spin = await import('@/app/api/wheel/spin/route');
    settings = await import('@/app/api/wheel/settings/route');
    grant = await import('@/app/api/wheel/grant/route');
    status = await import('@/app/api/wheel/status/route');
    history = await import('@/app/api/wheel/history/route');
    engine = await import('@/lib/wheel/engine');
    SPIN_COOLDOWN_MS = (await import('@/lib/wheel/server')).SPIN_COOLDOWN_MS;
  });
  beforeEach(resetDb);
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  describe('POST /api/wheel/spin', () => {
    it('débito, sorteio e registro coerentes: a fatia sob o ponteiro é a gravada', async () => {
      const { id: storeId } = await createStore();
      const { id: sellerId } = await createSeller(storeId, 'Ana');
      const { ids } = await seedWheel(storeId, [{ label: 'A' }, { label: 'B' }, { label: 'C' }, { label: 'D' }]);
      await setCredits(storeId, sellerId, 2);

      const r = await doSpin(storeId, sellerId);
      expect(r.status).toBe(200);
      const d = r.json;
      expect(d.remainingCredits).toBe(1);
      expect(await getCredits(storeId, sellerId)).toBe(1);
      expect(d.wheelSnapshot.map((s: any) => s.id)).toEqual(ids);
      expect(d.wheelSnapshot[d.selectedIndex].id).toBe(d.prize.id);
      expect(engine.indexAtAngle(d.wheelSnapshot.length, d.stopAngleDeg)).toBe(d.selectedIndex);
      expect(engine.indexAtAngle(d.wheelSnapshot.length, engine.targetRotation(123.4, d.stopAngleDeg, 8))).toBe(d.selectedIndex);
      const rows = await prisma.prize_wheel_spins.findMany({ where: { seller_id: sellerId } });
      expect(rows).toHaveLength(1);
      expect(rows[0].segment_id).toBe(d.prize.id);
      expect(rows[0].id).toBe(d.spinId);
      // O snapshot entregue ao navegador não expõe pesos.
      expect(d.wheelSnapshot[0].weight).toBeUndefined();
    });

    it('concorrência: saldo 1 e 10 pedidos simultâneos → exatamente 1 giro, saldo 0, nunca negativo', async () => {
      const { id: storeId } = await createStore();
      const { id: sellerId } = await createSeller(storeId, 'Bia');
      await seedWheel(storeId, [{ label: 'A' }, { label: 'B' }]);
      await setCredits(storeId, sellerId, 1);

      const results = await Promise.all(Array.from({ length: 10 }, () => doSpin(storeId, sellerId)));
      expect(results.filter((r) => r.status === 200)).toHaveLength(1);
      expect(results.filter((r) => r.status !== 200).every((r) => r.status === 409 || r.status === 429)).toBe(true);
      expect(await getCredits(storeId, sellerId)).toBe(0);
      expect(await prisma.prize_wheel_spins.count({ where: { seller_id: sellerId } })).toBe(1);
    });

    it('clique duplo / reenvio: saldo 5 e 10 pedidos simultâneos → 1 giro e apenas 1 crédito descontado', async () => {
      const { id: storeId } = await createStore();
      const { id: sellerId } = await createSeller(storeId, 'Caio');
      await seedWheel(storeId, [{ label: 'A' }, { label: 'B' }]);
      await setCredits(storeId, sellerId, 5);

      const results = await Promise.all(Array.from({ length: 10 }, () => doSpin(storeId, sellerId)));
      expect(results.filter((r) => r.status === 200)).toHaveLength(1);
      expect(results.filter((r) => r.status === 429).length).toBe(9);
      expect(await getCredits(storeId, sellerId)).toBe(4);
      expect(await prisma.prize_wheel_spins.count({ where: { seller_id: sellerId } })).toBe(1);
    });

    it('depois da janela anti-repetição, o próximo giro é aceito', async () => {
      const { id: storeId } = await createStore();
      const { id: sellerId } = await createSeller(storeId, 'Davi');
      await seedWheel(storeId, [{ label: 'A' }, { label: 'B' }]);
      await setCredits(storeId, sellerId, 2);
      expect((await doSpin(storeId, sellerId)).status).toBe(200);
      expect((await doSpin(storeId, sellerId)).status).toBe(429);
      await new Promise((r) => setTimeout(r, SPIN_COOLDOWN_MS + 200));
      const third = await doSpin(storeId, sellerId);
      expect(third.status).toBe(200);
      expect(third.json.remainingCredits).toBe(0);
    }, 15000);

    it('sem saldo → 409 noCredits; saldo negativo legado não gira nem fica mais negativo', async () => {
      const { id: storeId } = await createStore();
      const { id: a } = await createSeller(storeId, 'Eva');
      const { id: b } = await createSeller(storeId, 'Fábio');
      await seedWheel(storeId, [{ label: 'A' }, { label: 'B' }]);
      await setCredits(storeId, b, -3);
      const r1 = await doSpin(storeId, a);
      expect(r1.status).toBe(409);
      expect(r1.json.noCredits).toBe(true);
      const r2 = await doSpin(storeId, b);
      expect(r2.status).toBe(409);
      expect(await getCredits(storeId, b)).toBe(-3);
      expect(await prisma.prize_wheel_spins.count()).toBe(0);
    });

    it('roleta sem prêmios sorteáveis → 409 e o crédito NÃO é descontado', async () => {
      const { id: storeId } = await createStore();
      const { id: sellerId } = await createSeller(storeId, 'Gil');
      await seedWheel(storeId, [{ label: 'A', weight: 0 }, { label: 'B', is_active: false }]);
      await setCredits(storeId, sellerId, 1);
      const r = await doSpin(storeId, sellerId);
      expect(r.status).toBe(409);
      expect(r.json.notConfigured).toBe(true);
      expect(await getCredits(storeId, sellerId)).toBe(1);
    });

    it('fatia arquivada e fatia com peso 0 nunca são sorteadas nem aparecem no snapshot; peso nulo participa', async () => {
      const { id: storeId } = await createStore();
      const { ids } = await seedWheel(storeId, [
        { label: 'Ativo nulo', weight: null },
        { label: 'Arquivado', is_active: false },
        { label: 'Peso zero', weight: 0 },
        { label: 'Ativo', weight: 10 },
        { label: 'Ativo is_active nulo', is_active: null },
      ]);
      const sellers = await Promise.all(Array.from({ length: 30 }, (_, i) => createSeller(storeId, `V${i}`)));
      for (const s of sellers) await setCredits(storeId, s.id, 1);
      const results = await Promise.all(sellers.map((s) => doSpin(storeId, s.id)));
      expect(results.every((r) => r.status === 200)).toBe(true);
      const drawn = new Set(results.map((r) => r.json.prize.id));
      expect(drawn.has(ids[1])).toBe(false);
      expect(drawn.has(ids[2])).toBe(false);
      expect(results[0].json.wheelSnapshot.map((s: any) => s.id)).toEqual([ids[0], ids[3], ids[4]]);
    });

    it('corpo inválido → 400 sem tocar no banco', async () => {
      expect((await call(spin.POST, jsonRequest('/api/wheel/spin', 'POST', '{nope'))).status).toBe(400);
      expect((await call(spin.POST, jsonRequest('/api/wheel/spin', 'POST', { storeId: 'x', sellerId: 'y' }))).status).toBe(400);
    });
  });

  describe('POST /api/wheel/grant', () => {
    it('valida quantidade e vendedor da loja', async () => {
      const { id: storeId } = await createStore();
      const { id: other } = await createStore('Outra');
      const { id: sellerId } = await createSeller(storeId, 'Hugo');
      const { id: foreign } = await createSeller(other, 'Iris');
      const g = (body: any) => call(grant.POST, jsonRequest('/api/wheel/grant', 'POST', body));

      for (const credits of [0, -5, 1.5, 51, 'abc', null]) {
        expect((await g({ storeId, sellerId, credits })).status).toBe(400);
      }
      expect((await g({ storeId, sellerId: foreign, credits: 1 })).status).toBe(404);
      expect(await prisma.prize_wheel_credits.count()).toBe(0);

      const ok1 = await g({ storeId, sellerId, credits: 3, grantedBy: 'qualquer' });
      expect(ok1.status).toBe(200);
      expect(ok1.json.totalCredits).toBe(3);
      const ok2 = await g({ storeId, sellerId, credits: '2' });
      expect(ok2.status).toBe(200);
      expect(ok2.json.totalCredits).toBe(5);
    });

    it('concessões simultâneas para vendedor sem linha de saldo somam todas', async () => {
      const { id: storeId } = await createStore();
      const { id: sellerId } = await createSeller(storeId, 'João');
      const results = await Promise.all(
        Array.from({ length: 5 }, () => call(grant.POST, jsonRequest('/api/wheel/grant', 'POST', { storeId, sellerId, credits: 1 }))),
      );
      expect(results.every((r) => r.status === 200)).toBe(true);
      expect(await getCredits(storeId, sellerId)).toBe(5);
    });
  });

  describe('GET/POST /api/wheel/settings', () => {
    const post = (body: any) => call(settings.POST, jsonRequest('/api/wheel/settings', 'POST', body));
    const get = (storeId: string, archived = false) =>
      call(settings.GET, jsonRequest(`/api/wheel/settings?storeId=${storeId}${archived ? '&include=archived' : ''}`, 'GET'));

    it('cria, reordena, arquiva (nunca exclui) e restaura prêmios, preservando o histórico', async () => {
      const { id: storeId } = await createStore();
      const { id: sellerId } = await createSeller(storeId, 'Kiko');
      const created = await post({
        storeId,
        segments: [
          { label: 'R$ 10', type: 'money', value: 10, weight: 5, color: '#00ff00' },
          { label: 'Brinde', type: 'product', value: 99, weight: 3 },
          { label: 'Tente', type: 'retry', weight: 2 },
        ],
      });
      expect(created.status).toBe(200);
      const [s10, brinde, tente] = created.json.segments;
      expect(brinde.value).toBeNull(); // valor só vale para dinheiro
      expect(created.json.wheel).toHaveLength(3);

      // um giro registrado no "Brinde"
      await prisma.prize_wheel_spins.create({
        data: { store_id: storeId, seller_id: sellerId, segment_id: brinde.id, granted_by: 'system', status: 'claimed' },
      });

      // remove "Brinde" e "Tente", reordena e adiciona um novo
      const saved = await post({
        storeId,
        segments: [
          { id: 'new-1', label: 'R$ 50', type: 'money', value: 50, weight: 1 },
          { ...s10, weight: 7 },
        ],
      });
      expect(saved.status).toBe(200);
      expect(saved.json.segments.map((s: any) => s.label)).toEqual(['R$ 50', 'R$ 10']);
      expect(saved.json.archived.map((s: any) => s.label).sort()).toEqual(['Brinde', 'Tente']);
      expect(await prisma.prize_wheel_segments.count()).toBe(4); // nada excluído
      expect(await prisma.prize_wheel_spins.count()).toBe(1); // histórico intacto

      // restaura "Tente"
      const restored = await post({ storeId, segments: [...saved.json.segments, { ...tente, weight: 4 }] });
      expect(restored.json.segments.map((s: any) => s.label)).toEqual(['R$ 50', 'R$ 10', 'Tente']);
      expect(restored.json.archived.map((s: any) => s.label)).toEqual(['Brinde']);

      const g = await get(storeId);
      expect(g.json.archived).toBeUndefined();
      expect(g.json.wheel.map((s: any) => s.label)).toEqual(['R$ 50', 'R$ 10', 'Tente']);
      expect((await get(storeId, true)).json.archived).toHaveLength(1);
    });

    it('rejeita configuração inválida no servidor', async () => {
      const { id: storeId } = await createStore();
      const base = { label: 'X', type: 'retry', weight: 1 };
      const cases = [
        [base],
        Array.from({ length: 13 }, () => base),
        [base, { ...base, weight: 0 }],
        [base, { ...base, weight: 2.5 }],
        [base, { ...base, label: '   ' }],
        [base, { ...base, type: 'bitcoin' }],
        [base, { ...base, type: 'money' }],
        [base, { ...base, type: 'money', value: -1 }],
        [base, { ...base, color: 'red' }],
      ];
      for (const segments of cases) {
        const r = await post({ storeId, segments });
        expect(r.status).toBe(400);
        expect(typeof r.json.error).toBe('string');
      }
      expect((await post({ storeId: '00000000-0000-4000-8000-000000000000', segments: [base, base] })).status).toBe(404);
      expect(await prisma.prize_wheel_segments.count()).toBe(0);
    });

    it('id de prêmio de outra loja não é alterado (vira prêmio novo desta loja)', async () => {
      const { id: a } = await createStore('A');
      const { id: b } = await createStore('B');
      const { ids } = await seedWheel(b, [{ label: 'Da B' }, { label: 'Da B 2' }]);
      const r = await post({
        storeId: a,
        segments: [
          { id: ids[0], label: 'Invasor', type: 'retry', weight: 1 },
          { label: 'Outro', type: 'retry', weight: 1 },
        ],
      });
      expect(r.status).toBe(200);
      const original = await prisma.prize_wheel_segments.findUnique({ where: { id: ids[0] } });
      expect(original?.label).toBe('Da B');
    });

    it('GET mostra peso nulo como 10, e configured=false quando não há fatia sorteável', async () => {
      const { id: storeId } = await createStore();
      expect((await get(storeId)).json.configured).toBe(false);
      await seedWheel(storeId, [{ label: 'A', weight: null }, { label: 'B', weight: 0 }]);
      const g = await get(storeId);
      expect(g.json.configured).toBe(true);
      expect(g.json.segments.map((s: any) => s.weight)).toEqual([10, 0]);
      expect(g.json.wheel.map((s: any) => s.label)).toEqual(['A']);
    });
  });

  describe('GET /api/wheel/status e DELETE /api/wheel/history', () => {
    it('totais calculados sobre todos os giros (não só 50), paginação e filtros', async () => {
      const { id: storeId } = await createStore();
      const { id: s1 } = await createSeller(storeId, 'Lia');
      const { id: s2 } = await createSeller(storeId, 'Max');
      const { ids } = await seedWheel(storeId, [
        { label: 'R$ 5', type: 'money', value: 5 },
        { label: 'Tente', type: 'retry', value: null },
      ]);
      const base = new Date('2026-09-10T12:00:00Z').getTime();
      const data = Array.from({ length: 120 }, (_, i) => ({
        store_id: storeId,
        seller_id: i % 3 === 0 ? s2 : s1,
        segment_id: i % 2 === 0 ? ids[0] : ids[1],
        granted_by: 'system',
        status: 'claimed',
        created_at: new Date(base + i * 60_000 * 60 * 6), // a cada 6 h
      }));
      await prisma.prize_wheel_spins.createMany({ data });
      await setCredits(storeId, s1, 2);

      const q = (qs: string) => call(status.GET, jsonRequest(`/api/wheel/status?storeId=${storeId}${qs}`, 'GET'));
      const all = await q('');
      expect(all.status).toBe(200);
      expect(all.json.stats.totalSpins).toBe(120);
      expect(all.json.stats.totalValue).toBe(60 * 5);
      expect(all.json.spins).toHaveLength(50);
      expect(all.json.pagination.total).toBe(120);
      expect(all.json.spins[0].sellerName).toBeTruthy();
      expect(all.json.creditsMap[s1]).toBe(2);
      expect(all.json.sellers.find((s: any) => s.id === s2).spins).toBe(40);

      const page3 = await q('&limit=50&offset=100');
      expect(page3.json.spins).toHaveLength(20);

      const mine = await q(`&sellerId=${s2}&limit=200`);
      expect(mine.json.spins).toHaveLength(40);
      expect(mine.json.filteredStats.totalSpins).toBe(40);
      expect(mine.json.stats.totalSpins).toBe(120);
      expect(mine.json.credits).toBe(0);
      expect(mine.json.sellers).toHaveLength(1);

      const period = await q('&from=2026-09-10&to=2026-09-10');
      // Em Brasília, o dia 10 tem giros às 09h, 15h e 21h (12:00Z, 18:00Z e 00:00Z do dia 11).
      expect(period.json.pagination.total).toBe(3);

      expect((await q('&limit=9999')).json.pagination.limit).toBe(200);
      expect((await call(status.GET, jsonRequest('/api/wheel/status?storeId=abc', 'GET'))).status).toBe(400);
    });

    it('DELETE do histórico responde 410 e não apaga nada', async () => {
      const { id: storeId } = await createStore();
      const { id: s1 } = await createSeller(storeId, 'Nina');
      const { ids } = await seedWheel(storeId, [{ label: 'A' }, { label: 'B' }]);
      await prisma.prize_wheel_spins.create({
        data: { store_id: storeId, seller_id: s1, segment_id: ids[0], granted_by: 'system', status: 'claimed' },
      });
      const res = await history.DELETE();
      expect(res.status).toBe(410);
      expect(await prisma.prize_wheel_spins.count()).toBe(1);
    });
  });
});
