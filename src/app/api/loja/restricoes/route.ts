
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from 'zod';

// Schemas de validação com Zod, garantindo a integridade dos dados na entrada.
const areaSchema = z.object({
  id: z.number().optional(),
  nome: z.string().min(1, "Nome da área é obrigatório"),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  raio: z.coerce.number().min(1, "O raio deve ser maior que zero"),
  ativo: z.boolean(),
});

const wifiSchema = z.object({
    id: z.number().optional(),
    nome: z.string().min(1, "Nome do Wi-Fi é obrigatório"),
    ssid: z.string().min(1, "SSID é obrigatório"),
    ativo: z.boolean(),
});

// Validação de UUID adicionada ao storeId para robustez máxima.
const settingsSchema = z.object({
  storeId: z.string().uuid("O ID da loja deve ser um UUID válido."),
  modo: z.enum(["E", "OU"]),
  areas: z.array(areaSchema),
  wifis: z.array(wifiSchema),
});


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');

  // Validação explícita do UUID no GET para evitar erros no banco.
  const uuidSchema = z.string().uuid({ message: "ID da loja fornecido é um UUID inválido." });
  const validation = uuidSchema.safeParse(storeId);

  if (!validation.success) {
    return NextResponse.json({ error: "ID da loja inválido", details: validation.error.format()._errors }, { status: 400 });
  }

  try {
    const restricao = await prisma.lojaRestricao.findFirst({ where: { loja_id: validation.data } });
    const areas = await prisma.lojaAreaPermitida.findMany({ where: { loja_id: validation.data }, orderBy: { id: 'asc' } });
    const wifis = await prisma.lojaWifiPermitido.findMany({ where: { loja_id: validation.data }, orderBy: { id: 'asc' } });

    // Proteção contra dados inconsistentes, garantindo que a resposta seja sempre bem formatada.
    return NextResponse.json({
      modo: restricao?.modo ?? "OU",
      areas: Array.isArray(areas) ? areas : [],
      wifis: Array.isArray(wifis) ? wifis : [],
    });

  } catch (error: unknown) {
    // Log detalhado do erro no backend para facilitar a depuração.
    console.error("[GET /api/loja/restricoes] ERRO COMPLETO:", error);
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return NextResponse.json({ error: "Erro ao buscar configurações de restrição.", details: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let requestBody: any;
  try {
    requestBody = await req.json();
    const validation = settingsSchema.safeParse(requestBody);
    if (!validation.success) {
      return NextResponse.json({ error: "Dados inválidos", details: validation.error.format() }, { status: 400 });
    }

    const { storeId, modo, areas, wifis } = validation.data;
    
    await prisma.$transaction(async (tx) => {
        // Lógica explícita de create/update para a restrição principal.
        const existingRestriction = await tx.lojaRestricao.findFirst({ where: { loja_id: storeId } });
        if (existingRestriction) {
            await tx.lojaRestricao.update({ where: { id: existingRestriction.id }, data: { modo, alterado_em: new Date() } });
        } else {
            await tx.lojaRestricao.create({ data: { loja_id: storeId, modo } });
        }

        // Sincronização robusta de Áreas
        const existingAreaIds = (await tx.lojaAreaPermitida.findMany({ where: { loja_id: storeId }, select: { id: true } })).map(a => a.id);
        const incomingAreaIds = areas.map(a => a.id).filter(Boolean);
        const areaIdsToDelete = existingAreaIds.filter(id => !incomingAreaIds.includes(id));

        if (areaIdsToDelete.length > 0) {
            await tx.lojaAreaPermitida.deleteMany({ where: { id: { in: areaIdsToDelete } } });
        }
        for (const area of areas) {
            const { id, ...areaData } = area;
            if (id && existingAreaIds.includes(id)) {
                await tx.lojaAreaPermitida.update({ where: { id }, data: areaData });
            } else {
                await tx.lojaAreaPermitida.create({ data: { ...areaData, loja_id: storeId } });
            }
        }
        
        // Sincronização robusta de Wifis
        const existingWifiIds = (await tx.lojaWifiPermitido.findMany({ where: { loja_id: storeId }, select: { id: true } })).map(w => w.id);
        const incomingWifiIds = wifis.map(w => w.id).filter(Boolean);
        const wifiIdsToDelete = existingWifiIds.filter(id => !incomingWifiIds.includes(id));

        if (wifiIdsToDelete.length > 0) {
            await tx.lojaWifiPermitido.deleteMany({ where: { id: { in: wifiIdsToDelete } } });
        }
        for (const wifi of wifis) {
            const { id, ...wifiData } = wifi;
            if (id && existingWifiIds.includes(id)) {
                await tx.lojaWifiPermitido.update({ where: { id }, data: wifiData });
            } else {
                await tx.lojaWifiPermitido.create({ data: { ...wifiData, loja_id: storeId } });
            }
        }
    });

    return NextResponse.json({ message: "Configurações salvas com sucesso." });
  } catch (error: unknown) {
    // Log detalhado do erro e do corpo da requisição para facilitar a depuração.
    console.error("[POST /api/loja/restricoes] ERRO COMPLETO:", error);
    console.error("[POST /api/loja/restricoes] BODY RECEBIDO:", JSON.stringify(requestBody, null, 2));
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    return NextResponse.json({ error: "Erro ao salvar configurações de restrição.", details: errorMessage }, { status: 500 });
  }
}
