
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { storeId, password } = await request.json();
    const trimmedPassword = (password || '').trim();

    if (!storeId || !trimmedPassword) {
      return NextResponse.json({ error: 'ID da loja e senha são obrigatórios' }, { status: 400 });
    }
    
    // 1. Tenta validar com a senha da loja
    const storeResult = await conn.query("SELECT password FROM stores WHERE id = $1", [storeId]);

    if (storeResult.rowCount === 0) {
        return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }
    
    const storePassword = storeResult.rows[0].password;

    // 2. Se a senha da loja falhou, tenta validar com a senha do admin global (chave mestra)
    const adminResult = await conn.query("SELECT value FROM app_config WHERE key = 'admin_password'");
    const adminPassword = adminResult.rows[0]?.value;

    console.log(
      "[AUTH LOJA] Digitada:", JSON.stringify(trimmedPassword),
      "| Salva no banco:", JSON.stringify(storePassword),
      "| Admin global (app_config):", JSON.stringify(adminPassword)
    );

    // Se a loja não tiver senha, acesso liberado
    if (storePassword === null) {
         return NextResponse.json({ success: true });
    }

    // Se a senha digitada for a da loja, acesso liberado (agora com trim e case-insensitive)
    if (storePassword && trimmedPassword.toLowerCase() === storePassword.trim().toLowerCase()) {
        return NextResponse.json({ success: true });
    }
    
    // Se a senha for a do admin global, acesso liberado
    if (adminPassword && trimmedPassword.toLowerCase() === adminPassword.trim().toLowerCase()) {
        return NextResponse.json({ success: true });
    }
    
    // 3. Se nenhuma senha for válida, nega o acesso
    return NextResponse.json({ error: 'Senha inválida' }, { status: 401 });

  } catch (error) {
    console.error('[API POST /api/auth/loja] ERRO:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
