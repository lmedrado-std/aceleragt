
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { URL } from 'url';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get('storeId');

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

    // Remove properties that shouldn't be updated directly
    const { id, store_id: nested_store_id, ...goalData } = goals;

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
