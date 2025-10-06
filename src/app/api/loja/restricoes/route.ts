
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
  storeId: z.string(),
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
    const restricao = await prisma.loja_restricao.findFirst({ where: { loja_id: storeId } });
    const areas = await prisma.loja_area_permitida.findMany({ where: { loja_id: storeId }, orderBy: { id: 'asc' } });
    const wifis = await prisma.loja_wifi_permitido.findMany({ where: { loja_id: storeId }, orderBy: { id: 'asc' } });

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
        const existingRestriction = await tx.loja_restricao.findFirst({ where: { loja_id: storeId } });
        await tx.loja_restricao.upsert({
            where: { id: existingRestriction?.id || -1 },
            create: { loja_id: storeId, modo },
            update: { modo, alterado_em: new Date() },
        });

        // Sync Áreas
        const existingAreas = await tx.loja_area_permitida.findMany({ where: { loja_id: storeId } });
        const areasToUpdate = areas.filter(a => a.id && existingAreas.some(ea => ea.id === a.id));
        const areasToCreate = areas.filter(a => !a.id);
        const areaIdsToKeep = areas.map(a => a.id).filter(Boolean);
        const areasToDelete = existingAreas.filter(ea => !areaIdsToKeep.includes(ea.id));

        if (areasToDelete.length > 0) {
            await tx.loja_area_permitida.deleteMany({ where: { id: { in: areasToDelete.map(a => a.id) } } });
        }
        for (const area of areasToUpdate) {
            const { id, ...areaData } = area;
            await tx.loja_area_permitida.update({ where: { id: id! }, data: { ...areaData } });
        }
        if (areasToCreate.length > 0) {
            await tx.loja_area_permitida.createMany({ data: areasToCreate.map(({id, ...a}) => ({ ...a, loja_id: storeId })) });
        }
        
        // Sync Wifis
        const existingWifis = await tx.loja_wifi_permitido.findMany({ where: { loja_id: storeId } });
        const wifisToUpdate = wifis.filter(w => w.id && existingWifis.some(ew => ew.id === w.id));
        const wifisToCreate = wifis.filter(w => !w.id);
        const wifiIdsToKeep = wifis.map(w => w.id).filter(Boolean);
        const wifisToDelete = existingWifis.filter(ew => !wifiIdsToKeep.includes(ew.id));

        if (wifisToDelete.length > 0) {
            await tx.loja_wifi_permitido.deleteMany({ where: { id: { in: wifisToDelete.map(w => w.id) } } });
        }
        for (const wifi of wifisToUpdate) {
            const { id, ...wifiData } = wifi;
            await tx.loja_wifi_permitido.update({ where: { id: id! }, data: { ...wifiData } });
        }
        if (wifisToCreate.length > 0) {
            await tx.loja_wifi_permitido.createMany({ data: wifisToCreate.map(({id, ...w}) => ({ ...w, loja_id: storeId })) });
        }
    });

    return NextResponse.json({ message: "Configurações salvas com sucesso." });
  } catch (error) {
    console.error("[POST /api/loja/restricoes]", error);
    return NextResponse.json({ error: "Erro ao salvar configurações de restrição." }, { status: 500 });
  }
}
