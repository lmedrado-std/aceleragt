
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

// POST (UPSERT)
export async function POST(request: Request) {
  try {
    const goalsData = await request.json();
    
    const { 
        store_id, 
        metaMinha, metaMinhaPrize,
        meta, metaPrize,
        metona, metonaPrize,
        metaLendaria, legendariaBonusValorVenda, legendariaBonusValorPremio,
        paGoal1, paPrize1, paGoal2, paPrize2, paGoal3, paPrize3, paGoal4, paPrize4,
        ticketMedioGoal1, ticketMedioPrize1, ticketMedioGoal2, ticketMedioPrize2, 
        ticketMedioGoal3, ticketMedioPrize3, ticketMedioGoal4, ticketMedioPrize4
    } = goalsData;

    if (!store_id) {
        return NextResponse.json({ error: 'O ID da loja é obrigatório.' }, { status: 400 });
    }

    const query = `
      INSERT INTO goals (
        store_id, 
        "metaMinha", "metaMinhaPrize", "meta", "metaPrize", "metona", "metonaPrize", 
        "metaLendaria", "legendariaBonusValorVenda", "legendariaBonusValorPremio",
        "paGoal1", "paPrize1", "paGoal2", "paPrize2", "paGoal3", "paPrize3", "paGoal4", "paPrize4",
        "ticketMedioGoal1", "ticketMedioPrize1", "ticketMedioGoal2", "ticketMedioPrize2", 
        "ticketMedioGoal3", "ticketMedioPrize3", "ticketMedioGoal4", "ticketMedioPrize4"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      )
      ON CONFLICT (store_id) DO UPDATE SET
        "metaMinha" = EXCLUDED."metaMinha", "metaMinhaPrize" = EXCLUDED."metaMinhaPrize",
        "meta" = EXCLUDED."meta", "metaPrize" = EXCLUDED."metaPrize",
        "metona" = EXCLUDED."metona", "metonaPrize" = EXCLUDED."metonaPrize",
        "metaLendaria" = EXCLUDED."metaLendaria", 
        "legendariaBonusValorVenda" = EXCLUDED."legendariaBonusValorVenda", 
        "legendariaBonusValorPremio" = EXCLUDED."legendariaBonusValorPremio",
        "paGoal1" = EXCLUDED."paGoal1", "paPrize1" = EXCLUDED."paPrize1",
        "paGoal2" = EXCLUDED."paGoal2", "paPrize2" = EXCLUDED."paPrize2",
        "paGoal3" = EXCLUDED."paGoal3", "paPrize3" = EXCLUDED."paPrize3",
        "paGoal4" = EXCLUDED."paGoal4", "paPrize4" = EXCLUDED."paPrize4",
        "ticketMedioGoal1" = EXCLUDED."ticketMedioGoal1", "ticketMedioPrize1" = EXCLUDED."ticketMedioPrize1",
        "ticketMedioGoal2" = EXCLUDED."ticketMedioGoal2", "ticketMedioPrize2" = EXCLUDED."ticketMedioPrize2",
        "ticketMedioGoal3" = EXCLUDED."ticketMedioGoal3", "ticketMedioPrize3" = EXCLUDED."ticketMedioPrize3",
        "ticketMedioGoal4" = EXCLUDED."ticketMedioGoal4", "ticketMedioPrize4" = EXCLUDED."ticketMedioPrize4"
      RETURNING *
    `;

    const values = [
        store_id, 
        metaMinha, metaMinhaPrize, meta, metaPrize, metona, metonaPrize, 
        metaLendaria, legendariaBonusValorVenda, legendariaBonusValorPremio,
        paGoal1, paPrize1, paGoal2, paPrize2, paGoal3, paPrize3, paGoal4, paPrize4,
        ticketMedioGoal1, ticketMedioPrize1, ticketMedioGoal2, ticketMedioPrize2, 
        ticketMedioGoal3, ticketMedioPrize3, ticketMedioGoal4, ticketMedioPrize4
    ];
    
    // Convert undefined values to null for the database
    const sanitizedValues = values.map(v => v === undefined ? null : v);

    const result = await conn.query(query, sanitizedValues);

    return NextResponse.json(result.rows[0], { status: 200 });

  } catch (error) {
    console.error("[API /api/goals] ERRO no POST:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao salvar metas' }, { status: 500 });
  }
}
