
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || password.length < 4) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 4 caracteres.' }, { status: 400 });
    }
    
    const query = `
      INSERT INTO app_config (key, value)
      VALUES ('admin_password', $1)
      ON CONFLICT (key) DO UPDATE
      SET value = $1;
    `;
    
    await conn.query(query, [password]);
    
    return NextResponse.json({ message: 'Senha do administrador atualizada com sucesso.' });
  } catch (error) {
    console.error('[API POST /api/admin/password] ERRO:', error);
    const typedError = error as any;
    return NextResponse.json({ 
        error: 'Erro interno do servidor ao atualizar a senha.',
        details: typedError.message,
        code: typedError.code,
     }, { status: 500 });
  }
}
