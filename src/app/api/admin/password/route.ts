
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password || password.length < 4) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 4 caracteres.' }, { status: 400 });
    }
    
    const query = `
      UPDATE app_config
      SET value = $1
      WHERE key = 'admin_password'
      RETURNING key;
    `;
    
    const result = await conn.query(query, [password]);
    
    if (result.rowCount === 0) {
        // This case should ideally not happen if setup-db is run correctly
        await conn.query(`
            INSERT INTO app_config (key, value) VALUES ('admin_password', $1)
        `, [password]);
    }
    
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
