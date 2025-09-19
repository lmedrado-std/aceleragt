
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { Goals } from '@/lib/storage'; // Assuming this type is still relevant or can be adapted

// These are the default goals for a new store.
const defaultGoals: Omit<Goals, 'store_id' | 'id'> = {
  metaMinha: 8000,
  metaMinhaPrize: 50,
  meta: 9000,
  metaPrize: 100,
  metona: 10000,
  metonaPrize: 120,
  metaLendaria: 12000,
  legendariaBonusValorVenda: 2000,
  legendariaBonusValorPremio: 50,
  paGoal1: 1.5,
  paPrize1: 5,
  paGoal2: 1.6,
  paPrize2: 10,
  paGoal3: 1.9,
  paPrize3: 15,
  paGoal4: 2.0,
  paPrize4: 20,
  ticketMedioGoal1: 180,
  ticketMedioPrize1: 5,
  ticketMedioGoal2: 185,
  ticketMedioPrize2: 10,
  ticketMedioGoal3: 190,
  ticketMedioPrize3: 15,
  ticketMedioGoal4: 200,
  ticketMedioPrize4: 20,
};

export async function GET() {
  try {
    const stores = await prisma.stores.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, theme_color: true },
    });
    return NextResponse.json(stores);
  } catch (error) {
    console.error('[API /api/stores] GET: ERRO ao buscar lojas:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, themeColor } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'O nome da loja é obrigatório' }, { status: 400 });
    }

    // Use a transaction to create the store and its default goals atomically.
    const newStore = await prisma.$transaction(async (tx) => {
      const createdStore = await tx.stores.create({
        data: {
          name,
          theme_color: themeColor || null,
        },
        select: { id: true, name: true, theme_color: true }, // Select only the necessary fields
      });

      await tx.goals.create({
        data: {
          store_id: createdStore.id,
          ...defaultGoals,
        },
      });

      return createdStore;
    });

    return NextResponse.json(newStore, { status: 201 });
  } catch (error) {
    console.error('[API /api/stores] POST: ERRO ao criar loja:', error);
    const typedError = error as any;
    return NextResponse.json(
      {
        error: 'Erro interno do servidor ao criar loja',
        details: typedError.message,
        code: typedError.code,
      },
      { status: 500 }
    );
  }
}
