
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
      [name, themeColor || null]
    );
    const newStoreId = storeResult.rows[0].id;

    const goalEntries = Object.entries(defaultGoals);
    const goalColumns = goalEntries.map(([key]) => `"${key}"`).join(', ');
    const goalValues = goalEntries.map(([, value]) => value);
    const goalPlaceholders = goalEntries.map((_, i) => `$${i + 2}`).join(', ');

    const goalsQuery = `
      INSERT INTO goals ("store_id", ${goalColumns})
      VALUES ($1, ${goalPlaceholders})
    `;

    await conn.query(goalsQuery, [newStoreId, ...goalValues]);

    await conn.query('COMMIT');

    const storeQuery = await conn.query('SELECT * FROM stores WHERE id = $1', [newStoreId]);

    return NextResponse.json(storeQuery.rows[0], { status: 201 });

  } catch (error) {
    await conn.query('ROLLBACK');
    console.error('[API /api/stores] POST: ERRO ao criar loja:', error);
    const typedError = error as any;
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor ao criar loja',
        details: typedError.message,
        code: typedError.code
      },
      { status: 500 }
    );
  }
}
