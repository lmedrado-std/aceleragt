
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  try {
    const client = await pool.connect();

    // Testando conexão e pegando hora do servidor
    const timeResult = await client.query("SELECT NOW()");

    // Exemplo: contar registros de uma tabela chamada "usuarios"
    // Altere conforme o nome da sua tabela
    const userCountResult = await client.query("SELECT COUNT(*) FROM usuarios");

    // Exemplo: contar registros de produtos, se existir
    const productCountResult = await client.query("SELECT COUNT(*) FROM produtos");

    client.release();

    return NextResponse.json({
      status: "✅ Conexão com Neon funcionando",
      database: process.env.DATABASE_URL?.split("/").pop()?.split("?")[0],
      server_time: timeResult.rows[0].now,
      tables: {
        usuarios: Number(userCountResult.rows[0].count),
        produtos: Number(productCountResult.rows[0].count),
      },
    });
  } catch (error: any) {
    console.error("[API /api/db-dashboard] ERRO no GET:", error);
    return NextResponse.json(
      {
        status: "❌ Erro ao conectar ao banco",
        error: error instanceof Error ? error.message : 'Erro interno desconhecido'
      },
      { status: 500 }
    );
  }
}
