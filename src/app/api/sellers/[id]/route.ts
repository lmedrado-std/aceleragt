
import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const sellerId = parseInt(context.params.id, 10);
  if (isNaN(sellerId)) {
    return NextResponse.json({ error: 'ID do vendedor inválido' }, { status: 400 });
  }

  try {
    const seller = await prisma.sellers.findUnique({
      where: { id: sellerId },
    });

    if (!seller) {
      return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 });
    }
    return NextResponse.json(seller);
  } catch (error) {
    console.error(`[API GET /api/sellers/${sellerId}] ERRO:`, error);
    const typedError = error as any;
    return NextResponse.json(
      {
        error: 'Erro interno do servidor ao buscar vendedor.',
        details: typedError.message,
        code: typedError.code,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  const sellerId = parseInt(context.params.id, 10);
  if (isNaN(sellerId)) {
    return NextResponse.json({ error: 'ID do vendedor inválido' }, { status: 400 });
  }

  try {
    const body = await request.json();

    const seller = await prisma.sellers.update({
      where: { id: sellerId },
      data: body,
    });

    return NextResponse.json(seller);
  } catch (error) {
    console.error(`[API PUT /api/sellers/${sellerId}] ERRO:`, error);
    const typedError = error as any;
    // Prisma's P2025 is the error code for a record not found on update/delete
    if (typedError.code === 'P2025') {
      return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 });
    }
    return NextResponse.json(
      {
        error: 'Erro interno do servidor ao atualizar vendedor.',
        details: typedError.message,
        code: typedError.code,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const sellerId = parseInt(context.params.id, 10);
  if (isNaN(sellerId)) {
    return NextResponse.json({ error: 'ID do vendedor inválido' }, { status: 400 });
  }

  try {
    await prisma.sellers.delete({
      where: { id: sellerId },
    });

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error(`[API DELETE /api/sellers/${sellerId}] ERRO:`, error);
    const typedError = error as any;
    // Prisma's P2025 is the error code for a record not found on update/delete
    if (typedError.code === 'P2025') {
      return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
