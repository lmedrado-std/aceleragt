
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

async function getTableSchema(tableName: string) {
    try {
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = ${tableName}
            ORDER BY ordinal_position;
        `;
        return columns;
    } catch (e) {
        console.error(`Error fetching schema for table ${tableName}:`, e);
        // Se a tabela não existe, retorna um array vazio em vez de lançar um erro.
        // O erro comum é 'relation "..." does not exist'
        if (e instanceof Error && (e as any).code === '42P01') {
            return [];
        }
        // Se for outro tipo de erro, relança para ser tratado no handler principal.
        throw e;
    }
}

export async function GET() {
  try {
    const [stores, sellers, goals, appConfig] = await Promise.all([
      getTableSchema('stores'),
      getTableSchema('sellers'),
      getTableSchema('goals'),
      getTableSchema('app_config'),
    ]);

    return NextResponse.json({ stores, sellers, goals, app_config: appConfig });

  } catch (error) {
    console.error('[API GET /api/db-schema] ERRO:', error);
    const typedError = error as any;
    return NextResponse.json(
      {
        error: 'Erro ao buscar o schema do banco de dados.',
        details: typedError.message,
        code: typedError.code,
      },
      { status: 500 }
    );
  }
}

