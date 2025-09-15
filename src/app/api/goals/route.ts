
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
    const result = await conn.query('SELECT * FROM goals WHERE "store_id" = $1', [storeId]);
    if (result.rowCount === 0) {
        // Find store to make sure it exists
        const storeResult = await conn.query('SELECT id FROM stores WHERE id = $1', [storeId]);
        if (storeResult.rowCount > 0) {
          return NextResponse.json({}); // Return empty if goals don't exist but store does
        }
        return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('[API GET /api/goals] ERRO:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
      const { store_id, goals } = await request.json();
  
      if (!store_id || !goals) {
        return NextResponse.json({ error: 'store_id e metas são obrigatórios' }, { status: 400 });
      }

      const goalKeys = Object.keys(goals);
      const goalValues = Object.values(goals);

      const setClause = goalKeys.map((key, i) => `"${key}" = $${i + 2}`).join(', ');
      
      const query = `
        INSERT INTO goals ("store_id", ${goalKeys.map(k => `"${k}"`).join(', ')})
        VALUES ($1, ${goalKeys.map((_, i) => `$${i + 2}`).join(', ')})
        ON CONFLICT ("store_id") DO UPDATE SET
          ${setClause}
        RETURNING *;
      `;
  
      const result = await conn.query(query, [store_id, ...goalValues]);
      
      return NextResponse.json(result.rows[0]);
    } catch (error) {
      console.error('[API POST /api/goals] ERRO:', error);
      const typedError = error as any;
      return NextResponse.json({ 
        error: 'Erro interno do servidor ao salvar metas.',
        details: typedError.message,
        code: typedError.code,
     }, { status: 500 });
    }
}
