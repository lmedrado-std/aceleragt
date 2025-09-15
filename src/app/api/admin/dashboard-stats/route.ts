
import { conn } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Estas queries podem ser otimizadas para uma única consulta se a performance se tornar um problema.
    const storeCountResult = await conn.query('SELECT COUNT(*) as count FROM stores');
    const sellerCountResult = await conn.query('SELECT COUNT(*) as count FROM sellers');
    const totalSalesResult = await conn.query('SELECT SUM(vendas) as total FROM sellers');
    
    const storesDetailsResult = await conn.query(`
        SELECT 
            s.id, 
            s.name,
            COALESCE(SUM(se.vendas), 0) as total_vendas,
            COUNT(se.id) as seller_count
        FROM 
            stores s
        LEFT JOIN 
            sellers se ON s.id = se.store_id
        GROUP BY 
            s.id, s.name
        ORDER BY 
            total_vendas DESC
    `);

    const stats = {
      storeCount: parseInt(storeCountResult.rows[0].count, 10),
      sellerCount: parseInt(sellerCountResult.rows[0].count, 10),
      totalSales: parseFloat(totalSalesResult.rows[0].total) || 0,
      storesDetails: storesDetailsResult.rows,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[API GET /api/admin/dashboard-stats] ERRO:', error);
    const typedError = error as any;
    return NextResponse.json({ 
        error: 'Erro ao buscar estatísticas do dashboard.',
        details: typedError.message,
        code: typedError.code,
     }, { status: 500 });
  }
}
