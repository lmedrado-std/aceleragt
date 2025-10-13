
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

// Helper para criar uma resposta JSON segura
const createSafeResponse = (settings: any) => {
  const segments = (settings?.prize_wheel_segments || []).map((s: any) => ({
    id: s.id,
    label: s.label,
    type: s.type,
    value: s.value !== null ? Number(s.value) : null,
    description: s.description,
    color: s.color,
    weight: s.weight !== null ? Number(s.weight) : 10,
    position: s.position,
    is_active: s.is_active, 
  }));

  return NextResponse.json({
    configured: segments.length > 0,
    segments: segments,
  });
}

// GET /api/wheel/settings?storeId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json({ error: "storeId é obrigatório" }, { status: 400 });
    }

    let settings = await prisma.prize_wheel_settings.findFirst({
      where: { store_id: storeId },
      include: { prize_wheel_segments: { orderBy: { position: 'asc' } } },
    });

    if (!settings || settings.prize_wheel_segments.length === 0) {
        // A lógica para criar configurações padrão parece correta, mas também usa deleteMany.
        // Dado o contexto, vamos focar-nos no POST, mas isto pode precisar de revisão.
        // Por agora, vamos assumir que as configurações padrão não causam problemas de chave estrangeira.
        // Apenas retornamos um array vazio se não houver configurações.
        return NextResponse.json({ configured: false, segments: [] });
    }

    return createSafeResponse(settings);

  } catch (err: any) {
    console.error("Erro em GET /api/wheel/settings:", { error: err.message, stack: err.stack });
    return NextResponse.json(
      { error: "Erro interno ao carregar configurações da roleta.", details: err.message },
      { status: 500 }
    );
  }
}


// POST /api/wheel/settings (LÓGICA CORRIGIDA E SEGURA)
export async function POST(req: NextRequest) {
  try {
    const { storeId, segments: incomingSegments } = await req.json();
    if (!storeId || !Array.isArray(incomingSegments)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const updatedSettings = await prisma.$transaction(async (tx) => {
      // 1. Garante que a loja tem uma entrada de configuração
      let settings = await tx.prize_wheel_settings.upsert({
        where: { store_id: storeId },
        create: { store_id: storeId },
        update: { updated_at: new Date() },
      });

      // 2. Obtém todos os segmentos existentes e os IDs dos segmentos que já foram sorteados
      const existingSegments = await tx.prize_wheel_segments.findMany({
        where: { settings_id: settings.id },
      });
      const spunSegmentIds = (await tx.prize_wheel_spins.findMany({
        where: { segment_id: { in: existingSegments.map(s => s.id) } },
        select: { segment_id: true },
        distinct: ['segment_id'],
      })).map(spin => spin.segment_id);

      const existingSegmentMap = new Map(existingSegments.map(s => [s.id, s]));
      const incomingSegmentMap = new Map(incomingSegments.filter(s => s.id).map(s => [s.id, s]));
      
      // 3. Processa cada segmento que vem do frontend
      for (let i = 0; i < incomingSegments.length; i++) {
        const segmentData = incomingSegments[i];
        const segmentPayload = {
          label: segmentData.label,
          type: segmentData.type,
          value: segmentData.type === 'money' && segmentData.value != null ? new Decimal(segmentData.value) : null,
          description: segmentData.description,
          color: segmentData.color,
          weight: segmentData.weight != null ? segmentData.weight : 10,
          position: i,
          is_active: segmentData.is_active,
          settings_id: settings.id,
        };

        if (segmentData.id && existingSegmentMap.has(segmentData.id)) {
          // Atualiza segmento existente
          await tx.prize_wheel_segments.update({
            where: { id: segmentData.id },
            data: segmentPayload,
          });
        } else {
          // Cria novo segmento
          await tx.prize_wheel_segments.create({ data: segmentPayload });
        }
      }

      // 4. Processa segmentos que não vieram do frontend (foram removidos na UI)
      for (const existingSegment of existingSegments) {
        if (!incomingSegmentMap.has(existingSegment.id)) {
          if (spunSegmentIds.includes(existingSegment.id)) {
            // Se já foi sorteado, desativa em vez de apagar
            await tx.prize_wheel_segments.update({
              where: { id: existingSegment.id },
              data: { is_active: false },
            });
          } else {
            // Se nunca foi sorteado, pode ser apagado com segurança
            await tx.prize_wheel_segments.delete({ where: { id: existingSegment.id } });
          }
        }
      }

      // 5. Retorna o estado final e atualizado
      return tx.prize_wheel_settings.findFirst({
        where: { id: settings.id },
        include: { prize_wheel_segments: { orderBy: { position: 'asc' } } },
      });
    });

    return createSafeResponse(updatedSettings);

  } catch (err: any) {
    console.error("Erro em POST /api/wheel/settings:", { error: err.message, stack: err.stack });
    
    // Retorna uma mensagem de erro específica para violação de chave estrangeira
    if (err.code === 'P2014' || (err.message && err.message.includes('Foreign key constraint'))) {
        return NextResponse.json(
            { error: "Erro de integridade de dados ao salvar a roleta.", details: "Um ou mais segmentos não puderam ser apagados pois já existem registros de sorteios vinculados a eles." },
            { status: 409 }
        );
    }

    return NextResponse.json(
      { error: "Erro interno ao salvar configurações da roleta.", details: err.message },
      { status: 500 }
    );
  }
}
