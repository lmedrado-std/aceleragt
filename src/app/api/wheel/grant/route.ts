
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { storeId, sellerId, credits, grantedBy } = await req.json();

  console.log('[GRANT] Body:', { storeId, sellerId, credits, grantedBy });
  
  if (!storeId || !sellerId || !credits || !grantedBy) {
    return NextResponse.json({ error: "Dados obrigatórios faltando" }, { status: 400 });
  }

  try {
    // CORREÇÃO DEFINITIVA: Usando a sintaxe correta para o unique constraint, como revelado pelo `db pull`
    const record = await prisma.prize_wheel_credits.upsert({
      where: { 
        store_id_seller_id: { 
          store_id: storeId, 
          seller_id: sellerId 
        } 
      },
      create: { 
        store_id: storeId, 
        seller_id: sellerId, 
        credits: credits 
      },
      update: { 
        credits: { increment: credits } 
      }
    });

    return NextResponse.json({ 
      message: `${credits} giro(s) concedido(s) com sucesso!`, 
      totalCredits: record.credits 
    });

  } catch (error: any) {
    console.error("[POST /api/wheel/grant] Erro detalhado:", { message: error.message, stack: error.stack });
    return NextResponse.json({ error: "Erro ao conceder giros", details: error.message }, { status: 500 });
  }
}
