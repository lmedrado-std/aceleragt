
import { NextRequest, NextResponse } from "next/server";
import { conn } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { storeId, password } = await request.json();
    if (!storeId || !password) {
      return NextResponse.json({ error: "ID e senha são obrigatórios." }, { status: 400 });
    }

    // Busque a senha da loja
    const storeRes = await conn.query(
      'SELECT password FROM stores WHERE id = $1',
      [storeId]
    );
    if (storeRes.rowCount === 0) {
      return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });
    }
    const storePassword = storeRes.rows[0].password;

    // Busque senha global do app_config (estrutura key/value)
    const appConfigRes = await conn.query(
      "SELECT value FROM app_config WHERE key = 'admin_password' LIMIT 1"
    );
    const adminPassword = appConfigRes.rowCount > 0 ? appConfigRes.rows[0].value : "";

    // 1. Verificação com senha global
    if (adminPassword && password === adminPassword) {
      return NextResponse.json({ success: true, admin: true, method: "global" });
    }

    // 2. Verificação retrocompatível: senha da loja pode ser hash ou texto plano
    let lojaOK = false;
    if (storePassword && (storePassword.startsWith("$2a$") || storePassword.startsWith("$2b$"))) {
      // bcrypt hash
      lojaOK = bcrypt.compareSync(password, storePassword);
    } else {
      // texto puro (legado)
      lojaOK = password === storePassword;
    }

    if (lojaOK) {
      return NextResponse.json({ success: true, admin: false, method: "loja" });
    }

    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  } catch (error) {
    console.error("Erro no login da loja:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
