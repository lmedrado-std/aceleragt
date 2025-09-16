
import { conn } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json({ error: 'O ID da loja é obrigatório' }, { status: 400 });
  }

  try {
    const result = await conn.query('SELECT * FROM sellers WHERE "store_id" = $1 ORDER BY name ASC', [storeId]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[API GET /api/sellers] ERRO:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, password, avatar_id, store_id } = await request.json();

    if (!name || !store_id) {
        return NextResponse.json({ error: 'Nome e ID da loja são obrigatórios' }, { status: 400 });
    }

    const result = await conn.query(
        'INSERT INTO sellers (name, password, avatar_id, store_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, password, avatar_id, store_id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('[API POST /api/sellers] ERRO:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
  }
}
