import { NextRequest, NextResponse } from "next/server";
import { populateHistoryForStore } from "@/lib/populateHistory";

/**
 * ROTA DE DESENVOLVIMENTO
 * 
 * Acessar esta rota via GET irá limpar o histórico existente para a 
 * "Loja de Treinamento" e irá gerar novos dados históricos para os últimos 6 meses
 * para todos os vendedores associados a ela.
 * 
 * Use esta rota para popular o banco de dados com dados de teste para o front-end.
 * 
 * IMPORTANTE: Esta rota não deve ser exposta em produção.
 */
export async function GET(req: NextRequest) {
  // Medida de segurança básica: garantir que esta rota só rode em ambiente de desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: "Esta rota está disponível apenas em ambiente de desenvolvimento." },
      { status: 403 }
    );
  }

  try {
    const storeNameToPopulate = "Loja de Treinamento";
    const result = await populateHistoryForStore(storeNameToPopulate);

    return NextResponse.json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
    console.error("Erro ao popular histórico:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
