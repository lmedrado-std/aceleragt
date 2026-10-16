import { NextRequest } from 'next/server';
import { randomInt } from 'crypto';
import { prisma } from '@/lib/db';
import { buildWheelSnapshot, pickWeightedIndex, stopAngleDeg, MAX_STOP_JITTER } from '@/lib/wheel/engine';
import { spinRequestSchema } from '@/lib/wheel/validation';
import { jsonError, jsonOk, loadStoreSegments, readJson, SPIN_SELECT } from '@/lib/wheel/server';

export const dynamic = 'force-dynamic';

/**
 * Janela anti-repetição: com a linha de saldo já travada, um segundo giro do mesmo
 * vendedor dentro desta janela é recusado e a transação inteira é desfeita
 * (o crédito volta). A animação dura ~9 s, então um giro legítimo nunca cai aqui.
 */
export const SPIN_COOLDOWN_MS = 4000;

class SpinError extends Error {
  constructor(public code: 'NO_CREDITS' | 'TOO_SOON' | 'NOT_CONFIGURED') {
    super(code);
  }
}

// Resolução de 1e6 para o deslocamento do ponto de parada dentro da fatia.
const jitterFromCrypto = () => (randomInt(0, 1_000_001) / 1_000_000) * 2 * MAX_STOP_JITTER - MAX_STOP_JITTER;

/**
 * POST /api/wheel/spin
 * Débito do crédito, sorteio e registro acontecem na MESMA transação:
 *  1. lê as fatias ativas (snapshot) — o sorteio usa exatamente o que será desenhado;
 *  2. debita 1 crédito de forma atômica (`credits > 0`), o que trava a linha do saldo;
 *  3. recusa repetição dentro de SPIN_COOLDOWN_MS (proteção contra clique duplo / reenvio);
 *  4. sorteia com crypto.randomInt e grava o giro.
 * Qualquer falha desfaz tudo: não existe giro sem débito nem débito sem giro.
 */
export async function POST(req: NextRequest) {
  const parsed = spinRequestSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(400, 'Identificação da loja ou vendedor inválida.');
  const { storeId, sellerId } = parsed.data;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const snapshot = buildWheelSnapshot(await loadStoreSegments(tx, storeId));
        if (snapshot.length === 0) throw new SpinError('NOT_CONFIGURED');

        const debit = await tx.prize_wheel_credits.updateMany({
          where: { store_id: storeId, seller_id: sellerId, credits: { gt: 0 } },
          data: { credits: { decrement: 1 } },
        });
        if (debit.count === 0) throw new SpinError('NO_CREDITS');

        const now = new Date();
        const recent = await tx.prize_wheel_spins.findFirst({
          where: {
            store_id: storeId,
            seller_id: sellerId,
            created_at: { gte: new Date(now.getTime() - SPIN_COOLDOWN_MS) },
          },
          select: { id: true },
        });
        if (recent) throw new SpinError('TOO_SOON');

        const selectedIndex = pickWeightedIndex(
          snapshot.map((s) => s.weight),
          (max) => randomInt(0, max),
        );
        const winner = snapshot[selectedIndex];

        const spin = await tx.prize_wheel_spins.create({
          data: {
            store_id: storeId,
            seller_id: sellerId,
            granted_by: 'system',
            segment_id: winner.id,
            status: 'claimed',
            created_at: now,
            claimed_at: now,
          },
          select: SPIN_SELECT,
        });

        const balance = await tx.prize_wheel_credits.findUnique({
          where: { store_id_seller_id: { store_id: storeId, seller_id: sellerId } },
          select: { credits: true },
        });

        return { spin, snapshot, selectedIndex, winner, remainingCredits: balance?.credits ?? 0 };
      },
      { maxWait: 5000, timeout: 10000 },
    );

    const { spin, snapshot, selectedIndex, winner, remainingCredits } = result;
    return jsonOk({
      message: 'Roleta girada com sucesso!',
      spinId: spin.id,
      createdAt: spin.created_at,
      remainingCredits,
      prize: {
        id: winner.id,
        label: winner.label,
        type: winner.type,
        value: winner.value,
        description: winner.description,
        color: winner.color,
      },
      // A roda é redesenhada com este snapshot antes de girar, então o ponteiro
      // sempre para na fatia que foi efetivamente gravada.
      wheelSnapshot: snapshot.map(({ weight: _w, ...slice }) => slice),
      selectedIndex,
      stopAngleDeg: stopAngleDeg(snapshot.length, selectedIndex, jitterFromCrypto()),
    });
  } catch (error) {
    if (error instanceof SpinError) {
      if (error.code === 'NO_CREDITS') return jsonError(409, 'Você não possui giros disponíveis.', { noCredits: true, remainingCredits: 0 });
      if (error.code === 'TOO_SOON') return jsonError(429, 'Aguarde o giro anterior terminar.', { tooSoon: true });
      return jsonError(409, 'Roleta não configurada ou sem prêmios ativos.', { notConfigured: true });
    }
    console.error('[POST /api/wheel/spin]', error);
    return jsonError(500, 'Erro ao processar o giro da roleta. Nenhum crédito foi descontado.');
  }
}
