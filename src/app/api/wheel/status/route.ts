
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');
  const limit = parseInt(searchParams.get('limit') || '50');
  
  if (!storeId) {
    return NextResponse.json({ error: "storeId obrigatório" }, { status: 400 });
  }

  try {
    // Buscar créditos por vendedor
    const credits = await prisma.prizeWheelCredits.findMany({
      where: { storeId, credits: { gt: 0 } }
    });

    // Buscar histórico de giros
    const spins = await prisma.prizeWheelSpins.findMany({
      where: { storeId },
      include: {
        segment: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Estatísticas
    const stats = await prisma.prizeWheelSpins.aggregate({
      where: { storeId },
      _count: { id: true },
      _sum: { segment: { value: true } }
    });

    // Converter créditos para mapa
    const creditsMap = credits.reduce((acc, credit) => {
      acc[credit.sellerId] = credit.credits;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      creditsMap,
      spins: spins || [],
      stats: {
        totalSpins: stats._count.id || 0,
        totalValue: stats._sum.segment?.value || 0
      }
    });
  } catch (error) {
    console.error("[GET /api/wheel/status]", error);
    return NextResponse.json({ error: "Erro ao buscar status" }, { status: 500 });
  }
}

    