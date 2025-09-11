
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: { storeId: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { storeId } = params;

    if (!storeId) {
      return NextResponse.json({ error: 'O ID da loja é obrigatório.' }, { status: 400 });
    }

    const result = await conn.query('SELECT * FROM goals WHERE store_id = $1', [storeId]);
    
    if (result.rowCount === 0) {
      // Retorna um objeto de metas padrão se não houver um específico para a loja
      return NextResponse.json({
        store_id: storeId,
        metaMinha: 0, metaMinhaPrize: 0, meta: 0, metaPrize: 0, metona: 0, metonaPrize: 0,
        metaLendaria: 0, legendariaBonusValorVenda: 0, legendariaBonusValorPremio: 0,
        paGoal1: 0, paPrize1: 0, paGoal2: 0, paPrize2: 0, paGoal3: 0, paPrize3: 0, paGoal4: 0, paPrize4: 0,
        ticketMedioGoal1: 0, ticketMedioPrize1: 0, ticketMedioGoal2: 0, ticketMedioPrize2: 0,
        ticketMedioGoal3: 0, ticketMedioPrize3: 0, ticketMedioGoal4: 0, ticketMedioPrize4: 0
      }, { status: 200 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
    
  } catch (error) {
    console.error(`[API /api/goals/[storeId]] ERRO no GET (storeId: ${params.storeId}):`, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao buscar metas da loja' }, { status: 500 });
  }
}
