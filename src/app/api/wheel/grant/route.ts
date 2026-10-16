import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { formatZodIssues, grantRequestSchema } from '@/lib/wheel/validation';
import { jsonError, jsonOk, readJson } from '@/lib/wheel/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/wheel/grant — { storeId, sellerId, credits }
 * - `credits` precisa ser inteiro de 1 a 50 (antes aceitava negativo, decimal e texto);
 * - o vendedor precisa existir e pertencer à loja;
 * - o incremento é atômico no banco (upsert + increment).
 * O campo `grantedBy` enviado pelo navegador é ignorado: a identificação real do gestor
 * depende da etapa de autenticação, fora do escopo desta tarefa.
 */
export async function POST(req: NextRequest) {
  const body = (await readJson(req)) as Record<string, unknown> | null;
  const parsed = grantRequestSchema.safeParse({
    storeId: body?.storeId,
    sellerId: body?.sellerId,
    credits: typeof body?.credits === 'string' && body.credits.trim() !== '' ? Number(body.credits) : body?.credits,
  });
  if (!parsed.success) {
    const details = formatZodIssues(parsed.error);
    return jsonError(400, details[0] ?? 'Dados inválidos.', { details });
  }
  const { storeId, sellerId, credits } = parsed.data;

  try {
    const seller = await prisma.sellers.findFirst({
      where: { id: sellerId, store_id: storeId },
      select: { id: true, name: true },
    });
    if (!seller) return jsonError(404, 'Vendedor não encontrado nesta loja.');

    const upsert = () =>
      prisma.prize_wheel_credits.upsert({
        where: { store_id_seller_id: { store_id: storeId, seller_id: sellerId } },
        create: { store_id: storeId, seller_id: sellerId, credits },
        update: { credits: { increment: credits } },
        select: { credits: true },
      });
    let record;
    try {
      record = await upsert();
    } catch (error) {
      // Duas concessões simultâneas para um vendedor sem saldo: a segunda colide no
      // índice único ao criar a linha. Repetir cai no ramo de incremento.
      if ((error as { code?: string })?.code !== 'P2002') throw error;
      record = await upsert();
    }

    return jsonOk({
      message: `${credits} giro(s) concedido(s) para ${seller.name}.`,
      sellerId,
      totalCredits: record.credits,
    });
  } catch (error) {
    console.error('[POST /api/wheel/grant]', error);
    return jsonError(500, 'Erro ao conceder giros.');
  }
}
