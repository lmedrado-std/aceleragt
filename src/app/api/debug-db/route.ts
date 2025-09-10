
import { conn } from '../../../../lib/db';
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
    // A asserção de tipo é uma boa prática em blocos catch no TypeScript
    const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
    
    return NextResponse.json({
      status: '❌ Erro na conexão',
      message: message,
    }, { status: 500 });
  }
}
