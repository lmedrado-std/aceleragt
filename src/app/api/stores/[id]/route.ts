
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
      return NextResponse.json({ error: 'O nome é obrigatório.' }, { status: 400 });
    }

    const result = await conn.query(
      'UPDATE stores SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error) {
    console.error(`[API /api/stores/[id]] ERRO no PUT (id: ${params.id}):`, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao atualizar a loja.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
       return NextResponse.json({ error: 'O ID da loja é inválido.' }, { status: 400 });
    }

    // Iniciar uma transação para garantir a integridade dos dados
    await conn.query('BEGIN');

    // Deletar metas, vendedores e depois a loja
    await conn.query('DELETE FROM goals WHERE store_id = $1', [id]);
    await conn.query('DELETE FROM sellers WHERE store_id = $1', [id]);
    const result = await conn.query('DELETE FROM stores WHERE id = $1', [id]);
    
    // Commit da transação se tudo ocorreu bem
    await conn.query('COMMIT');


    if (result.rowCount === 0) {
      // Mesmo que o commit tenha ocorrido, se nenhuma loja foi deletada, informamos.
      // O rollback aqui não é necessário, pois o commit já finalizou a transação.
      return NextResponse.json({ error: 'Loja não encontrada.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Loja e todos os seus dados foram removidos.' }, { status: 200 });

  } catch (error) {
    // Se qualquer um dos comandos falhar, faz o rollback
    await conn.query('ROLLBACK');
    console.error(`[API /api/stores/[id]] ERRO no DELETE (id: ${params.id}):`, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro ao remover a loja.' }, { status: 500 });
  }
}
