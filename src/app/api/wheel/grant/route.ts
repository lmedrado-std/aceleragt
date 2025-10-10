import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { storeId, sellerId, credits, grantedBy } = await req.json();
  
  if (!storeId || !sellerId || !credits || !grantedBy) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  try {
    const record = await prisma.prizeWheelCredits.upsert({
      where: { store_id_seller_id: { store_id: storeId, seller_id: sellerId } },
      create: { store_id: storeId, seller_id: sellerId, credits: credits },
      update: { credits: { increment: credits } }
    });

    return NextResponse.json({ 
      message: `${credits} giro(s) concedido(s) com sucesso!`, 
      totalCredits: record.credits 
    });
  } catch (error) {
    console.error("[POST /api/wheel/grant]", error);
    return NextResponse.json({ error: "Erro ao conceder giros" }, { status: 500 });
  }
}
