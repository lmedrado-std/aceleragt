
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';
import { Goals } from '@/lib/storage';

const defaultGoals: Omit<Goals, 'store_id'> = {
  metaMinha: 8000,
  metaMinhaPrize: 50,
  meta: 9000,
  metaPrize: 100,
  metona: 10000,
  metonaPrize: 120,
  metaLendaria: 12000,
  legendariaBonusValorVenda: 2000,
  legendariaBonusValorPremio: 50,
  paGoal1: 1.5,
  paPrize1: 5,
  paGoal2: 1.6,
  paPrize2: 10,
  paGoal3: 1.9,
  paPrize3: 15,
  paGoal4: 2.0,
  paPrize4: 20,
  ticketMedioGoal1: 180,
  ticketMedioPrize1: 5,
  ticketMedioGoal2: 185,
  ticketMedioPrize2: 10,
  ticketMedioGoal3: 190,
  ticketMedioPrize3: 15,
  ticketMedioGoal4: 200,
  ticketMedioPrize4: 20,
};


export async function GET() {
  try {
    const result = await conn.query('SELECT id, name, theme_color FROM stores ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[API /api/stores] GET: ERRO ao buscar lojas:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, themeColor } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'O nome da loja é obrigatório' }, { status: 400 });
    }

    await conn.query('BEGIN');
    
    const storeResult = await conn.query(
      'INSERT INTO stores (name, theme_color) VALUES ($1, $2) RETURNING id',
      [name, themeColor || '217.2 32.6% 17.5%']
    );
    const newStoreId = storeResult.rows[0].id;

    await conn.query(
        `INSERT INTO goals (store_id, "metaMinha", "metaMinhaPrize", "meta", "metaPrize", "metona", "metonaPrize", "metaLendaria", "legendariaBonusValorVenda", "legendariaBonusValorPremio", "paGoal1", "paPrize1", "paGoal2", "paPrize2", "paGoal3", "paPrize3", "paGoal4", "paPrize4", "ticketMedioGoal1", "ticketMedioPrize1", "ticketMedioGoal2", "ticketMedioPrize2", "ticketMedioGoal3", "ticketMedioPrize3", "ticketMedioGoal4", "ticketMedioPrize4")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
        [newStoreId, ...Object.values(defaultGoals)]
    );

    await conn.query('COMMIT');

    const newStore = { id: newStoreId, name, themeColor };
    return NextResponse.json(newStore, { status: 201 });
  } catch (error) {
    await conn.query('ROLLBACK');
    console.error('[API /api/stores] POST: ERRO ao criar loja:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
