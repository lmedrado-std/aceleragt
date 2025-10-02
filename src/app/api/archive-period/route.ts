import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/db";
import { z } from "zod";

const archivePeriodSchema = z.object({
  storeId: z.string().uuid(),
  periodName: z.string().min(1, "O nome do período é obrigatório."),
});

// Função simples para calcular prêmios (substitui a calculatePrizes que não existe)
function calculateSimplePrizes(sellers: any[], goals: any) {
  return {
    results: sellers.map((seller) => ({
      sellerId: seller.id,
      totalPrize: 0, // Por enquanto, sem prêmios até implementar a lógica real
    })),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = archivePeriodSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { storeId, periodName } = parsed.data;

    // Start a transaction to ensure all or nothing is done
    const result = await prisma.$transaction(async (tx) => {
      const sellers = await tx.sellers.findMany({
        where: { store_id: storeId },
      });

      const goals = await tx.goals.findUnique({
        where: { store_id: storeId },
      });

      if (!goals) {
        throw new Error("Metas não encontradas para esta loja.");
      }

      const { results: prizeResults } = calculateSimplePrizes(sellers, goals);

      const historyData = sellers.map((seller) => {
        const prizeInfo = prizeResults.find((p) => p.sellerId === seller.id);
        return {
          period: periodName,
          vendas: seller.vendas ?? 0,
          pa: seller.pa ?? 0,
          ticket_medio: seller.ticket_medio ?? 0,
          total_prize: prizeInfo?.totalPrize ?? 0,
          seller_id: seller.id,
          seller_name: seller.name,
          store_id: storeId,
        };
      });

      // 1. Save the historical data
      await tx.sellerHistory.createMany({
        data: historyData,
      });

      // 2. Reset the sellers' performance metrics
      await tx.sellers.updateMany({
        where: { store_id: storeId },
        data: {
          vendas: 0,
          pa: 0,
          ticket_medio: 0,
          corridinha_diaria: 0,
        },
      });

      return { message: `Período '${periodName}' arquivado com sucesso para ${sellers.length} vendedores.` };
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("Erro ao arquivar período:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
