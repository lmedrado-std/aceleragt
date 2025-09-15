
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const sellerId = params.id;

  try {
    const body = await request.json();
    const { name, password, vendas, pa, ticket_medio, corridinha_diaria } = body;

    const fields: string[] = [];
    const values: any[] = [];
    let queryIndex = 1;

    if (name !== undefined) { fields.push(`name = $${queryIndex++}`); values.push(name); }
    if (password !== undefined) { fields.push(`password = $${queryIndex++}`); values.push(password); }
    if (vendas !== undefined) { fields.push(`vendas = $${queryIndex++}`); values.push(vendas); }
    if (pa !== undefined) { fields.push(`pa = $${queryIndex++}`); values.push(pa); }
    if (ticket_medio !== undefined) { fields.push(`"ticket_medio" = $${queryIndex++}`); values.push(ticket_medio); }
    if (corridinha_diaria !== undefined) { fields.push(`"corridinha_diaria" = $${queryIndex++}`); values.push(corridinha_diaria); }
    
    if (fields.length === 0) {
      return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    values.push(sellerId);
    const query = `UPDATE sellers SET ${fields.join(', ')} WHERE id = $${queryIndex} RETURNING *`;
    
    const result = await conn.query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error(`[API PUT /api/sellers/${sellerId}] ERRO:`, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const sellerId = params.id;
    try {
        const result = await conn.query('DELETE FROM sellers WHERE id = $1', [sellerId]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Vendedor não encontrado' }, { status: 404 });
        }
        
        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error) {
        console.error(`[API DELETE /api/sellers/${sellerId}] ERRO:`, error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
    }
}
