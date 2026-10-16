import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  buildWheelSnapshot,
  isSegmentActive,
  normalizeColor,
  normalizeWeight,
  type SegmentRecord,
} from '@/lib/wheel/engine';
import { formatZodIssues, idSchema, settingsRequestSchema } from '@/lib/wheel/validation';
import { jsonError, jsonOk, loadStoreSegments, readJson, SEGMENT_SELECT } from '@/lib/wheel/server';

export const dynamic = 'force-dynamic';

const toPublicSegment = (s: SegmentRecord) => ({
  id: s.id,
  label: s.label,
  type: s.type,
  value: s.value,
  description: s.description ?? null,
  color: normalizeColor(s.color),
  weight: normalizeWeight(s.weight),
  position: s.position,
  is_active: isSegmentActive(s),
});

function buildResponse(all: SegmentRecord[], includeArchived: boolean) {
  const active = all.filter(isSegmentActive);
  const wheel = buildWheelSnapshot(all);
  return {
    configured: wheel.length > 0,
    // Prêmios ativos (o editor do gestor usa esta lista; pesos nulos aparecem como 10).
    segments: active.map(toPublicSegment),
    // Exatamente as fatias desenhadas na roda e sorteáveis (ativas e com peso > 0).
    wheel: wheel.map(({ weight: _w, ...slice }) => slice),
    ...(includeArchived ? { archived: all.filter((s) => !isSegmentActive(s)).map(toPublicSegment) } : {}),
  };
}

// GET /api/wheel/settings?storeId=...[&include=archived]
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeIdParsed = idSchema.safeParse(searchParams.get('storeId'));
  if (!storeIdParsed.success) return jsonError(400, 'storeId inválido.');

  try {
    const all = await loadStoreSegments(prisma, storeIdParsed.data);
    return jsonOk(buildResponse(all, searchParams.get('include') === 'archived'));
  } catch (error) {
    console.error('[GET /api/wheel/settings]', error);
    return jsonError(500, 'Erro interno ao carregar configurações da roleta.');
  }
}

/**
 * POST /api/wheel/settings
 * Corpo: { storeId, segments: [...] } — `segments` é a lista COMPLETA de prêmios ativos, na ordem da roda.
 * - prêmio existente (id da própria loja) é atualizado;
 * - prêmio sem id (ou com id desconhecido) é criado;
 * - prêmio ativo que não veio na lista é ARQUIVADO (is_active = false). Nada é excluído,
 *   então o histórico de giros e os prêmios antigos ficam preservados;
 * - prêmio arquivado que volta na lista é restaurado.
 */
export async function POST(req: NextRequest) {
  const parsed = settingsRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    const details = formatZodIssues(parsed.error);
    return jsonError(400, details[0] ?? 'Configuração inválida.', { details });
  }
  const { storeId, segments } = parsed.data;

  try {
    const store = await prisma.stores.findUnique({ where: { id: storeId }, select: { id: true } });
    if (!store) return jsonError(404, 'Loja não encontrada.');

    const all = await prisma.$transaction(
      async (tx) => {
        const settings = await tx.prize_wheel_settings.upsert({
          where: { store_id: storeId },
          create: { store_id: storeId },
          update: { updated_at: new Date() },
          select: { id: true },
        });

        const existing = await tx.prize_wheel_segments.findMany({
          where: { settings_id: settings.id },
          select: { id: true, is_active: true },
        });
        const existingIds = new Set(existing.map((s) => s.id));
        const keptIds = new Set<string>();

        for (let position = 0; position < segments.length; position++) {
          const s = segments[position];
          const data = {
            label: s.label,
            type: s.type,
            value: s.type === 'money' && s.value != null ? new Prisma.Decimal(s.value) : null,
            description: s.description ? s.description : null,
            color: normalizeColor(s.color),
            weight: s.weight,
            position,
            is_active: true,
          };
          if (s.id && existingIds.has(s.id)) {
            keptIds.add(s.id);
            await tx.prize_wheel_segments.update({ where: { id: s.id }, data, select: { id: true } });
          } else {
            await tx.prize_wheel_segments.create({ data: { ...data, settings_id: settings.id }, select: { id: true } });
          }
        }

        const toArchive = existing.filter((s) => !keptIds.has(s.id) && s.is_active !== false).map((s) => s.id);
        if (toArchive.length > 0) {
          await tx.prize_wheel_segments.updateMany({
            where: { id: { in: toArchive }, settings_id: settings.id },
            data: { is_active: false },
          });
        }

        const rows = await tx.prize_wheel_segments.findMany({
          where: { settings_id: settings.id },
          orderBy: [{ position: 'asc' }, { id: 'asc' }],
          select: SEGMENT_SELECT,
        });
        return rows;
      },
      { maxWait: 5000, timeout: 15000 },
    );

    return jsonOk(
      buildResponse(
        all.map((r) => ({ ...r, value: r.value === null ? null : Number(r.value) })),
        true,
      ),
    );
  } catch (error) {
    console.error('[POST /api/wheel/settings]', error);
    return jsonError(500, 'Erro interno ao salvar configurações da roleta.');
  }
}
