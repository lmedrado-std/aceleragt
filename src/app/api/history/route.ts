import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const period = searchParams.get('period');
  const storeId = searchParams.get('storeId');

  // Validação dos parâmetros
  if (!storeId) {
    return NextResponse.json({ error: 'storeId é obrigatório' }, { status: 400 });
  }

  // Modo 1: listar períodos disponíveis
  if (!period) {
    try {
      const periods = await prisma.SellerHistory.groupBy({
        by: ['period', 'store_id'],
        where: { store_id: storeId },
        _count: { seller_id: true },
        orderBy: { period: 'desc' },
      });
      const formatted = periods.map(p => ({
        period: p.period,
        storeId: p.store_id,
        sellerCount: p._count.seller_id,
      }));
      return NextResponse.json(formatted);
    } catch (error) {
      console.error('[API GET /api/history] ERRO listagem:', error);
      return NextResponse.json({ error: 'Erro ao listar períodos' }, { status: 500 });
    }
  }

  // Modo 2: detalhes de um período específico
  try {
    // buscar todos os períodos do store para determinar o anterior
    const distinct = await prisma.SellerHistory.findMany({
      where: { store_id: storeId },
      distinct: ['period'],
      orderBy: { created_at: 'asc' },
      select: { period: true },
    });
    const names = distinct.map(d => d.period);
    const idx = names.indexOf(period);
    const prev = idx > 0 ? names[idx - 1] : null;

    // buscar detalhes do período atual
    const current = await prisma.SellerHistory.findMany({
      where: { store_id: storeId, period },
      orderBy: { seller_name: 'asc' },
    });

    // buscar detalhes do período anterior (se existir)
    const previous = prev
      ? await prisma.SellerHistory.findMany({
          where: { store_id: storeId, period: prev },
          orderBy: { seller_name: 'asc' },
        })
      : [];

    return NextResponse.json({ current, previous });
  } catch (error) {
    console.error('[API GET /api/history] ERRO detalhes:', error);
    return NextResponse.json({ error: 'Erro ao buscar detalhes do período' }, { status: 500 });
  }
}
