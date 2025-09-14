
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const storeId = params.id;

  try {
    const result = await conn.query('SELECT * FROM stores WHERE id = $1', [storeId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(`[API GET /api/stores/${storeId}] ERRO:`, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
  }
}


export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const storeId = params.id;

  try {
    const { name, theme_color, last_incentive_calculation } = await request.json();
    
    // Build query dynamically
    const fields: string[] = [];
    const values: any[] = [];
    let queryIndex = 1;

    if (name) {
      fields.push(`name = $${queryIndex++}`);
      values.push(name);
    }
    if (theme_color) {
        fields.push(`theme_color = $${queryIndex++}`);
        values.push(theme_color);
    }
    if (last_incentive_calculation) {
        fields.push(`last_incentive_calculation = $${queryIndex++}`);
        values.push(last_incentive_calculation);
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    values.push(storeId);
    const query = `UPDATE stores SET ${fields.join(', ')} WHERE id = $${queryIndex} RETURNING *`;
    
    const result = await conn.query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Loja não encontrada para atualizar' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(`[API PUT /api/stores/${storeId}] ERRO:`, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
  }
}


export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const storeId = params.id;

  try {
    await conn.query('BEGIN');
    
    await conn.query('DELETE FROM goals WHERE store_id = $1', [storeId]);
    await conn.query('DELETE FROM sellers WHERE store_id = $1', [storeId]);
    const result = await conn.query('DELETE FROM stores WHERE id = $1', [storeId]);

    await conn.query('COMMIT');

    if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Loja não encontrada para deletar' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Loja e todos os seus dados foram removidos com sucesso' });
  } catch (error) {
    await conn.query('ROLLBACK');
    console.error(`[API DELETE /api/stores/${storeId}] ERRO:`, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
  }
}
