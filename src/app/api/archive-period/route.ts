import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { z } from "zod";
import { incentiveProjection, IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";
import { Goals, Seller } from "@/lib/storage";

const archivePeriodSchema = z.object({
  storeId: z.string().uuid(),
  periodName: z.string().min(1, "O nome do período é obrigatório."),
});

// Helper to calculate the total prize from the incentive projection output
function calculateTotalPrize(incentives: IncentiveProjectionOutput | null): number {
  if (!incentives) return 0;
  return Object.values(incentives).reduce((sum, value) => sum + (value || 0), 0);
}

// Helper to parse values that might be strings or numbers
const parseForAI = (value: any): number => {
    if (typeof value === 'string') {
        const parsedValue = parseFloat(value.replace(',', '.'));
        return isNaN(parsedValue) ? 0 : parsedValue;
    }
    return Number(value) || 0;
};

// Helper to parse goals for the AI flow
const parseGoalsForAI = (rawGoals: any): Goals => {
    const parsed: any = {};
    for (const key in rawGoals) {
        if (key === 'performanceBonusEnabled' || key === 'corridinhaEnabled') {
            parsed[key] = !!rawGoals[key];
        } else {
            parsed[key] = parseForAI(rawGoals[key]);
        }
    }
    return parsed as Goals;
};


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = archivePeriodSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { storeId, periodName } = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const sellers = await tx.sellers.findMany({
        where: { store_id: storeId },
      });

      const goalsData = await tx.goals.findUnique({
        where: { store_id: storeId },
      });

      if (!goalsData) {
        throw new Error("Metas não encontradas para esta loja.");
      }
      
      const goals = parseGoalsForAI(goalsData);
      
      const historyData = [];

      for (const seller of sellers) {
        // Calculate incentives for this seller
        const sellerForAI = {
            id: seller.id,
            name: seller.name,
            avatarId: String(seller.avatar_id || 'avatar1'),
            password: String(seller.password || 'password'),
            vendas: parseForAI(seller.vendas),
            pa: parseForAI(seller.pa),
            ticketMedio: parseForAI(seller.ticket_medio),
            corridinhaDiaria: parseForAI(seller.corridinha_diaria),
        };
        
        const incentives = await incentiveProjection({ seller: sellerForAI, goals });
        const totalPrize = calculateTotalPrize(incentives);

        historyData.push({
          period: periodName,
          vendas: seller.vendas ?? 0,
          pa: seller.pa ?? 0,
          ticket_medio: seller.ticket_medio ?? 0,
          total_prize: totalPrize,
          seller_id: seller.id,
          seller_name: seller.name,
          store_id: storeId,
        });
      }

      // 1. Save the historical data
      await tx.SellerHistory.createMany({
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
