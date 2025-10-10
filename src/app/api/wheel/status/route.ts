
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json({ error: "storeId obrigatório" }, { status: 400 });
  }

  try {
    // 1. Verificar se a loja tem configuração de roleta
    const settings = await prisma.prizeWheelSettings.findFirst({
      where: { store_id: storeId },
    });

    // Se não houver configurações, retorne uma resposta vazia e bem-sucedida
    if (!settings) {
      return NextResponse.json({
        creditsMap: {},
        spins: [],
        stats: { totalSpins: 0, totalValue: 0 },
      }, { status: 200 });
    }

    // 2. Buscar créditos e giros
    const [credits, spins] = await Promise.all([
      prisma.prizeWheelCredits.findMany({
        where: { store_id: storeId },
      }),
      prisma.prizeWheelSpins.findMany({
        where: { store_id: storeId },
        include: { segment: true },
        orderBy: { created_at: 'desc' },
        take: 50,
      })
    ]);
    
    // 3. Construir o mapa de créditos de forma segura
    const creditsMap = Object.fromEntries(
        credits.map(c => [c.seller_id, Number(c.credits || 0)])
    );

    // 4. Calcular estatísticas de forma segura
    const totalSpins = spins.length;
    const totalValue = spins
      .filter(spin => spin.segment && spin.segment.type === 'money' && spin.segment.value)
      .reduce((sum, spin) => sum + (spin.segment.value ? Number(spin.segment.value) : 0), 0);
      
    const response = {
      creditsMap,
      spins: spins.map(spin => ({ ...spin, createdAt: spin.created_at })),
      stats: {
        totalSpins,
        totalValue,
      },
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("[GET /api/wheel/status] Erro inesperado:", {
        message: error.message,
        stack: error.stack,
        code: error.code,
    });
    return NextResponse.json({
        error: "Erro interno do servidor ao buscar status da roleta.",
        details: error.message || "Erro desconhecido",
    }, { status: 500 });
  }
}
