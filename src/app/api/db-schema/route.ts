
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

async function getTableSchema(tableName: string) {
    const query = `
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM 
        information_schema.columns
      WHERE 
        table_name = $1
      ORDER BY 
        ordinal_position;
    `;
    const result = await conn.query(query, [tableName]);
    return result.rows;
}

export async function GET() {
  try {
    const [storesSchema, sellersSchema, goalsSchema] = await Promise.all([
        getTableSchema('stores'),
        getTableSchema('sellers'),
        getTableSchema('goals')
    ]);

    return NextResponse.json({
        stores: storesSchema,
        sellers: sellersSchema,
        goals: goalsSchema
    });
  } catch (error) {
    console.error('[API GET /api/db-schema] ERRO:', error);
    const typedError = error as any;
    return NextResponse.json({ 
      error: 'Erro ao buscar schema do banco de dados.',
      details: typedError.message,
      code: typedError.code,
   }, { status: 500 });
  }
}
