
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Função para sortear segmento baseado no peso
function pickSegment(segments: any[]) {
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < segments.length; i++) {
    if (random < segments[i].weight) {
      return { segment: segments[i], index: i };
    }
    random -= segments[i].weight;
  }
  
  // Fallback para o primeiro segmento, caso algo dê errado
  return { segment: segments[0], index: 0 };
}

export async function POST(req: NextRequest) {
  const { storeId, sellerId } = await req.json();
  
  if (!storeId || !sellerId) {
    return NextResponse.json({ error: "storeId e sellerId obrigatórios" }, { status: 400 });
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Verificar créditos disponíveis
      const credit = await tx.prizeWheelCredits.findUnique({
        where: { store_id_seller_id: { store_id: storeId, seller_id: sellerId } }
      });
      
      if (!credit || credit.credits < 1) {
        throw new Error("Sem giros disponíveis para este vendedor");
      }

      // Buscar configurações da roleta
      const settings = await tx.prizeWheelSettings.findFirst({
        where: { store_id: storeId },
        include: {
          prize_wheel_segments: { 
            where: { is_active: true },
            orderBy: { position: 'asc' }
          }
        }
      });

      if (!settings || settings.prize_wheel_segments.length === 0) {
        throw new Error("Roleta não configurada para esta loja");
      }

      // Sortear prêmio
      const { segment, index } = pickSegment(settings.prize_wheel_segments);

      // Decrementar crédito
      await tx.prizeWheelCredits.update({
        where: { store_id_seller_id: { store_id: storeId, seller_id: sellerId } },
        data: { credits: { decrement: 1 } }
      });

      // Registrar giro
      const spin = await tx.prizeWheelSpins.create({
        data: {
          store_id: storeId,
          seller_id: sellerId,
          grantedBy: "system",
          segment_id: segment.id, // Corrigido para snake_case
          status: "pending"
        },
        include: { segment: true }
      });

      return NextResponse.json({
        success: true,
        segmentIndex: index,
        prize: {
          id: segment.id,
          label: segment.label,
          type: segment.type,
          value: segment.value,
          description: segment.description,
          color: segment.color
        },
        spinId: spin.id,
        remainingCredits: credit.credits - 1
      });
    });
  } catch (error: any) {
    console.error("[POST /api/wheel/spin]", error);
    return NextResponse.json({ 
      success: false,
      error: error.message || "Erro no giro da roleta" 
    }, { status: 400 });
  }
}
