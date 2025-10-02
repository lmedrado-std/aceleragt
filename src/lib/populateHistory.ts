import { prisma } from './db';

// Helper to generate a random number within a range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Main function to populate history
export async function populateHistoryForStore(storeName: string) {
  console.log(`Buscando loja: ${storeName}`);
  const store = await prisma.stores.findFirst({
    where: { name: storeName },
  });

  if (!store) {
    throw new Error(`Loja com o nome "${storeName}" não foi encontrada.`);
  }
  console.log(`Loja encontrada: ${store.id}`);

  const sellers = await prisma.sellers.findMany({
    where: { store_id: store.id },
  });

  if (sellers.length === 0) {
    throw new Error(`Nenhum vendedor encontrado para a loja "${storeName}".`);
  }
  console.log(`${sellers.length} vendedores encontrados.`);

  // Clear existing history for this store to avoid duplicates
  await prisma.SellerHistory.deleteMany({
    where: { store_id: store.id },
  });
  console.log('Histórico anterior da loja foi limpo.');

  const historyData = [];
  const today = new Date();
  const periods = [];

  // Generate the last 6 months as period names (e.g., "Maio/2024", "Abril/2024", etc.)
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const month = date.toLocaleString('pt-BR', { month: 'long' });
    const year = date.getFullYear();
    periods.push(`${month.charAt(0).toUpperCase() + month.slice(1)}/${year}`);
  }
  console.log(`Períodos gerados: ${periods.join(', ')}`);

  for (const period of periods) {
    for (const seller of sellers) {
      const vendas = random(5000, 30000);
      const pa = random(1.8, 4.5);
      const ticket_medio = vendas / random(80, 150);
      const total_prize = random(100, 1500);

      historyData.push({
        period,
        vendas,
        pa,
        ticket_medio,
        total_prize,
        seller_id: seller.id,
        seller_name: seller.name,
        store_id: store.id,
      });
    }
  }

  console.log(`Gerando ${historyData.length} registros históricos...`);
  await prisma.SellerHistory.createMany({
    data: historyData,
  });

  return {
    message: `Sucesso! ${historyData.length} registros históricos foram criados para ${sellers.length} vendedores na loja "${storeName}".`,
    periods,
  };
}
