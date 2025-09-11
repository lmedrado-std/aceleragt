
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';


export async function GET() {
  try {
    const result = await conn.query('SELECT * FROM stores ORDER BY name ASC');
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('[API /api/stores] ERRO no GET:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido ao buscar lojas';
    return NextResponse.json({ status: 'erro', message }, { status: 500 });
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

        const result = await conn.query(
            'INSERT INTO stores (id, name, theme_color) VALUES ($1, $2, $3) RETURNING *',
            [id, name, themeColor]
        );

        return NextResponse.json(result.rows[0], { status: 201 });

    } catch (error) {
        console.error('[API /api/stores] ERRO no POST:', error);
        const message = error instanceof Error ? error.message : 'Erro desconhecido ao criar loja';
        return NextResponse.json({ status: 'erro', message }, { status: 500 });
    }
}
