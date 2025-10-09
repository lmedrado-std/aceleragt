
import { prisma } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/sellers/[id]
export async function GET(request: NextRequest, context: any) {
  const { id: sellerId } = await context.params; // ✅ CORRIGIDO

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


export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params; // ✅ CORRIGIDO
  try {
    const body = await request.json();
    // Assuming body can contain any of these fields for update
    const { name, password, vendas, pa, ticketMedio, corridinhaDiaria, ticket_medio, corridinha_diaria } = body;

    const dataToUpdate: { [key: string]: any } = {};

    if (name !== undefined) dataToUpdate.name = name;
    if (password !== undefined) dataToUpdate.password = password;
    if (vendas !== undefined) dataToUpdate.vendas = vendas;
    if (pa !== undefined) dataToUpdate.pa = pa;
    if (ticketMedio !== undefined) dataToUpdate.ticket_medio = ticketMedio;
    if (ticket_medio !== undefined) dataToUpdate.ticket_medio = ticket_medio; // Accept snake_case
    if (corridinhaDiaria !== undefined) dataToUpdate.corridinha_diaria = corridinhaDiaria;
    if (corridinha_diaria !== undefined) dataToUpdate.corridinha_diaria = corridinha_diaria; // Accept snake_case

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ info: 'Nenhum campo para atualizar.' }, { status: 200 });
    }

    const seller = await prisma.sellers.update({
      where: { id: id },
      data: dataToUpdate,
    });

    return NextResponse.json(seller, { status: 200 });

  } catch (error) {
    console.error(`[API /api/sellers/[id]] ERRO no PUT (id: ${id}):`, error);
    const typedError = error as any;
    if (typedError.code === 'P2025') { // Prisma's error code for record not found
        return NextResponse.json({ error: 'Vendedor não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar vendedor.', details: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const { id } = await context.params; // ✅ CORRIGIDO
  try {
    await prisma.sellers.delete({
      where: { id: id },
    });

    // DELETE should return 204 No Content on success
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error(`[API /api/sellers/[id]] ERRO no DELETE (id: ${id}):`, error);
    const typedError = error as any;
    if (typedError.code === 'P2025') { // Prisma's error code for record not found
        return NextResponse.json({ error: 'Vendedor não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao remover vendedor.', details: (error as Error).message }, { status: 500 });
  }
}
