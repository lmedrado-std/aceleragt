
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, password, vendas, pa, ticketMedio, corridinhaDiaria } = body;
    
    const fieldsToUpdate = [];
    const values = [];
    let queryIndex = 1;

    if (name !== undefined) {
        fieldsToUpdate.push(`name = $${queryIndex++}`);
        values.push(name);
    }
    if (password !== undefined) {
        fieldsToUpdate.push(`password = $${queryIndex++}`);
        values.push(password);
    }
    if (vendas !== undefined) {
        fieldsToUpdate.push(`vendas = $${queryIndex++}`);
        values.push(vendas);
    }
    if (pa !== undefined) {
        fieldsToUpdate.push(`pa = $${queryIndex++}`);
        values.push(pa);
    }
    if (ticketMedio !== undefined) {
        fieldsToUpdate.push(`ticket_medio = $${queryIndex++}`);
        values.push(ticketMedio);
    }
    if (corridinhaDiaria !== undefined) {
        fieldsToUpdate.push(`corridinha_diaria = $${queryIndex++}`);
        values.push(corridinhaDiaria);
    }

    if (fieldsToUpdate.length === 0) {
      return NextResponse.json({ status: 'info', message: 'Nenhum campo para atualizar.' }, { status: 200 });
    }
    
    values.push(id);

    const result = await conn.query(
      `UPDATE sellers SET ${fieldsToUpdate.join(', ')} WHERE id = $${queryIndex} RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ status: 'erro', message: 'Vendedor não encontrado.' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });

  } catch (error) {
    console.error(`[API /api/sellers/[id]] ERRO no PUT (id: ${params.id}):`, error);
    return NextResponse.json({ status: 'erro', message: 'Erro ao atualizar vendedor.' }, { status: 500 });
  }
}


export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    
    const result = await conn.query('DELETE FROM sellers WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ status: 'erro', message: 'Vendedor não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ status: 'sucesso', message: 'Vendedor removido.' }, { status: 200 });

  } catch (error) {
    console.error(`[API /api/sellers/[id]] ERRO no DELETE (id: ${params.id}):`, error);
    return NextResponse.json({ status: 'erro', message: 'Erro ao remover vendedor.' }, { status: 500 });
  }
}
