
import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json({ error: 'O ID da loja é obrigatório' }, { status: 400 });
  }

  try {
    const sellers = await prisma.sellers.findMany({
      where: { store_id: storeId },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(sellers);
  } catch (error) {
    console.error('[API GET /api/sellers] ERRO:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, password, avatar_id, store_id } = await request.json();

    if (!name || !store_id) {
      return NextResponse.json({ error: 'Nome e ID da loja são obrigatórios' }, { status: 400 });
    }

    const newSeller = await prisma.sellers.create({
      data: {
        name,
        password,
        avatar_id,
        store_id,
      },
    });

    return NextResponse.json(newSeller, { status: 201 });
  } catch (error) {
    console.error('[API POST /api/sellers] ERRO:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
