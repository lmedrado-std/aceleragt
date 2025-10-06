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
    // Cláusula de Guarda: Verificar se a roleta está configurada antes de prosseguir.
    const settings = await prisma.prizeWheelSettings.findUnique({
      where: { storeId },
    });

    if (!settings) {
      // Se não houver configuração, retorne imediatamente uma resposta segura.
      return NextResponse.json({
        creditsMap: {},
        spins: [],
        stats: { totalSpins: 0, totalValue: 0 },
      }, { status: 200 });
    }

    // A roleta existe, então prossiga com a busca dos dados.
    const credits = await prisma.prizeWheelCredits.findMany({
      where: { storeId, credits: { gt: 0 } },
    });

    const spins = await prisma.prizeWheelSpins.findMany({
      where: { storeId },
      include: { segment: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const totalSpins = await prisma.prizeWheelSpins.count({ where: { storeId } });

    const totalValue = spins
      .filter(spin => spin.segment && spin.segment.type === 'money' && spin.segment.value)
      .reduce((sum, spin) => sum + Number(spin.segment.value), 0);

    const response = {
      creditsMap: credits.reduce((acc, credit) => {
        acc[credit.sellerId] = credit.credits;
        return acc;
      }, {} as Record<string, number>),
      spins: spins || [],
      stats: {
        totalSpins: totalSpins || 0,
        totalValue: totalValue || 0,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("[GET /api/wheel/status] Erro inesperado:", error);
    // Fallback final e seguro para qualquer outra exceção.
    return NextResponse.json({
      creditsMap: {},
      spins: [],
      stats: { totalSpins: 0, totalValue: 0 },
    }, { status: 200 });
  }
}
