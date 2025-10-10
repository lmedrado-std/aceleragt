
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');
  const limit = parseInt(searchParams.get('limit') || '50');

  if (!storeId) {
    return NextResponse.json({ error: "storeId obrigatório" }, { status: 400 });
  }

  try {
    const settings = await prisma.prizeWheelSettings.findFirst({
      where: { store_id: storeId },
    });

    if (!settings) {
      return NextResponse.json({
        creditsMap: {},
        spins: [],
        stats: { totalSpins: 0, totalValue: 0 },
      }, { status: 200 });
    }

    const credits = await prisma.prizeWheelCredits.findMany({
      where: { store_id: storeId },
    });

    const spins = await prisma.prizeWheelSpins.findMany({
      where: { store_id: storeId },
      include: { segment: true },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    
    const totalSpins = spins.length;

    const totalValue = spins
      .filter(spin => spin.segment.type === 'money' && spin.segment.value)
      .reduce((sum, spin) => sum + (spin.segment.value ? Number(spin.segment.value) : 0), 0);
      
    const response = {
      creditsMap: credits.reduce((acc, credit) => {
        acc[credit.seller_id] = credit.credits;
        return acc;
      }, {} as Record<string, number>),
      spins: spins ? spins.map(spin => ({ ...spin, createdAt: spin.created_at })) : [],
      stats: {
        totalSpins,
        totalValue,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("[GET /api/wheel/status] Erro inesperado:", error);
    return NextResponse.json({
        error: "Erro interno do servidor ao buscar status da roleta.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
    }, { status: 500 });
  }
}
