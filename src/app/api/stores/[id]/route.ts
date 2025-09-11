
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ status: 'erro', message: 'O nome é obrigatório.' }, { status: 400 });
    }

    const result = await conn.query(
      'UPDATE stores SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ status: 'erro', message: 'Loja não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error(`[API /api/stores/[id]] ERRO no PUT (id: ${params.id}):`, error);
    return NextResponse.json({ status: 'erro', message: 'Erro ao atualizar a loja.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    // Iniciar uma transação para garantir a integridade dos dados
    await conn.query('BEGIN');
    // Deletar metas, vendedores e depois a loja
    await conn.query('DELETE FROM goals WHERE store_id = $1', [id]);
    await conn.query('DELETE FROM sellers WHERE store_id = $1', [id]);
    const result = await conn.query('DELETE FROM stores WHERE id = $1', [id]);
    await conn.query('COMMIT');


    if (result.rowCount === 0) {
       await conn.query('ROLLBACK');
      return NextResponse.json({ status: 'erro', message: 'Loja não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ status: 'sucesso', message: 'Loja e todos os seus dados foram removidos.' }, { status: 200 });

  } catch (error) {
    await conn.query('ROLLBACK');
    console.error(`[API /api/stores/[id]] ERRO no DELETE (id: ${params.id}):`, error);
    return NextResponse.json({ status: 'erro', message: 'Erro ao remover a loja.' }, { status: 500 });
  }
}
