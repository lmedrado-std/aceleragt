
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json({ error: "storeId obrigatório" }, { status: 400 });
  }

  try {
    const [creditsData, spinsData, settingsData] = await Promise.all([
      prisma.prize_wheel_credits.findMany({
        where: { store_id: storeId },
      }),
      prisma.prize_wheel_spins.findMany({
        where: { store_id: storeId },
        include: { 
          // CORREÇÃO: Usar o nome da relação snake_case do schema
          prize_wheel_segments: true 
        },
        orderBy: { created_at: 'desc' },
        take: 50,
      }),
      prisma.prize_wheel_settings.findFirst({
        where: { store_id: storeId },
        include: { prize_wheel_segments: { orderBy: { position: 'asc' } } },
      })
    ]);
    
    const creditsMap = Object.fromEntries(
      creditsData.map(c => [c.seller_id, c.credits])
    );

    const totalSpins = spinsData.length;
    const totalValue = spinsData
      .filter(spin => 
        spin.prize_wheel_segments && 
        spin.prize_wheel_segments.type === 'money' && 
        spin.prize_wheel_segments.value != null
      )
      .reduce((sum, spin) => 
        sum + Number(spin.prize_wheel_segments.value), 0
      );
      
    const response = {
      creditsMap,
      segments: settingsData?.prize_wheel_segments.map(seg => ({ ...seg, value: Number(seg.value) })) || [],
      spins: spinsData.map((spin: any) => ({ 
        ...spin, 
        createdAt: spin.created_at,
        // CORREÇÃO: Usar o nome da relação snake_case do schema
        segment: spin.prize_wheel_segments ? { 
          id: spin.prize_wheel_segments.id,
          label: spin.prize_wheel_segments.label,
          type: spin.prize_wheel_segments.type,
          value: spin.prize_wheel_segments.value != null ? Number(spin.prize_wheel_segments.value) : null,
          color: spin.prize_wheel_segments.color
        } : null
      })),
      stats: {
        totalSpins,
        totalValue,
      },
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("[GET /api/wheel/status] Erro detalhado:", {
      message: error.message,
      stack: error.stack,
      storeId,
    });
    
    return NextResponse.json({
      error: "Erro interno do servidor ao buscar status da roleta.",
      details: error.message,
    }, { status: 500 });
  }
}
