
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();

    return NextResponse.json({
      status: "✅ Conexão com Neon funcionando",
      database: process.env.DATABASE_URL?.split("/").pop()?.split("?")[0],
      server_time: result.rows[0].now,
    });
  } catch (error: any) {
    console.error("[API /api/db-status] ERRO no GET:", error);
    return NextResponse.json(
      {
        status: "❌ Erro ao conectar ao banco",
        error: error instanceof Error ? error.message : "Erro interno desconhecido"
      },
      { status: 500 }
    );
  }
}
