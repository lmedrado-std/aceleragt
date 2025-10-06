
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from 'zod';

const areaSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(1, "Nome da área é obrigatório"),
  latitude: z.number(),
  longitude: z.number(),
  raio: z.number().min(1, "O raio deve ser maior que zero"),
  ativo: z.boolean(),
});

const wifiSchema = z.object({
    id: z.number().optional(),
    nome: z.string().min(1, "Nome do Wi-Fi é obrigatório"),
    ssid: z.string().min(1, "SSID é obrigatório"),
    ativo: z.boolean(),
});

const settingsSchema = z.object({
  storeId: z.string().uuid(),
  modo: z.enum(["E", "OU"]),
  areas: z.array(areaSchema),
  wifis: z.array(wifiSchema),
});


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json({ error: "ID da loja é obrigatório" }, { status: 400 });
  }

  try {
    const [restricao, areas, wifis] = await Promise.all([
      prisma.loja_restricao.findFirst({ where: { loja_id: storeId } }),
      prisma.loja_area_permitida.findMany({ where: { loja_id: storeId }, orderBy: { id: 'asc' } }),
      prisma.loja_wifi_permitido.findMany({ where: { loja_id: storeId }, orderBy: { id: 'asc' } }),
    ]);

    return NextResponse.json({
      modo: restricao?.modo || "OU",
      areas: areas || [],
      wifis: wifis || [],
    });

  } catch (error) {
    console.error("[GET /api/loja/restricoes]", error);
    return NextResponse.json({ error: "Erro ao buscar configurações de restrição." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = settingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validation.error.format() }, { status: 400 });
    }

    const { storeId, modo, areas, wifis } = validation.data;
    
    await prisma.$transaction(async (tx) => {
        // Upsert Modo
        await tx.loja_restricao.upsert({
            where: { id: (await tx.loja_restricao.findFirst({ where: { loja_id: storeId } }))?.id || -1 },
            create: { loja_id: storeId, modo },
            update: { modo, alterado_em: new Date() },
        });

        // Sync Áreas
        const existingAreas = await tx.loja_area_permitida.findMany({ where: { loja_id: storeId } });
        const areasToDelete = existingAreas.filter(ea => !areas.some(na => na.id === ea.id));
        await tx.loja_area_permitida.deleteMany({ where: { id: { in: areasToDelete.map(a => a.id) } } });
        
        for (const area of areas) {
            const { id, ...areaData } = area;
            if (id) {
                await tx.loja_area_permitida.update({ where: { id }, data: { ...areaData, loja_id: storeId } });
            } else {
                await tx.loja_area_permitida.create({ data: { ...areaData, loja_id: storeId } });
            }
        }
        
        // Sync Wifis
        const existingWifis = await tx.loja_wifi_permitido.findMany({ where: { loja_id: storeId } });
        const wifisToDelete = existingWifis.filter(ew => !wifis.some(nw => nw.id === ew.id));
        await tx.loja_wifi_permitido.deleteMany({ where: { id: { in: wifisToDelete.map(w => w.id) } } });

        for (const wifi of wifis) {
            const { id, ...wifiData } = wifi;
            if (id) {
                await tx.loja_wifi_permitido.update({ where: { id }, data: { ...wifiData, loja_id: storeId } });
            } else {
                await tx.loja_wifi_permitido.create({ data: { ...wifiData, loja_id: storeId } });
            }
        }
    });

    return NextResponse.json({ message: "Configurações salvas com sucesso." });
  } catch (error) {
    console.error("[POST /api/loja/restricoes]", error);
    return NextResponse.json({ error: "Erro ao salvar configurações de restrição." }, { status: 500 });
  }
}
