
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Senha é obrigatória' }, { status: 400 });
    }
    
    const result = await conn.query("SELECT value FROM app_config WHERE key = 'admin_password'");

    if (result.rowCount === 0) {
        // Fallback if the key is not in the db for some reason
        return NextResponse.json({ error: 'Configuração de senha de administrador não encontrada.' }, { status: 500 });
    }
    
    const adminPassword = result.rows[0].value;

    if (password === adminPassword) {
        return NextResponse.json({ success: true });
    } else {
        return NextResponse.json({ error: 'Senha inválida' }, { status: 401 });
    }

  } catch (error) {
    console.error('[API POST /api/auth/admin] ERRO:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
