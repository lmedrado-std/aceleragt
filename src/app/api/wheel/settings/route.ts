
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Helper para criar uma resposta JSON segura, convertendo tipos de dados do Prisma
const createSafeResponse = (settings: any) => {
  const segments = (settings?.segments || []).map((s: any) => ({
    id: s.id,
    label: s.label,
    type: s.type,
    value: s.value !== null ? Number(s.value) : null, // Converte Decimal para Number
    description: s.description,
    color: s.color,
    weight: s.weight !== null ? Number(s.weight) : null, // Converte Decimal para Number
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

    let settings = await prisma.prizeWheelSettings.findUnique({
      where: { storeId },
      include: { segments: { orderBy: { position: 'asc' } } },
    });

    if (!settings) {
      // Se não existir, cria uma configuração vazia. O frontend cuidará do resto.
      settings = await prisma.prizeWheelSettings.create({
        data: { storeId },
        include: { segments: true },
      });
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
    const segmentsToCreate = segments.map((s: any) => ({
      label: s.label,
      type: s.type,
      value: s.value !== null ? s.value : undefined,
      description: s.description,
      color: s.color,
      weight: s.weight !== null ? s.weight : 10,
      position: s.position,
      isActive: true,
    }));

    const updatedSettings = await prisma.prizeWheelSettings.upsert({
      where: { storeId },
      update: {
        segments: {
          deleteMany: {},
          create: segmentsToCreate,
        },
      },
      create: {
        storeId,
        segments: { 
          create: segmentsToCreate 
        },
      },
      include: { segments: { orderBy: { position: 'asc' }} },
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
