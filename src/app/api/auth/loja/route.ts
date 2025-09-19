
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { storeId, password } = await request.json();
    if (!storeId || !password) {
      return NextResponse.json({ error: "ID e senha são obrigatórios." }, { status: 400 });
    }

    // Busque a senha da loja
    const store = await prisma.stores.findUnique({
        where: { id: parseInt(storeId, 10) },
    });

    if (!store) {
      return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });
    }
    const storePassword = store.password;

    // Busque senha global do app_config (estrutura key/value)
    const appConfig = await prisma.app_config.findUnique({
        where: { key: 'admin_password' },
    });
    const adminPassword = appConfig ? appConfig.value : "";

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
