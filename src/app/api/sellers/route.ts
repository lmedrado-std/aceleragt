
import { conn } from '@/lib/db';
import { NextResponse, NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('storeId');

  if (!storeId) {
    return NextResponse.json({ status: 'erro', message: 'O ID da loja é obrigatório.' }, { status: 400 });
  }

  try {
    const result = await conn.query('SELECT * FROM sellers WHERE store_id = $1 ORDER BY name ASC', [storeId]);
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error(`[API /api/sellers] ERRO no GET (storeId: ${storeId}):`, error);
    return NextResponse.json({ status: 'erro', message: 'Erro ao buscar vendedores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, password, avatarId, storeId } = await request.json();

    if (!name || !password || !avatarId || !storeId) {
      return NextResponse.json({ status: 'erro', message: 'Dados incompletos para criar vendedor.' }, { status: 400 });
    }
    
    const id = uuidv4();

    const result = await conn.query(
      `INSERT INTO sellers (id, name, password, avatar_id, store_id, vendas, pa, ticket_medio, corridinha_diaria)
       VALUES ($1, $2, $3, $4, $5, 0, 0, 0, 0) RETURNING *`,
      [id, name, password, avatarId, storeId]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("[API /api/sellers] ERRO no POST:", error);
    return NextResponse.json({ status: 'erro', message: 'Erro ao criar vendedor' }, { status: 500 });
  }
}
