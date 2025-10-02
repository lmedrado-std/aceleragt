'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, ArrowLeft, Store, Users, DollarSign, History, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ClientOnly from '@/components/client-only';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/app-layout';

// --- INTERFACES ---
interface StoreDetail { id: string; name: string; total_vendas: number; seller_count: number; }
interface DashboardStats { storeCount: number; sellerCount: number; totalSales: number; storesDetails: StoreDetail[]; }
interface ArchivedPeriod { period: string; storeId: string; sellerCount: number; }
interface SellerHistoryDetail { id: string; period: string; seller_id: string; seller_name: string; vendas: number; pa: number; ticket_medio: number; total_prize: number; }
interface PeriodComparisonData { current: SellerHistoryDetail[]; previous: SellerHistoryDetail[]; }

// --- HELPER FUNCTIONS & COMPONENTS ---
const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

// Componente de Comparação (sugerido pelo usuário)
function Comparison({ current, previous, format }: { current: number; previous: number | undefined; format?: (n: number) => string; }) {
  if (previous == null) return null;
  const diff = current - previous;
  if(diff === 0 && current === 0) return null; // Don't show if both are zero
  const percent = previous === 0 ? (current > 0 ? 100.0 : 0) : (diff / previous) * 100;
  const isUp = diff > 0;
  const isDown = diff < 0;

  let color = 'text-muted-foreground';
  if (isUp) color = 'text-green-600';
  if (isDown) color = 'text-red-600';

  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;

  return (
    <span className={`ml-2 text-xs font-mono flex items-center gap-1 ${color}`}>
      <Icon className="w-3 h-3" />
      {previous === 0 && current > 0 ? 'Novo' : `${percent.toFixed(0)}%`}
    </span>
  );
}

