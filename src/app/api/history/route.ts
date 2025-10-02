
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
  
  // Modo 1: listar períodos disponíveis para a loja
  if (!period) {
    try {
      const periodGroups = await prisma.sellerHistory.groupBy({
        by: ['period'],
        where: { store_id: storeId },
        _count: {
          _all: true,
        },
        orderBy: {
          period: 'desc',
        },
      });

      // A consulta acima nos dá o nome do período e a contagem. Formatamos para o frontend.
      const formattedPeriods = periodGroups.map(p => ({
        period: p.period,
        storeId: storeId, // Adicionamos o storeId para consistência
        sellerCount: p._count._all,
      }));
      
      return NextResponse.json(formattedPeriods);

    } catch (error) {
      console.error('[API GET /api/history] ERRO listagem:', error);
      return NextResponse.json({ error: 'Erro ao listar períodos' }, { status: 500 });
    }
  }

  // Modo 2: detalhes de um período específico
  try {
    // buscar todos os períodos do store para determinar o anterior
    const distinctPeriods = await prisma.sellerHistory.findMany({
      where: { store_id: storeId },
      distinct: ['period'],
      orderBy: { created_at: 'asc' }, // Ordena pela data de criação para garantir a ordem correta
      select: { period: true },
    });
    const periodNames = distinctPeriods.map(d => d.period);
    const currentIndex = periodNames.indexOf(period);
    const previousPeriodName = currentIndex > 0 ? periodNames[currentIndex - 1] : null;

    // buscar detalhes do período atual
    const currentPeriodDetails = await prisma.sellerHistory.findMany({
      where: { store_id: storeId, period },
      orderBy: { seller_name: 'asc' },
    });

    // buscar detalhes do período anterior (se existir)
    const previousPeriodDetails = previousPeriodName
      ? await prisma.sellerHistory.findMany({
          where: { store_id: storeId, period: previousPeriodName },
          orderBy: { seller_name: 'asc' },
        })
      : [];

    return NextResponse.json({ current: currentPeriodDetails, previous: previousPeriodDetails });
  } catch (error) {
    console.error('[API GET /api/history] ERRO detalhes:', error);
    return NextResponse.json({ error: 'Erro ao buscar detalhes do período' }, { status: 500 });
  }
}
