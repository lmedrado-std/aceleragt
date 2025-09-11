
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: { id: string };
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const { name, password, vendas, pa, ticketMedio, corridinhaDiaria } = await request.json();

    if (!name || !password) {
      return NextResponse.json({ status: 'erro', message: 'Nome e senha são obrigatórios.' }, { status: 400 });
    }
    
    // Constrói a query dinamicamente para atualizar apenas os campos fornecidos
    const fieldsToUpdate = [];
    const values = [];
    let queryIndex = 1;

    if (name) {
        fieldsToUpdate.push(`name = $${queryIndex++}`);
        values.push(name);
    }
    if (password) {
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
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao atualizar vendedor.';
    return NextResponse.json({ status: 'erro', message }, { status: 500 });
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
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao remover vendedor.';
    return NextResponse.json({ status: 'erro', message }, { status: 500 });
  }
}
