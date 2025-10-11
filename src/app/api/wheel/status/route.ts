
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json({ error: "storeId obrigatório" }, { status: 400 });
  }

  try {
    // 1. Verificar configurações (snake_case)
    const settings = await prisma.prize_wheel_settings.findFirst({
      where: { store_id: storeId },
    });

    if (!settings) {
      return NextResponse.json({
        creditsMap: {},
        spins: [],
        stats: { totalSpins: 0, totalValue: 0 },
      }, { status: 200 });
    }

    // 2. Buscar créditos e spins (snake_case)
    const [credits, spins] = await Promise.all([
      prisma.prize_wheel_credits.findMany({
        where: { store_id: storeId },
      }),
      prisma.prize_wheel_spins.findMany({
        where: { store_id: storeId },
        include: { 
          prize_wheel_segments: true  // relacionamento correto
        },
        orderBy: { created_at: 'desc' },
        take: 50,
      })
    ]);
    
    // 3. Construir mapa de créditos
    const creditsMap = Object.fromEntries(
        (credits || []).map(c => [c.seller_id, Number(c.credits || 0)])
    );

    // 4. Calcular estatísticas
    const totalSpins = spins?.length || 0;
    const totalValue = (spins || [])
      .filter(spin => spin.prize_wheel_segments && 
              spin.prize_wheel_segments.type === 'money' && 
              spin.prize_wheel_segments.value)
      .reduce((sum, spin) => 
        sum + (spin.prize_wheel_segments.value ? Number(spin.prize_wheel_segments.value) : 0), 0);
      
    const response = {
      creditsMap,
      spins: (spins || []).map(spin => ({ 
        ...spin, 
        createdAt: spin.created_at,
        segment: spin.prize_wheel_segments || { label: 'Prêmio', type: 'unknown' }
      })),
      stats: {
        totalSpins,
        totalValue,
      },
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("[GET /api/wheel/status] Erro:", error);
    return NextResponse.json({
        error: "Erro interno do servidor",
        details: error.message,
    }, { status: 500 });
  }
}
