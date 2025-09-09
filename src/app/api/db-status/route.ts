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
    return NextResponse.json(
      {
        status: "❌ Erro ao conectar ao banco",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
