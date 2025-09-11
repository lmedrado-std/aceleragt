
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';


export async function GET() {
  try {
    const result = await conn.query('SELECT * FROM stores ORDER BY name ASC');
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('[API /api/stores] ERRO no GET:', error);
    return NextResponse.json({ status: 'erro', message: 'Erro ao buscar lojas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ status: 'erro', message: 'O nome da loja é obrigatório.' }, { status: 400 });
        }

        const id = uuidv4();
        // Gera uma cor HSL aleatória com boa saturação e luminosidade
        const themeColor = `${Math.floor(Math.random() * 360)}, 70%, 60%`;

        const storeResult = await conn.query(
            'INSERT INTO stores (id, name, theme_color) VALUES ($1, $2, $3) RETURNING *',
            [id, name, themeColor]
        );
        
        // Também cria uma entrada de metas padrão para a nova loja
        await conn.query(
          'INSERT INTO goals (store_id) VALUES ($1)',
          [id]
        );


        return NextResponse.json(storeResult.rows[0], { status: 201 });

    } catch (error) {
        console.error('[API /api/stores] ERRO no POST:', error);
        return NextResponse.json({ status: 'erro', message: 'Erro ao criar loja' }, { status: 500 });
    }
}
