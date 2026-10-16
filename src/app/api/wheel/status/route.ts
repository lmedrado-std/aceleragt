import { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { buildWheelSnapshot, normalizeColor } from '@/lib/wheel/engine';
import { idSchema } from '@/lib/wheel/validation';
import { jsonError, jsonOk, loadStoreSegments, SPIN_SELECT } from '@/lib/wheel/server';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function parseIntParam(value: string | null, fallback: number, min: number, max: number) {
  const n = value === null ? NaN : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function parseDateParam(value: string | null, endOfDay = false): Date | null {
  if (!value) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const d = new Date(isDateOnly ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}-03:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * GET /api/wheel/status?storeId=...
 *   [&sellerId=...]          só os dados desse vendedor (saldo e giros dele)
 *   [&limit=50&offset=0]     paginação do histórico (máx. 200 por página)
 *   [&from=YYYY-MM-DD&to=YYYY-MM-DD]  filtro de período (horário de Brasília)
 *
 * Totais (`stats`) são calculados no banco sobre TODOS os giros da loja, não só sobre a página.
 * `filteredStats` usa os mesmos filtros do histórico.
 * Campos antigos (`creditsMap`, `segments`, `spins`, `stats`) foram mantidos.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeParsed = idSchema.safeParse(searchParams.get('storeId'));
  if (!storeParsed.success) return jsonError(400, 'storeId inválido.');
  const storeId = storeParsed.data;

  const sellerParam = searchParams.get('sellerId');
  let sellerId: string | null = null;
  if (sellerParam) {
    const sp = idSchema.safeParse(sellerParam);
    if (!sp.success) return jsonError(400, 'sellerId inválido.');
    sellerId = sp.data;
  }
  const limit = parseIntParam(searchParams.get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT);
  const offset = parseIntParam(searchParams.get('offset'), 0, 0, 1_000_000);
  const from = parseDateParam(searchParams.get('from'));
  const to = parseDateParam(searchParams.get('to'), true);

  const storeWhere: Prisma.prize_wheel_spinsWhereInput = { store_id: storeId };
  const filteredWhere: Prisma.prize_wheel_spinsWhereInput = {
    store_id: storeId,
    ...(sellerId ? { seller_id: sellerId } : {}),
    ...(from || to ? { created_at: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
  };

  try {
    const [segments, creditRows, sellers, spins, filteredTotal, storeBySegment, filteredBySegment, bySeller] =
      await Promise.all([
        loadStoreSegments(prisma, storeId),
        prisma.prize_wheel_credits.findMany({
          where: { store_id: storeId, ...(sellerId ? { seller_id: sellerId } : {}) },
          select: { seller_id: true, credits: true },
        }),
        prisma.sellers.findMany({
          where: { store_id: storeId, ...(sellerId ? { id: sellerId } : {}) },
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        }),
        prisma.prize_wheel_spins.findMany({
          where: filteredWhere,
          orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
          take: limit,
          skip: offset,
          select: SPIN_SELECT,
        }),
        prisma.prize_wheel_spins.count({ where: filteredWhere }),
        prisma.prize_wheel_spins.groupBy({ by: ['segment_id'], where: storeWhere, _count: { _all: true } }),
        prisma.prize_wheel_spins.groupBy({ by: ['segment_id'], where: filteredWhere, _count: { _all: true } }),
        prisma.prize_wheel_spins.groupBy({
          by: ['seller_id'],
          where: { ...storeWhere, ...(sellerId ? { seller_id: sellerId } : {}) },
          _count: { _all: true },
          _max: { created_at: true },
        }),
      ]);

    const segmentById = new Map(segments.map((s) => [s.id, s]));
    const sellerNameById = new Map(sellers.map((s) => [s.id, s.name]));
    const creditsMap: Record<string, number> = Object.fromEntries(creditRows.map((c) => [c.seller_id, c.credits]));

    const sumStats = (groups: { segment_id: string; _count: { _all: number } }[]) => {
      let totalSpins = 0;
      let totalValue = 0;
      for (const g of groups) {
        totalSpins += g._count._all;
        const seg = segmentById.get(g.segment_id);
        if (seg && seg.type === 'money' && seg.value != null) totalValue += Number(seg.value) * g._count._all;
      }
      return { totalSpins, totalValue: Math.round(totalValue * 100) / 100 };
    };

    const sellerStats = new Map(bySeller.map((g) => [g.seller_id, { spins: g._count._all, lastSpinAt: g._max.created_at }]));

    return jsonOk({
      creditsMap,
      credits: sellerId ? creditsMap[sellerId] ?? 0 : undefined,
      segments: buildWheelSnapshot(segments).map(({ weight: _w, ...slice }) => slice),
      sellers: sellers.map((s) => ({
        id: s.id,
        name: s.name,
        credits: creditsMap[s.id] ?? 0,
        spins: sellerStats.get(s.id)?.spins ?? 0,
        lastSpinAt: sellerStats.get(s.id)?.lastSpinAt ?? null,
      })),
      spins: spins.map((spin) => {
        const seg = segmentById.get(spin.segment_id);
        return {
          ...spin,
          createdAt: spin.created_at,
          sellerName: sellerNameById.get(spin.seller_id) ?? null,
          segment: seg
            ? {
                id: seg.id,
                label: seg.label,
                type: seg.type,
                value: seg.value,
                color: normalizeColor(seg.color),
                archived: seg.is_active === false,
              }
            : null,
        };
      }),
      stats: sumStats(storeBySegment),
      filteredStats: sumStats(filteredBySegment),
      pagination: { total: filteredTotal, limit, offset },
    });
  } catch (error) {
    console.error('[GET /api/wheel/status]', { storeId, error });
    return jsonError(500, 'Erro interno do servidor ao buscar status da roleta.');
  }
}
