
import { conn } from 'lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Consulta simples para pegar a hora atual do banco
    const result = await conn.query('SELECT NOW() as current_time');
    
    return NextResponse.json({
      status: '✅ Conexão com Neon OK',
      currentTime: result.rows[0].current_time,
    }, { status: 200 });

  } catch (error) {
    console.error("[API /api/debug-db] ERRO no GET:", error);
    return NextResponse.json({
      status: '❌ Erro na conexão',
      error: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido',
    }, { status: 500 });
  }
}
