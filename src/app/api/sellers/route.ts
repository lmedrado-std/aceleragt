
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';
import { URL } from 'url';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const storeId = url.searchParams.get('storeId');

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

export async function POST(request: Request) {
  try {
    const { name, password, avatar_id, store_id } = await request.json();

    if (!name || !password || !avatar_id || !store_id) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes: name, password, avatar_id e store_id são necessários.' }, { status: 400 });
    }
    
    const query = `
      INSERT INTO sellers (name, password, "avatar_id", "store_id") 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `;
    
    const result = await conn.query(query, [name, password, avatar_id, store_id]);
    
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('[API POST /api/sellers] ERRO:', error);
    const typedError = error as any;
    return NextResponse.json({ 
        error: 'Erro interno do servidor ao criar vendedor.',
        details: typedError.message,
        code: typedError.code,
     }, { status: 500 });
  }
}
