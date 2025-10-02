import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminGlobal } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const storeId = searchParams.get('storeId');
  const period = searchParams.get('period');

  if (!isAdminGlobal() && !storeId) {
    return NextResponse.json({ error: 'storeId é obrigatório' }, { status: 400 });
  }

  // Listagem de períodos
  if (!period) {
    try {
      const grouped = await prisma.sellerHistory.groupBy({
        by: ['period', 'store_id'],
        where: { store_id: storeId },
        _count: { seller_id: true },
        orderBy: { period: 'desc' },
      });
      const formatted = grouped.map(g => ({
        period: g.period,
        storeId: g.store_id,
        sellerCount: g._count.seller_id,
      }));
      return NextResponse.json(formatted);
    } catch (error) {
      console.error('[API GET /api/history] ERRO listagem:', error);
      return NextResponse.json({ error: 'Erro ao listar períodos' }, { status: 500 });
    }
  }

  // Detalhes de um período
  try {
    // obter lista ordenada de períodos
    const distinct = await prisma.sellerHistory.findMany({
      where: { store_id: storeId },
      distinct: ['period'],
      orderBy: { createdAt: 'asc' }, // Use o campo correto do schema
      select: { period: true },
    });
    const names = distinct.map(d => d.period);
    const idx = names.indexOf(period);
    const prev = idx > 0 ? names[idx - 1] : null;

    const current = await prisma.sellerHistory.findMany({
      where: { store_id: storeId, period },
      orderBy: { seller_name: 'asc' },
    });

    const previous = prev
      ? await prisma.sellerHistory.findMany({
          where: { store_id: storeId, period: prev },
          orderBy: { seller_name: 'asc' },
        })
      : [];

    return NextResponse.json({ current, previous });
  } catch (error) {
    console.error('[API GET /api/history] ERRO detalhes:', error);
    return NextResponse.json({ error: 'Falha ao buscar detalhes' }, { status: 500 });
  }
}