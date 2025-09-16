
import { conn } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { id, password } = await request.json();

    if (!id || !password) {
      return NextResponse.json({ error: 'ID da loja e senha são obrigatórios' }, { status: 400 });
    }

    const result = await conn.query('SELECT password FROM stores WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    const storedPasswordHash = result.rows[0].password;

    // Se a senha armazenada for nula ou não for um hash válido, negue o acesso.
    if (!storedPasswordHash || !storedPasswordHash.startsWith('$2a')) { // bcrypt hashes começam com $2a$, $2b$, ou $2y$
        return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const isPasswordCorrect = await bcrypt.compare(password, storedPasswordHash);

    if (isPasswordCorrect) {
      // Login bem-sucedido
      return NextResponse.json({ message: 'Login bem-sucedido' });
    } else {
      // Senha incorreta
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

  } catch (error) {
    console.error('[API POST /api/auth/loja] ERRO:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
