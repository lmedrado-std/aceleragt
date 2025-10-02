
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "../../../lib/db";

/**
 * GET /api/history
 * Fetches historical data. Can be used in two modes:
 * 1. List all unique archived periods by calling it without query parameters.
 * 2. Fetch detailed history for a specific period (and its preceding period for comparison)
 *    by providing `period` and `storeId` query parameters.
 */
export async function GET(req: NextRequest) {
  const periodName = req.nextUrl.searchParams.get('period');
  const storeId = req.nextUrl.searchParams.get('storeId');

  try {
    // Mode 2: Fetch detailed history for a specific period with comparison
    if (periodName && storeId) {
       // Find all unique periods for the store, sorted chronologically to find the previous one
      const allPeriodsForStore = await prisma.sellerHistory.findMany({
        where: { store_id: storeId },
        distinct: ['period'],
        orderBy: { created_at: 'asc' },
        select: { period: true, created_at: true },
      });

      const uniquePeriods = allPeriodsForStore.reduce((acc, current) => {
        if (!acc.find(item => item.period === current.period)) {
          acc.push(current);
        }
        return acc;
      }, [] as {period: string, created_at: Date | null}[]);
      
      const periodNames = uniquePeriods.map(p => p.period);
      const currentPeriodIndex = periodNames.findIndex(p => p === periodName);
      
      let previousPeriodName: string | null = null;
      if (currentPeriodIndex > 0) {
        previousPeriodName = periodNames[currentPeriodIndex - 1];
      }

      // Fetch details for the current period
      const currentPeriodDetails = await prisma.sellerHistory.findMany({
        where: { period: periodName, store_id: storeId },
        orderBy: { seller_name: 'asc' },
      });

      let previousPeriodDetails: any[] = [];
      if (previousPeriodName) {
        previousPeriodDetails = await prisma.sellerHistory.findMany({
          where: { period: previousPeriodName, store_id: storeId },
          orderBy: { seller_name: 'asc' },
        });
      }
      
      // Combine data for comparison
      const responseData = {
        current: currentPeriodDetails,
        previous: previousPeriodDetails,
      };

      return NextResponse.json(responseData);
    }

    // Mode 1: List all unique archived periods
    const periods = await prisma.sellerHistory.groupBy({
      by: ["period", "store_id"],
      _count: {
        seller_id: true,
      },
       orderBy: {
        period: 'desc',
      },
    });

    const formatted = periods.map(p => ({
      period: p.period,
      storeId: p.store_id,
      sellerCount: p._count.seller_id,
    }));

    return NextResponse.json(formatted);

  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
