import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    return NextResponse.json({
      status: "❌ ERRO",
      message: "DATABASE_URL não encontrada. Configure no painel da Vercel.",
    });
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Teste 1: Verifica conexão
    const result = await pool.query("SELECT NOW()");
    // Teste 2: Mostra informações do banco
    const dbInfo = await pool.query("SELECT current_database(), current_user;");

    return NextResponse.json({
      status: "✅ Conexão com Neon funcionando",
      database: dbInfo.rows[0].current_database,
      user: dbInfo.rows[0].current_user,
      server_time: result.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "❌ Falha na conexão",
      message: error.message,
    });
  } finally {
    await pool.end();
  }
}
