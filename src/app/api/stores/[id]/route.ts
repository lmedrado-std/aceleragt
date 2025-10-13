import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const getStoreIdFromUrl = (url: string): string => {
  const { pathname } = new URL(url);
  // pathname -> "/api/stores/{id}"
  const parts = pathname.split("/");
  return parts[parts.length - 1];
};

export async function GET(request: NextRequest) {
  const storeId = getStoreIdFromUrl(request.url);
  const includePassword = request.nextUrl.searchParams.get("includePassword") === "true";

  try {
    const store = await prisma.stores.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        theme_color: true,
        last_incentive_calculation: true,
        password: includePassword,
      },
    });

    if (!store) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }
    return NextResponse.json(store);
  } catch (err: any) {
    console.error(`[API GET /api/stores/${storeId}] ERRO:`, err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const storeId = getStoreIdFromUrl(request.url);

  try {
    const body = await request.json();
    const updatedStore = await prisma.stores.update({
      where: { id: storeId },
      data: body,
    });
    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error(`[API PUT /api/stores/${storeId}] ERRO:`, error);
    const typedError = error as any;
    if (typedError.code === "P2025") {
      return NextResponse.json({ error: "Loja não encontrada para atualizar" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const storeId = getStoreIdFromUrl(request.url);

  try {
    await prisma.stores.delete({
      where: { id: storeId },
    });
    return NextResponse.json({ message: "Loja e todos os seus dados foram removidos com sucesso" });
  } catch (error) {
    console.error(`[API DELETE /api/stores/${storeId}] ERRO:`, error);
    const typedError = error as any;
    if (typedError.code === "P2025") {
      return NextResponse.json({ error: "Loja não encontrada para deletar" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    );
  }
}