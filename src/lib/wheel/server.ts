import { NextResponse } from 'next/server';
import type { Prisma, PrismaClient } from '@prisma/client';
import type { SegmentRecord } from './engine';

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Janela anti-repetição: com a linha de saldo já travada, um segundo giro do mesmo
 * vendedor dentro desta janela é recusado e a transação inteira é desfeita
 * (o crédito volta). Clique duplo e reenvio chegam com milissegundos de diferença;
 * um giro legítimo nunca cai aqui, porque a animação dura 12 s (3 s com movimento reduzido).
 */
export const SPIN_COOLDOWN_MS = 2500;

/**
 * Colunas usadas pela roleta. As consultas sempre usam `select` explícito para
 * depender apenas das colunas que existem tanto no schema.prisma quanto no banco
 * criado pelo antigo /api/setup-db (ex.: não dependemos de `notes`/`paid_at`).
 */
export const SEGMENT_SELECT = {
  id: true,
  label: true,
  type: true,
  value: true,
  description: true,
  color: true,
  weight: true,
  position: true,
  is_active: true,
} as const;

export const SPIN_SELECT = {
  id: true,
  store_id: true,
  seller_id: true,
  segment_id: true,
  status: true,
  created_at: true,
  claimed_at: true,
} as const;

type RawSegment = {
  id: string;
  label: string;
  type: string;
  value: Prisma.Decimal | number | null;
  description: string | null;
  color: string | null;
  weight: number | null;
  position: number;
  is_active: boolean | null;
};

export function toSegmentRecord(s: RawSegment): SegmentRecord {
  return {
    id: s.id,
    label: s.label,
    type: s.type,
    value: s.value === null || s.value === undefined ? null : Number(s.value),
    description: s.description,
    color: s.color,
    weight: s.weight,
    position: s.position,
    is_active: s.is_active,
  };
}

/** Configuração da loja (só o id) — não depende da coluna `is_active` de prize_wheel_settings. */
export async function findSettingsId(db: Db, storeId: string): Promise<string | null> {
  const settings = await db.prize_wheel_settings.findFirst({
    where: { store_id: storeId },
    select: { id: true },
  });
  return settings?.id ?? null;
}

/** Todas as fatias da loja (ativas e arquivadas), em ordem de posição. */
export async function loadStoreSegments(db: Db, storeId: string): Promise<SegmentRecord[]> {
  const settingsId = await findSettingsId(db, storeId);
  if (!settingsId) return [];
  const rows = await db.prize_wheel_segments.findMany({
    where: { settings_id: settingsId },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    select: SEGMENT_SELECT,
  });
  return rows.map(toSegmentRecord);
}

export function jsonError(status: number, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function jsonOk(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
