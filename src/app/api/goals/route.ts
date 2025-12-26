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

export async function POST(request: Request) {
  try {
    const { store_id, goals } = await request.json();

    if (!store_id || !goals) {
      return NextResponse.json({ error: 'store_id e metas são obrigatórios' }, { status: 400 });
    }

    // Remove properties that shouldn't be updated directly and sanitize data
    const { id, store_id: nested_store_id, ...goalData } = goals;
    
    // Sanitize dates: empty strings should be null
    if (goalData.corridinhaStartDate === "") {
        goalData.corridinhaStartDate = null;
    }
    if (goalData.corridinhaEndDate === "") {
        goalData.corridinhaEndDate = null;
    }
    
    // Sanitize objectives: empty strings should be null
    if (goalData.corridinhaObjective1 === "") goalData.corridinhaObjective1 = null;
    if (goalData.corridinhaObjective2 === "") goalData.corridinhaObjective2 = null;
    if (goalData.corridinhaObjective3 === "") goalData.corridinhaObjective3 = null;
    if (goalData.corridinhaObjective4 === "") goalData.corridinhaObjective4 = null;

    // Sanitize prizes: ensure they are numbers or null
    goalData.corridinhaPrize1 = goalData.corridinhaPrize1 ? Number(goalData.corridinhaPrize1) : 0;
    goalData.corridinhaPrize2 = goalData.corridinhaPrize2 ? Number(goalData.corridinhaPrize2) : 0;
    goalData.corridinhaPrize3 = goalData.corridinhaPrize3 ? Number(goalData.corridinhaPrize3) : 0;
    goalData.corridinhaPrize4 = goalData.corridinhaPrize4 ? Number(goalData.corridinhaPrize4) : 0;


    const upsertedGoal = await prisma.goals.upsert({
      where: { store_id: store_id },
      update: goalData,
      create: {
        store_id: store_id,
        ...goalData,
      },
    });

    return NextResponse.json(upsertedGoal);
  } catch (error) {
    console.error('[API POST /api/goals] ERRO:', error);
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
