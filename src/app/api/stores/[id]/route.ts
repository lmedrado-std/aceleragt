
import { prisma } from '@/lib/db';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const storeId = parseInt(context.params.id, 10);
  if (isNaN(storeId)) {
    return NextResponse.json({ error: 'ID da loja inválido' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const includePassword = searchParams.get('includePassword') === 'true';

  try {
    const store = await prisma.stores.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        theme_color: true,
        last_incentive_calculation: true,
        password: includePassword,
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }
    return NextResponse.json(store);
  } catch (error) {
    console.error(`[API GET /api/stores/${storeId}] ERRO:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const storeId = parseInt(context.params.id, 10);
  if (isNaN(storeId)) {
    return NextResponse.json({ error: 'ID da loja inválido' }, { status: 400 });
  }

  try {
    const body = await request.json();

    const updatedStore = await prisma.stores.update({
      where: { id: storeId },
      data: body,
    });

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error(`[API PUT /api/stores/${storeId}] ERRO:`, error);
    const typedError = error as any;
    if (typedError.code === 'P2025') {
      return NextResponse.json({ error: 'Loja não encontrada para atualizar' }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const storeId = parseInt(context.params.id, 10);
  if (isNaN(storeId)) {
    return NextResponse.json({ error: 'ID da loja inválido' }, { status: 400 });
  }

  try {
    // Use a transaction to ensure all related data is deleted atomically.
    const [deletedGoals, deletedSellers, deletedStore] = await prisma.$transaction([
      prisma.goals.deleteMany({ where: { store_id: storeId } }),
      prisma.sellers.deleteMany({ where: { store_id: storeId } }),
      prisma.stores.delete({ where: { id: storeId } }),
    ]);

    // Check if the store was actually deleted.
    if (deletedStore.count === 0) {
      return NextResponse.json({ error: 'Loja não encontrada para deletar' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Loja e todos os seus dados foram removidos com sucesso' });
  } catch (error) {
    console.error(`[API DELETE /api/stores/${storeId}] ERRO:`, error);
    // Handle cases where the transaction fails.
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
