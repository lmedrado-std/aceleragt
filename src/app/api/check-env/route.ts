import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    database_url: process.env.DATABASE_URL ? "✅ Variável encontrada" : "❌ Variável não encontrada",
    env: process.env.NODE_ENV,
  });
}
