import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sellerId = params.id;

  if (!sellerId) {
    return NextResponse.json(
      { error: 'ID do vendedor é obrigatório' },
      { status: 400 }
    );
  }

  try {
    // 1. Buscar o vendedor para obter o valor atual de view_count
    const seller = await prisma.sellers.findUnique({
      where: { id: sellerId },
      select: { view_count: true },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 });
    }

    // 2. Incrementar o valor no código
    const newViewCount = (seller.view_count || 0) + 1;

    // 3. Atualizar o vendedor com o novo valor
    await prisma.sellers.update({
      where: { id: sellerId },
      data: {
        last_viewed_at: new Date(),
        view_count: newViewCount,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[API /api/sellers/${sellerId}/track-view] ERRO:`, error);
    return NextResponse.json(
      { error: 'Erro ao registrar visualização' },
      { status: 500 }
    );
  }
}
