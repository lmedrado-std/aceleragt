import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json({ error: "O ID da loja é obrigatório." }, { status: 400 });
  }

  try {
    const deleteResult = await prisma.prize_wheel_spins.deleteMany({
      where: {
        store_id: storeId,
      },
    });

    return NextResponse.json({
      message: `Histórico apagado. ${deleteResult.count} registros removidos.`,
    });

  } catch (error: any) {
    console.error("[DELETE /api/wheel/history] Erro:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor ao apagar o histórico.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
