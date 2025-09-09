
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadStateFromStorage, AppState, Seller, Incentives } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, DollarSign, Users, Award, Trophy, BarChartHorizontal } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';


type SellerWithStore = Seller & { storeName: string; totalIncentives: number };
type StorePerformance = {
    id: string;
    name: string;
    totalSales: number;
    totalIncentives: number;
    sellerCount: number;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);


export default function AdminDashboardPage() {
    const [state, setState] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const isAdmin = sessionStorage.getItem('adminAuthenticated') === 'true';
        if (!isAdmin) {
            router.push('/login?redirect=/admin/dashboard');
        } else {
            setState(loadStateFromStorage());
            setLoading(false);
        }
    }, [router]);

    const {
        totalSales,
        totalIncentives,
        totalSellers,
        topSellersBySales,
        topSellersByIncentives,
        storePerformance,
    } = useMemo(() => {
        if (!state) {
            return {
                totalSales: 0,
                totalIncentives: 0,
                totalSellers: 0,
                topSellersBySales: [],
                topSellersByIncentives: [],
                storePerformance: [],
            };
        }

        let allSellers: SellerWithStore[] = [];

        const storePerformanceData = state.stores.map(store => {
            const storeSellers = state.sellers[store.id] || [];
            const storeIncentives = state.incentives[store.id] || {};
            
            let storeTotalSales = 0;
            let storeTotalIncentives = 0;

            storeSellers.forEach(seller => {
                const sellerIncentives = storeIncentives[seller.id];
                const sellerTotalIncentives = sellerIncentives 
                    ? Object.values(sellerIncentives).reduce((sum, val) => sum + (Number(val) || 0), 0)
                    : 0;

                storeTotalSales += Number(seller.vendas) || 0;
                storeTotalIncentives += sellerTotalIncentives;

                allSellers.push({
                    ...seller,
                    vendas: Number(seller.vendas) || 0,
                    storeName: store.name,
                    totalIncentives: sellerTotalIncentives,
                });
            });

            return {
                id: store.id,
                name: store.name,
                totalSales: storeTotalSales,
                totalIncentives: storeTotalIncentives,
                sellerCount: storeSellers.length,
            };
        });

        const globalTotalSales = storePerformanceData.reduce((sum, s) => sum + s.totalSales, 0);
        const globalTotalIncentives = storePerformanceData.reduce((sum, s) => sum + s.totalIncentives, 0);

        const sortedBySales = [...allSellers].sort((a, b) => b.vendas - a.vendas).slice(0, 5);
        const sortedByIncentives = [...allSellers].sort((a, b) => b.totalIncentives - a.totalIncentives).slice(0, 5);

        return {
            totalSales: globalTotalSales,
            totalIncentives: globalTotalIncentives,
            totalSellers: allSellers.length,
            topSellersBySales: sortedBySales,
            topSellersByIncentives: sortedByIncentives,
            storePerformance: storePerformanceData.sort((a,b) => b.totalSales - a.totalSales),
        };

    }, [state]);


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
            </div>
        );
    }
    
    return (
        <main className="flex flex-col items-center min-h-screen bg-background p-4 sm:p-8 relative">
            <div className="absolute top-4 left-4">
                <Button asChild variant="outline">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Admin Global
                    </Link>
                </Button>
            </div>
            <div className="flex flex-col items-center gap-6 w-full max-w-7xl">
                
                <h1 className="text-4xl font-bold font-headline text-primary text-center mt-12 sm:mt-0">
                    Dashboard Geral
                </h1>
                <p className="text-lg text-muted-foreground text-center max-w-2xl">
                    Visão consolidada do desempenho de todas as lojas, com rankings e comparativos.
                </p>

                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3 w-full mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
                        <p className="text-xs text-muted-foreground">Soma de todas as lojas</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ganhos Totais (Prêmios)</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalIncentives)}</div>
                         <p className="text-xs text-muted-foreground">Soma de todos os prêmios e bônus</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Vendedores</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">{totalSellers}</div>
                        <p className="text-xs text-muted-foreground">Em todas as lojas ativas</p>
                        </CardContent>
                    </Card>
                </div>
                
                 <Card className="w-full mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChartHorizontal className="text-primary" />
                            Comparativo de Vendas por Loja
                        </CardTitle>
                        <CardDescription>Análise do desempenho de vendas de cada loja.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={{
                            totalSales: {
                                label: "Vendas",
                                color: "hsl(var(--primary))",
                            },
                         }} className="min-h-[250px] w-full">
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart layout="vertical" data={storePerformance} margin={{ right: 20 }}>
                                    <XAxis type="number" dataKey="totalSales" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={150} />
                                    <Tooltip 
                                        cursor={{fill: 'hsl(var(--muted))'}}
                                        content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} hideLabel />}
                                    />
                                    <Bar dataKey="totalSales" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>


                <div className="grid md:grid-cols-2 gap-6 w-full mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Trophy className="text-amber-500" /> Top 5 Vendedores (Vendas)</CardTitle>
                            <CardDescription>Quem mais vendeu em valor monetário.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    <TableHead>Vendedor</TableHead>
                                    <TableHead>Loja</TableHead>
                                    <TableHead className="text-right">Vendas</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topSellersBySales.map((seller, index) => (
                                        <TableRow key={seller.id}>
                                            <TableCell className="font-bold">{index + 1}</TableCell>
                                            <TableCell>{seller.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{seller.storeName}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(seller.vendas)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Award className="text-green-500" /> Top 5 Vendedores (Ganhos)</CardTitle>
                            <CardDescription>Quem mais ganhou em prêmios e bônus.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    <TableHead>Vendedor</TableHead>
                                    <TableHead>Loja</TableHead>
                                    <TableHead className="text-right">Ganhos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {topSellersByIncentives.map((seller, index) => (
                                        <TableRow key={seller.id}>
                                            <TableCell className="font-bold">{index + 1}</TableCell>
                                            <TableCell>{seller.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{seller.storeName}</TableCell>
                                            <TableCell className="text-right font-semibold">{formatCurrency(seller.totalIncentives)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                 <Card className="w-full mt-6">
                        <CardHeader>
                            <CardTitle>Desempenho Detalhado por Loja</CardTitle>
                            <CardDescription>Uma visão completa do desempenho de cada unidade de negócio.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Loja</TableHead>
                                    <TableHead className="text-center">Vendedores</TableHead>
                                    <TableHead>Vendas Totais</TableHead>
                                    <TableHead className="text-right">Ganhos Totais (Prêmios)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {storePerformance.map((store) => (
                                        <TableRow key={store.id}>
                                            <TableCell className="font-medium">{store.name}</TableCell>
                                            <TableCell className="text-center">{store.sellerCount}</TableCell>
                                            <TableCell>{formatCurrency(store.totalSales)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(store.totalIncentives)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
            </div>
        </main>
    );
}
    
