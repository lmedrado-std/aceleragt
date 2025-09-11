
import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function GET() {
  try {
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("[API /api/status] ERRO no GET:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Erro interno desconhecido",
      },
      { status: 500 }
    );
  }
}
