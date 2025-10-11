
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json({ error: "storeId obrigatório" }, { status: 400 });
  }

  try {
    console.log(`[Status] Buscando dados para store: ${storeId}`);

    // 1. Verificar configurações
    const settings = await prisma.prize_wheel_settings.findFirst({
      where: { store_id: storeId },
    });

    if (!settings) {
      console.log(`[Status] Nenhuma configuração encontrada para store: ${storeId}`);
      return NextResponse.json({
        creditsMap: {},
        spins: [],
        stats: { totalSpins: 0, totalValue: 0 },
      }, { status: 200 });
    }

    // 2. Buscar créditos e spins em paralelo
    const [credits, spins] = await Promise.all([
      prisma.prize_wheel_credits.findMany({
        where: { store_id: storeId },
      }),
      prisma.prize_wheel_spins.findMany({
        where: { store_id: storeId },
        include: { 
          prize_wheel_segments: true
        },
        orderBy: { created_at: 'desc' },
        take: 50,
      })
    ]);
    
    console.log(`[Status] Encontrados ${credits?.length || 0} registros de créditos e ${spins?.length || 0} giros`);

    // 3. Construir mapa de créditos
    const creditsMap = Object.fromEntries(
      (credits || []).map(c => [c.seller_id, Number(c.credits || 0)])
    );

    // 4. Calcular estatísticas
    const totalSpins = spins?.length || 0;
    const totalValue = (spins || [])
      .filter(spin => 
        spin.prize_wheel_segments && 
        spin.prize_wheel_segments.type === 'money' && 
        spin.prize_wheel_segments.value
      )
      .reduce((sum, spin) => 
        sum + (spin.prize_wheel_segments?.value ? Number(spin.prize_wheel_segments.value) : 0), 0
      );
      
    // 5. Preparar resposta
    const response = {
      creditsMap,
      spins: (spins || []).map(spin => ({ 
        ...spin, 
        createdAt: spin.created_at,
        segment: spin.prize_wheel_segments ? {
          id: spin.prize_wheel_segments.id,
          label: spin.prize_wheel_segments.label,
          type: spin.prize_wheel_segments.type,
          value: spin.prize_wheel_segments.value ? Number(spin.prize_wheel_segments.value) : null,
          color: spin.prize_wheel_segments.color
        } : { 
          id: 'unknown',
          label: 'Prêmio não encontrado', 
          type: 'unknown',
          value: null,
          color: '#6B7280'
        }
      })),
      stats: {
        totalSpins,
        totalValue,
      },
    };

    console.log(`[Status] Retornando: ${totalSpins} spins, R$ ${totalValue.toFixed(2)}, ${Object.keys(creditsMap).length} vendedores com créditos`);
    return NextResponse.json(response);

  } catch (error: any) {
    console.error("[GET /api/wheel/status] Erro detalhado:", {
      message: error.message,
      stack: error.stack,
      storeId,
    });
    
    return NextResponse.json({
      error: "Erro interno do servidor",
      details: error.message,
    }, { status: 500 });
  }
}