// --- ARCHIVED PERIODS COMPONENT ---
function ArchivedPeriods() {
    const [periods, setPeriods] = useState<ArchivedPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<Record<string, PeriodComparisonData>>({});
    const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    useEffect(() => {
        const fetchPeriods = async () => {
            try {
                const res = await fetch('/api/history');
                if (!res.ok) throw new Error('Falha ao buscar histórico de períodos.');
                setPeriods(await res.json());
            } catch (e) {
                toast({ variant: 'destructive', title: 'Erro', description: e instanceof Error ? e.message : 'Não foi possível carregar o histórico.' });
            } finally {
                setLoading(false);
            }
        };
        fetchPeriods();
    }, [toast]);

    const handleAccordionChange = async (value: string) => {
        if (!value || details[value]) return;

        const [period, storeId] = value.split('|');
        setLoadingDetails(prev => ({ ...prev, [value]: true }));
        try {
            const res = await fetch(`/api/history?period=${encodeURIComponent(period)}&storeId=${storeId}`);
            if (!res.ok) throw new Error(`Falha ao buscar detalhes para o período ${period}.`);
            setDetails(prev => ({ ...prev, [value]: await res.json() }));
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erro', description: e instanceof Error ? e.message : 'Não foi possível carregar os detalhes.' });
        } finally {
            setLoadingDetails(prev => ({ ...prev, [value]: false }));
        }
    };

    if (loading) return <div className="flex items-center justify-center h-24"><Loader2 className="mr-2 h-8 w-8 animate-spin" /><p>Carregando histórico...</p></div>;
    if (periods.length === 0) return (
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><History /> Histórico de Períodos</CardTitle></CardHeader><CardContent><p className='text-muted-foreground'>Nenhum período foi arquivado ainda.</p></CardContent></Card>
    );

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><History /> Histórico de Períodos</CardTitle><CardDescription>Consulte e compare o desempenho de vendedores em períodos anteriores.</CardDescription></CardHeader>
            <CardContent>
                <Accordion type="single" collapsible onValueChange={handleAccordionChange}>
                    {periods.map(({ period, storeId, sellerCount }) => {
                        const value = `${period}|${storeId}`;
                        const periodData = details[value];
                        const previousDataMap = periodData?.previous.reduce((acc, seller) => { acc[seller.seller_id] = seller; return acc; }, {} as Record<string, SellerHistoryDetail>);

                        return (
                            <AccordionItem value={value} key={value}>
                                <AccordionTrigger><div className='flex justify-between w-full pr-4'><span>{period}</span><span className='text-muted-foreground'>{`Vendedores: ${sellerCount}`}</span></div></AccordionTrigger>
                                <AccordionContent>
                                    {loadingDetails[value] && <div className="flex items-center justify-center p-4"><Loader2 className="mr-2 h-6 w-6 animate-spin" /><span>Carregando...</span></div>}
                                    {periodData?.current && (
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Vendedor</TableHead><TableHead className="text-right">Vendas</TableHead><TableHead className="text-right hidden sm:table-cell">PA</TableHead><TableHead className="text-right hidden sm:table-cell">Ticket Médio</TableHead><TableHead className="text-right">Prêmio</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {periodData.current.map(seller => {
                                                    const prev = previousDataMap?.[seller.seller_id];
                                                    return (
                                                        <TableRow key={seller.id}>
                                                            <TableCell className="font-medium">{seller.seller_name}</TableCell>
                                                            <TableCell className="text-right"><div className='flex items-center justify-end'>{formatCurrency(seller.vendas)}<Comparison current={seller.vendas} previous={prev?.vendas} /></div></TableCell>
                                                            <TableCell className="text-right hidden sm:table-cell"><div className='flex items-center justify-end'>{seller.pa}<Comparison current={seller.pa} previous={prev?.pa} /></div></TableCell>
                                                            <TableCell className="text-right hidden sm:table-cell"><div className='flex items-center justify-end'>{formatCurrency(seller.ticket_medio)}<Comparison current={seller.ticket_medio} previous={prev?.ticket_medio} /></div></TableCell>
                                                            <TableCell className="text-right font-semibold"><div className={`flex items-center justify-end ${seller.total_prize > 0 ? 'text-green-600' : ''}`}>{formatCurrency(seller.total_prize)}<Comparison current={seller.total_prize} previous={prev?.total_prize} /></div></TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
}

// --- MAIN DASHBOARD COMPONENT ---
function GlobalDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/dashboard-stats');
                if (!res.ok) throw new Error((await res.json()).details || 'Falha ao buscar estatísticas.');
                setStats(await res.json());
            } catch (e) {
                toast({ variant: 'destructive', title: 'Erro', description: e instanceof Error ? e.message : 'Não foi possível carregar o dashboard.' });
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [toast]);
    
    if (loading) return <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin" /><p className='mt-4 text-muted-foreground'>Carregando...</p></div>;
    if (!stats) return (
        <Card className="border-destructive"><CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> Erro</CardTitle></CardHeader><CardContent><p>Não foi possível carregar os dados do dashboard.</p></CardContent></Card>
    );

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div><h1 className="text-3xl font-bold">Dashboard Geral</h1><p className="text-muted-foreground">Visão consolidada de todas as lojas.</p></div>
                 <Button asChild variant="outline"><Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link></Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Vendas Totais</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Lojas</CardTitle><Store className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.storeCount}</div></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total de Vendedores</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.sellerCount}</div></CardContent></Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Desempenho por Loja</CardTitle><CardDescription>Ranking de lojas por total de vendas.</CardDescription></CardHeader>
                <CardContent>
                    <Table><TableHeader><TableRow><TableHead className="w-[60%]">Loja</TableHead><TableHead className="text-center hidden sm:table-cell">Vendedores</TableHead><TableHead className="text-right">Vendas</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {stats.storesDetails.map((store) => (
                                <TableRow key={store.id}><TableCell className="font-medium">{store.name}</TableCell><TableCell className="text-center hidden sm:table-cell">{store.seller_count}</TableCell><TableCell className="text-right font-semibold">{formatCurrency(store.total_vendas)}</TableCell></TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ArchivedPeriods />

        </div>
    );
}

// --- PAGE EXPORT ---
export default function GlobalDashboardPage() {
    return (
        <ClientOnly>
            <AppLayout>
              <GlobalDashboard />
            </AppLayout>
        </ClientOnly>
    );
}
