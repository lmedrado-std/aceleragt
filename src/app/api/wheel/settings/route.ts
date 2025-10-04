
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Buscar configurações da loja
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');
  
  if (!storeId) {
    return NextResponse.json({ error: "storeId obrigatório" }, { status: 400 });
  }

  try {
    let settings = await prisma.prizeWheelSettings.findUnique({
      where: { storeId },
      include: {
        segments: {
          where: { isActive: true },
          orderBy: { position: 'asc' }
        }
      }
    });

    // Criar configuração padrão se não existir
    if (!settings) {
      settings = await createDefaultSettings(storeId);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[GET /api/wheel/settings]", error);
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
  }
}

// POST - Salvar configurações
export async function POST(req: NextRequest) {
  const { storeId, segments } = await req.json();
  
  if (!storeId || !segments) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Upsert settings
      let settings = await tx.prizeWheelSettings.upsert({
        where: { storeId },
        create: { storeId },
        update: { updatedAt: new Date() }
      });

      // Remover segmentos antigos
      await tx.prizeWheelSegment.deleteMany({
        where: { settingsId: settings.id }
      });

      // Criar novos segmentos
      await tx.prizeWheelSegment.createMany({
        data: segments.map((seg: any, index: number) => ({
          settingsId: settings.id,
          label: seg.label,
          type: seg.type,
          value: seg.value || null,
          description: seg.description || null,
          weight: seg.weight || 10,
          color: seg.color || "#3B82F6",
          position: index,
          isActive: seg.isActive !== false
        }))
      });

      return await tx.prizeWheelSettings.findUnique({
        where: { storeId },
        include: {
          segments: {
            where: { isActive: true },
            orderBy: { position: 'asc' }
          }
        }
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/wheel/settings]", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}

// Função para criar configuração padrão
async function createDefaultSettings(storeId: string) {
  return await prisma.prizeWheelSettings.create({
    data: {
      storeId,
      segments: {
        create: [
          { label: "R$ 5,00", type: "money", value: 5, weight: 25, position: 0, color: "#10B981" },
          { label: "R$ 7,00", type: "money", value: 7, weight: 20, position: 1, color: "#3B82F6" },
          { label: "R$ 10,00", type: "money", value: 10, weight: 15, position: 2, color: "#8B5CF6" },
          { label: "R$ 12,00", type: "money", value: 12, weight: 15, position: 3, color: "#F59E0B" },
          { label: "R$ 15,00", type: "money", value: 15, weight: 10, position: 4, color: "#EF4444" },
          { label: "Vale Desconto", type: "voucher", description: "10% de desconto", weight: 10, position: 5, color: "#EC4899" },
          { label: "Produto Especial", type: "product", description: "Brinde da loja", weight: 5, position: 6, color: "#F97316" },
          { label: "TENTE NOVAMENTE", type: "retry", weight: 0, position: 7, color: "#6B7280" }
        ]
      }
    },
    include: {
      segments: {
        where: { isActive: true },
        orderBy: { position: 'asc' }
      }
    }
  });
}
