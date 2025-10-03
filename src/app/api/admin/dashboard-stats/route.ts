import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const storeCount = await prisma.stores.count();
    const sellerCount = await prisma.sellers.count();
    const totalSalesAgg = await prisma.sellers.aggregate({
      _sum: {
        vendas: true,
      },
    });
    const totalSales = totalSalesAgg._sum.vendas || 0;

    const storesDetails = await prisma.stores.findMany({
      include: {
        sellers: true,
      },
    });

    const formattedStoresDetails = storesDetails
      .map((store) => {
        const total_vendas = store.sellers.reduce(
          (acc, seller) => acc + (seller.vendas ? Number(seller.vendas) : 0),
          0
        );
        return {
          id: store.id,
          name: store.name,
          total_vendas: total_vendas,
          seller_count: store.sellers.length,
        };
      })
      .sort((a, b) => b.total_vendas - a.total_vendas);

    const stats = {
      storeCount,
      sellerCount,
      totalSales,
      storesDetails: formattedStoresDetails,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[API GET /api/admin/dashboard-stats] ERRO:', error);
    const typedError = error as any;
    return NextResponse.json(
      {
        error: 'Erro ao buscar estatísticas do dashboard.',
        details: typedError.message,
        code: typedError.code,
      },
      { status: 500 }
    );
  }
}
