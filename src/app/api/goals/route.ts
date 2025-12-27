

import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const storeId = request.nextUrl.searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json({ error: 'O ID da loja é obrigatório' }, { status: 400 });
  }

  try {
    const goals = await prisma.goals.findUnique({
      where: { store_id: storeId },
    });

    if (!goals) {
      const store = await prisma.stores.findUnique({
        where: { id: storeId },
      });

      if (store) {
        return NextResponse.json({}); // Store exists, but no goals
      }
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    return NextResponse.json(goals);
  } catch (error) {
    console.error('[API GET /api/goals] ERRO:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log("[API POST /api/goals] ===== INICIANDO =====");
  console.log("[API POST /api/goals] timestamp:", new Date().toISOString());
  try {
    const { store_id, goals } = await request.json();
    console.log("Body recebido em /api/goals:", { store_id, goals });

    if (!store_id || !goals) {
      return NextResponse.json({ error: 'store_id e metas são obrigatórios' }, { status: 400 });
    }

    // tira id/store_id internos
    const { id, store_id: nested_store_id, ...goalData } = goals;
    
    // Whitelist de campos que existem no schema do Prisma
    const prismaGoalFields = [
      "metaMinha", "metaMinhaPrize", "meta", "metaPrize", "metona", "metonaPrize",
      "metaLendaria", "legendariaBonusValorVenda", "legendariaBonusValorPremio",
      "performanceBonusEnabled", "paGoal1", "paPrize1", "paGoal2", "paPrize2",
      "paGoal3", "paPrize3", "paGoal4", "paPrize4", "ticketMedioGoal1",
      "ticketMedioPrize1", "ticketMedioGoal2", "ticketMedioPrize2", "ticketMedioGoal3",
      "ticketMedioPrize3", "ticketMedioGoal4", "ticketMedioPrize4",
      "metaHoje", "paMetaHoje",
      "corridinhaEnabled", "corridinhaenabled"
    ] as const;

    const prismaGoalData: any = {};
    for (const key of prismaGoalFields) {
      if (key in goalData && goalData[key] !== undefined) {
          prismaGoalData[key] = goalData[key];
      }
    }
    
    const upsertedGoal = await prisma.goals.upsert({
      where: { store_id: store_id },
      update: prismaGoalData,
      create: {
        store_id: store_id,
        ...prismaGoalData,
      },
    });

    return NextResponse.json(upsertedGoal);
  } catch (error) {
    console.error("[API POST /api/goals] ERRO:", error);
    const typedError = error as any;
    return NextResponse.json(
      {
        error: 'Erro interno do servidor ao salvar metas.',
        details: typedError.message,
        code: typedError.code,
      },
      { status: 500 }
    );
  }
}

