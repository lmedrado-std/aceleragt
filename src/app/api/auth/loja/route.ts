
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { storeId, password } = await request.json();

    if (!storeId || password === undefined) {
      return NextResponse.json({ error: 'ID da loja e senha são obrigatórios' }, { status: 400 });
    }
    
    const result = await conn.query("SELECT password FROM stores WHERE id = $1", [storeId]);

    if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }
    
    const storePassword = result.rows[0].password;

    // A null password means the store is not password protected.
    if (storePassword === null) {
         return NextResponse.json({ success: true });
    }

    if (password === storePassword) {
        return NextResponse.json({ success: true });
    } else {
        return NextResponse.json({ error: 'Senha inválida' }, { status: 401 });
    }

  } catch (error) {
    console.error('[API POST /api/auth/loja] ERRO:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
