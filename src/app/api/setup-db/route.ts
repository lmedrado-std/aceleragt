
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Tabela de Lojas
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS stores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        password TEXT,
        theme_color TEXT,
        last_incentive_calculation TIMESTAMPTZ
      );
    `);

    // Tabela de Vendedores
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS sellers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255),
        avatar_id VARCHAR(50),
        vendas NUMERIC(10, 2) DEFAULT 0,
        pa NUMERIC(5, 2) DEFAULT 0,
        ticket_medio NUMERIC(10, 2) DEFAULT 0,
        corridinha_diaria NUMERIC(10, 2) DEFAULT 0,
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        last_viewed_at TIMESTAMPTZ,
        view_count INTEGER DEFAULT 0
      );
    `);

    // Tabela de Metas
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE UNIQUE,
        "metaMinha" INTEGER DEFAULT 0,
        "metaMinhaPrize" INTEGER DEFAULT 0,
        meta INTEGER DEFAULT 0,
        "metaPrize" INTEGER DEFAULT 0,
        metona INTEGER DEFAULT 0,
        "metonaPrize" INTEGER DEFAULT 0,
        "metaLendaria" INTEGER DEFAULT 0,
        "legendariaBonusValorVenda" INTEGER DEFAULT 0,
        "legendariaBonusValorPremio" INTEGER DEFAULT 0,
        "performanceBonusEnabled" BOOLEAN DEFAULT FALSE,
        "paGoal1" REAL DEFAULT 0,
        "paPrize1" INTEGER DEFAULT 0,
        "paGoal2" REAL DEFAULT 0,
        "paPrize2" INTEGER DEFAULT 0,
        "paGoal3" REAL DEFAULT 0,
        "paPrize3" INTEGER DEFAULT 0,
        "paGoal4" REAL DEFAULT 0,
        "paPrize4" INTEGER DEFAULT 0,
        "ticketMedioGoal1" INTEGER DEFAULT 0,
        "ticketMedioPrize1" INTEGER DEFAULT 0,
        "ticketMedioGoal2" INTEGER DEFAULT 0,
        "ticketMedioPrize2" INTEGER DEFAULT 0,
        "ticketMedioGoal3" INTEGER DEFAULT 0,
        "ticketMedioPrize3" INTEGER DEFAULT 0,
        "ticketMedioGoal4" INTEGER DEFAULT 0,
        "ticketMedioPrize4" INTEGER DEFAULT 0
      );
    `);
    
    // Tabela de Histórico de Vendedores
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SellerHistory" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          period TEXT NOT NULL,
          vendas NUMERIC(10, 2) NOT NULL,
          pa NUMERIC(5, 2) NOT NULL,
          ticket_medio NUMERIC(10, 2) NOT NULL,
          total_prize NUMERIC(10, 2) NOT NULL,
          seller_id UUID NOT NULL,
          seller_name TEXT NOT NULL,
          store_id UUID NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);


    // Tabela de Configurações do Aplicativo
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS app_config (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT
      );
    `);
    
    // --- TABELAS DA ROLETA DE PRÊMIOS ---
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PrizeWheelSettings" (
        id TEXT NOT NULL PRIMARY KEY,
        "store_id" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PrizeWheelSegment" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "settingsId" TEXT NOT NULL,
          label TEXT NOT NULL,
          type TEXT NOT NULL,
          value DECIMAL(10,2),
          description TEXT,
          weight INTEGER NOT NULL DEFAULT 10,
          color TEXT NOT NULL DEFAULT '#3B82F6',
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          position INTEGER NOT NULL,
          CONSTRAINT "PrizeWheelSegment_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "PrizeWheelSettings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PrizeWheelCredits" (
          id TEXT NOT NULL PRIMARY KEY,
          "store_id" TEXT NOT NULL,
          "seller_id" TEXT NOT NULL,
          credits INTEGER NOT NULL DEFAULT 0,
          "updatedAt" TIMESTAMP(3) NOT NULL
      );
    `);
     await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "PrizeWheelCredits_store_id_seller_id_key" ON "PrizeWheelCredits"("store_id", "seller_id");
     `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PrizeWheelSpins" (
          id TEXT NOT NULL PRIMARY KEY,
          "store_id" TEXT NOT NULL,
          "seller_id" TEXT NOT NULL,
          "grantedBy" TEXT NOT NULL,
          "segmentId" UUID NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "claimedAt" TIMESTAMP(3),
          CONSTRAINT "PrizeWheelSpins_segmentId_fkey" FOREIGN KEY ("segmentId") REFERENCES "PrizeWheelSegment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
    `);
    
    // --- TABELAS DE RESTRIÇÃO DE LOGIN ---
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS loja_restricao (
        id SERIAL PRIMARY KEY,
        loja_id TEXT NOT NULL,
        modo VARCHAR(10) NOT NULL DEFAULT 'OU', -- 'E' ou 'OU'
        criado_em TIMESTAMPTZ DEFAULT now(),
        alterado_em TIMESTAMPTZ DEFAULT now()
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS loja_area_permitida (
        id SERIAL PRIMARY KEY,
        loja_id TEXT NOT NULL,
        nome VARCHAR(128) NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        raio INTEGER NOT NULL, -- metros
        descricao TEXT,
        ativo BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS loja_wifi_permitido (
        id SERIAL PRIMARY KEY,
        loja_id TEXT NOT NULL,
        nome VARCHAR(128) NOT NULL,
        ssid VARCHAR(128) NOT NULL,
        descricao TEXT,
        ativo BOOLEAN NOT NULL DEFAULT TRUE
      );
    `);


    // Inserir senha de admin padrão, se não existir
    await prisma.$executeRawUnsafe(`
      INSERT INTO app_config (key, value)
      VALUES ('admin_password', 'supermoda')
      ON CONFLICT (key) DO NOTHING;
    `);

    // Adicionar a coluna performanceBonusEnabled se ela não existir
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE goals ADD COLUMN "performanceBonusEnabled" BOOLEAN DEFAULT FALSE;
      `);
    } catch (e) {
      // Ignora o erro se a coluna já existir
      if (e instanceof Error && e.message.includes('column "performanceBonusEnabled" of relation "goals" already exists')) {
        // A coluna já existe, tudo bem.
      } else {
        throw e;
      }
    }
    
    // Adicionar a coluna last_viewed_at se ela não existir
    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE sellers ADD COLUMN "last_viewed_at" TIMESTAMPTZ;
        `);
    } catch (e) {
        if (e instanceof Error && e.message.includes('column "last_viewed_at" of relation "sellers" already exists')) {
            // Coluna já existe
        } else {
            throw e;
        }
    }

    // Adicionar a coluna view_count se ela não existir
    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE sellers ADD COLUMN "view_count" INTEGER DEFAULT 0;
        `);
    } catch (e) {
        if (e instanceof Error && e.message.includes('column "view_count" of relation "sellers" already exists')) {
            // Coluna já existe
        } else {
            throw e;
        }
    }

     // Adicionar a coluna created_at se ela não existir na SellerHistory
    try {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "SellerHistory" ADD COLUMN "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
        `);
    } catch (e) {
        if (e instanceof Error && e.message.includes('column "created_at" of relation "SellerHistory" already exists')) {
            // Coluna já existe
        } else {
            throw e;
        }
    }


    return NextResponse.json({ message: 'Banco de dados configurado com sucesso! Tabelas da Roleta de Prêmios, Restrições de Login e outras foram verificadas/criadas.' }, { status: 200 });

  } catch (error) {
    console.error('[API /api/setup-db] ERRO:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
  }
}
