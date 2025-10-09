
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

// Helper para criar uma resposta JSON segura, convertendo tipos de dados do Prisma
const createSafeResponse = (settings: any) => {
  const segments = (settings?.segments || []).map((s: any) => ({
    id: s.id,
    label: s.label,
    type: s.type,
    value: s.value !== null ? Number(s.value) : null, // Converte Decimal para Number
    description: s.description,
    color: s.color,
    weight: s.weight !== null ? Number(s.weight) : 10, // Garante que o peso tenha um valor padrão
    position: s.position,
    isActive: s.isActive,
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

    let settings = await prisma.prizeWheelSettings.findFirst({
      where: { storeId },
      include: { segments: { orderBy: { position: 'asc' } } },
    });

    if (!settings || settings.segments.length === 0) {
       // Se não existir, cria uma configuração padrão com os novos prêmios
      const defaultSettings = await prisma.$transaction(async (tx) => {
        let existingSettings = await tx.prizeWheelSettings.findFirst({
            where: { storeId },
        });

        if (!existingSettings) {
            existingSettings = await tx.prizeWheelSettings.create({
                data: { id: `settings_${storeId}`, storeId },
            });
        }

        // Deleta segmentos antigos para garantir um estado limpo
        await tx.prizeWheelSegment.deleteMany({ where: { settingsId: existingSettings.id } });

        // Cria os novos segmentos padrão
        await tx.prizeWheelSegment.createMany({
            data: [
              { id: `seg_${storeId}_1`, settingsId: existingSettings.id, label: "Acelera !!! 5,00", type: "money", value: new Decimal(5.00), weight: 25, position: 0, color: "#10B981", isActive: true },
              { id: `seg_${storeId}_2`, settingsId: existingSettings.id, label: "não foi dessa vez", type: "retry", value: new Decimal(0.00), weight: 40, position: 1, color: "#6B7280", isActive: true },
              { id: `seg_${storeId}_3`, settingsId: existingSettings.id, label: "Aceleeraaa !!! 10,00", type: "money", value: new Decimal(10.00), weight: 15, position: 2, color: "#3B82F6", isActive: true },
              { id: `seg_${storeId}_4`, settingsId: existingSettings.id, label: "Aceleeeraaaaaaaaa R$ 15,00", type: "money", value: new Decimal(15.00), weight: 5, position: 3, color: "#F59E0B", isActive: true }
            ],
        });
        
        return tx.prizeWheelSettings.findFirst({
            where: { id: existingSettings.id },
            include: { segments: { orderBy: { position: 'asc' } } },
        });
      });
      return createSafeResponse(defaultSettings);
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

// POST /api/wheel/settings
export async function POST(req: NextRequest) {
  try {
    const { storeId, segments } = await req.json();
    if (!storeId || !Array.isArray(segments)) {
      return NextResponse.json({ error: "Dados inválidos (storeId e segments são obrigatórios)" }, { status: 400 });
    }

    // Garante que os dados do segmento estão no formato correto para o Prisma
    const segmentsToCreate = segments.map((s: any, index: number) => ({
      id: s.id || `seg_${storeId}_${index}`,
      label: s.label,
      type: s.type,
      value: s.type === 'money' && s.value !== null ? new Decimal(s.value) : null,
      description: s.description,
      color: s.color,
      weight: s.weight !== null ? s.weight : 10,
      position: index, // Usa o index do array para garantir a ordem
      isActive: true,
    }));

    const updatedSettings = await prisma.$transaction(async (tx) => {
        // Encontra ou cria as configurações da loja
        let settings = await tx.prizeWheelSettings.findFirst({
            where: { storeId },
        });

        if (!settings) {
            settings = await tx.prizeWheelSettings.create({
                data: { id: `settings_${storeId}`, storeId },
            });
        }

        // Deleta os segmentos antigos
        await tx.prizeWheelSegment.deleteMany({
            where: { settingsId: settings.id },
        });

        // Cria os novos segmentos
        await tx.prizeWheelSegment.createMany({
            data: segmentsToCreate.map(s => ({ ...s, settingsId: settings!.id })),
        });
        
        // Retorna as configurações atualizadas com os novos segmentos
        return tx.prizeWheelSettings.findFirst({
            where: { id: settings.id },
            include: { segments: { orderBy: { position: 'asc' } } },
        });
    });

    return createSafeResponse(updatedSettings);

  } catch (err: any) {
    console.error("Erro em POST /api/wheel/settings:", { error: err.message, stack: err.stack });
    return NextResponse.json(
      { error: "Erro interno ao salvar configurações da roleta.", details: err.message },
      { status: 500 }
    );
  }
}
