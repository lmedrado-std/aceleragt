
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Decimal } from "@prisma/client/runtime/library";

// Helper para criar uma resposta JSON segura, convertendo tipos de dados do Prisma
const createSafeResponse = (settings: any) => {
  const segments = (settings?.prize_wheel_segments || []).map((s: any) => ({
    id: s.id,
    label: s.label,
    type: s.type,
    value: s.value !== null ? Number(s.value) : null, // Converte Decimal para Number
    description: s.description,
    color: s.color,
    weight: s.weight !== null ? Number(s.weight) : 10, // Garante que o peso tenha um valor padrão
    position: s.position,
    isActive: s.is_active, // Mapeia de is_active (BD) para isActive (frontend)
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
      const defaultSettings = await prisma.$transaction(async (tx) => {
        let existingSettings = await tx.prize_wheel_settings.findFirst({
            where: { store_id: storeId },
        });

        if (!existingSettings) {
            existingSettings = await tx.prize_wheel_settings.create({
                data: { store_id: storeId, updated_at: new Date() },
            });
        }

        await tx.prize_wheel_segments.deleteMany({ where: { settings_id: existingSettings.id } });

        await tx.prize_wheel_segments.createMany({
            data: [
              { settings_id: existingSettings.id, label: "Acelera !!! 5,00", type: "money", value: new Decimal(5.00), weight: 25, position: 0, color: "#10B981", is_active: true },
              { settings_id: existingSettings.id, label: "não foi dessa vez", type: "retry", value: new Decimal(0.00), weight: 40, position: 1, color: "#6B7280", is_active: true },
              { settings_id: existingSettings.id, label: "Aceleeraaa !!! 10,00", type: "money", value: new Decimal(10.00), weight: 15, position: 2, color: "#3B82F6", is_active: true },
              { settings_id: existingSettings.id, label: "Aceleeeraaaaaaaaa R$ 15,00", type: "money", value: new Decimal(15.00), weight: 5, position: 3, color: "#F59E0B", is_active: true }
            ],
        });
        
        return tx.prize_wheel_settings.findFirst({
            where: { id: existingSettings.id },
            include: { prize_wheel_segments: { orderBy: { position: 'asc' } } },
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

    const segmentsToCreate = segments.map((s: any, index: number) => ({
      label: s.label,
      type: s.type,
      value: s.type === 'money' && s.value !== null ? new Decimal(s.value) : null,
      description: s.description,
      color: s.color,
      weight: s.weight !== null ? s.weight : 10,
      position: index,
      is_active: s.isActive, // Mapeia de isActive (frontend) para is_active (BD)
    }));

    const updatedSettings = await prisma.$transaction(async (tx) => {
        let settings = await tx.prize_wheel_settings.findFirst({
            where: { store_id: storeId },
        });

        if (!settings) {
            settings = await tx.prize_wheel_settings.create({
                data: { store_id: storeId, updated_at: new Date() },
            });
        } else {
          await tx.prize_wheel_settings.update({
            where: { id: settings.id },
            data: { updated_at: new Date() }
          })
        }

        await tx.prize_wheel_segments.deleteMany({
            where: { settings_id: settings.id },
        });

        await tx.prize_wheel_segments.createMany({
            data: segmentsToCreate.map(s => ({ ...s, settings_id: settings!.id })),
        });
        
        return tx.prize_wheel_settings.findFirst({
            where: { id: settings.id },
            include: { prize_wheel_segments: { orderBy: { position: 'asc' } } },
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
