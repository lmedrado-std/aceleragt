/* Semeia um banco LOCAL descartável para os testes ponta a ponta da roleta.
   Uso: DATABASE_URL=postgresql://...localhost.../aceleragt_e2e node tests/e2e/seed.cjs */
const { PrismaClient } = require('@prisma/client');

const url = process.env.DATABASE_URL || '';
if (!/localhost|127\.0\.0\.1/.test(url)) {
  console.error('Recusado: o seed só roda contra Postgres local.');
  process.exit(1);
}

const prisma = new PrismaClient();
const STORE_ID = '11111111-1111-4111-8111-111111111111';
const SELLER_ID = '22222222-2222-4222-8222-222222222222';
const SELLER2_ID = '33333333-3333-4333-8333-333333333333';

async function main() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE prize_wheel_spins, prize_wheel_segments, prize_wheel_settings, prize_wheel_credits, sellers, goals, "SellerHistory", stores, app_config CASCADE',
  );
  await prisma.stores.create({ data: { id: STORE_ID, name: 'Supermoda Teste', theme_color: '#005A73' } });
  await prisma.goals.create({ data: { store_id: STORE_ID, metaMinha: 8000, meta: 9000, metona: 10000, metaLendaria: 12000 } });
  await prisma.sellers.create({ data: { id: SELLER_ID, store_id: STORE_ID, name: 'Ana Souza', password: '1234', avatar_id: 'avatar1', vendas: 8500 } });
  await prisma.sellers.create({ data: { id: SELLER2_ID, store_id: STORE_ID, name: 'Bruno Lima', password: '1234', avatar_id: 'avatar2', vendas: 6000 } });
  const settings = await prisma.prize_wheel_settings.create({ data: { store_id: STORE_ID } });
  const segs = [
    ['R$ 10', 'money', 10, 30, '#005A73'],
    ['Tente novamente', 'retry', null, 25, '#E2E8F0'],
    ['R$ 20', 'money', 20, 15, '#00B7A8'],
    ['Folga de 1 hora', 'voucher', null, 10, '#FDE047'],
    ['R$ 50', 'money', 50, 5, '#F2446A'],
    ['Brinde surpresa', 'product', null, 10, '#7C3AED'],
    ['R$ 5', 'money', 5, 30, '#0EA5E9'],
    ['Vale-lanche', 'voucher', null, 10, '#F97316'],
  ];
  for (let i = 0; i < segs.length; i++) {
    const [label, type, value, weight, color] = segs[i];
    await prisma.prize_wheel_segments.create({
      data: { settings_id: settings.id, label, type, value, weight, color, position: i, is_active: true },
    });
  }
  // prêmio arquivado (não deve aparecer na roda)
  await prisma.prize_wheel_segments.create({
    data: { settings_id: settings.id, label: 'Prêmio antigo', type: 'money', value: 100, weight: 10, color: '#000000', position: 99, is_active: false },
  });
  const credits = Number(process.env.SEED_CREDITS || 3);
  await prisma.prize_wheel_credits.create({ data: { store_id: STORE_ID, seller_id: SELLER_ID, credits } });
  console.log(JSON.stringify({ STORE_ID, SELLER_ID, SELLER2_ID, credits }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
