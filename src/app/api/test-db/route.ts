import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  try {
    const result = await pool.query("SELECT NOW()");
    return NextResponse.json({
      status: "✅ Conectado ao Neon",
      current_time: result.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "❌ Erro ao conectar",
      message: error.message,
    });
  }
}
