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
    await prisma.sellers.update({
      where: { id: sellerId },
      data: {
        last_viewed_at: new Date(),  // usa snake_case como no schema
        view_count: {
          increment: 1,
        },
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
