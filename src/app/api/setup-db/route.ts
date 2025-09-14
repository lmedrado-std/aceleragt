
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await conn.query('BEGIN');

    // Tabela de Lojas
    await conn.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        theme_color VARCHAR(50),
        last_incentive_calculation TIMESTAMPTZ
      );
    `);

    // Tabela de Vendedores
    await conn.query(`
      CREATE TABLE IF NOT EXISTS sellers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar_id VARCHAR(50) NOT NULL,
        vendas NUMERIC(10, 2) DEFAULT 0,
        pa NUMERIC(5, 2) DEFAULT 0,
        ticket_medio NUMERIC(10, 2) DEFAULT 0,
        corridinha_diaria NUMERIC(10, 2) DEFAULT 0,
        store_id UUID REFERENCES stores(id) ON DELETE CASCADE
      );
    `);

    // Tabela de Metas
    await conn.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
        "metaMinha" NUMERIC(10, 2) DEFAULT 0,
        "metaMinhaPrize" NUMERIC(10, 2) DEFAULT 0,
        "meta" NUMERIC(10, 2) DEFAULT 0,
        "metaPrize" NUMERIC(10, 2) DEFAULT 0,
        "metona" NUMERIC(10, 2) DEFAULT 0,
        "metonaPrize" NUMERIC(10, 2) DEFAULT 0,
        "metaLendaria" NUMERIC(10, 2) DEFAULT 0,
        "legendariaBonusValorVenda" NUMERIC(10, 2) DEFAULT 0,
        "legendariaBonusValorPremio" NUMERIC(10, 2) DEFAULT 0,
        "paGoal1" NUMERIC(5, 2) DEFAULT 0,
        "paPrize1" NUMERIC(10, 2) DEFAULT 0,
        "paGoal2" NUMERIC(5, 2) DEFAULT 0,
        "paPrize2" NUMERIC(10, 2) DEFAULT 0,
        "paGoal3" NUMERIC(5, 2) DEFAULT 0,
        "paPrize3" NUMERIC(10, 2) DEFAULT 0,
        "paGoal4" NUMERIC(5, 2) DEFAULT 0,
        "paPrize4" NUMERIC(10, 2) DEFAULT 0,
        "ticketMedioGoal1" NUMERIC(10, 2) DEFAULT 0,
        "ticketMedioPrize1" NUMERIC(10, 2) DEFAULT 0,
        "ticketMedioGoal2" NUMERIC(10, 2) DEFAULT 0,
        "ticketMedioPrize2" NUMERIC(10, 2) DEFAULT 0,
        "ticketMedioGoal3" NUMERIC(10, 2) DEFAULT 0,
        "ticketMedioPrize3" NUMERIC(10, 2) DEFAULT 0,
        "ticketMedioGoal4" NUMERIC(10, 2) DEFAULT 0,
        "ticketMedioPrize4" NUMERIC(10, 2) DEFAULT 0
      );
    `);

    await conn.query('COMMIT');
    return NextResponse.json({ message: 'Banco de dados configurado com sucesso!' }, { status: 200 });

  } catch (error) {
    await conn.query('ROLLBACK');
    console.error('[API /api/setup-db] ERRO:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
  }
}
