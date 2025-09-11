
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: { storeId: string };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { storeId } = params;

    if (!storeId) {
      return NextResponse.json({ status: 'erro', message: 'O ID da loja é obrigatório.' }, { status: 400 });
    }

    const result = await conn.query('SELECT * FROM goals WHERE store_id = $1', [storeId]);
    
    if (result.rowCount === 0) {
      return NextResponse.json({ status: 'erro', message: 'Nenhuma meta encontrada para esta loja.' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
    
  } catch (error) {
    console.error(`[API /api/goals/[storeId]] ERRO no GET (storeId: ${params.storeId}):`, error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao buscar metas.';
    return NextResponse.json({ status: 'erro', message }, { status: 500 });
  }
}
