"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadState, AppState, Seller, Store } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, DollarSign, Users, Award, Trophy } from 'lucide-react';
import { Logo } from '@/components/logo';

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
            setState(loadState());
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
                    ? Object.values(sellerIncentives).reduce((sum, val) => sum + (val || 0), 0)
                    : 0;

                storeTotalSales += seller.vendas;
                storeTotalIncentives += sellerTotalIncentives;

                allSellers.push({
                    ...seller,
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
        <main className="flex flex-col items-center min-h-screen bg-background p-8 relative">
            <div className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 text-xs font-bold p-1 rounded z-10">PÁGINA: DASHBOARD ADMIN</div>
            <div className="absolute top-4 left-4">
                <Button asChild variant="outline">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Admin Global
                    </Link>
                </Button>
            </div>
            <div className="flex flex-col items-center gap-6 w-full max-w-7xl">
                <Logo />
                <h1 className="text-4xl font-bold font-headline text-primary text-center">
                    Dashboard Geral
                </h1>
                <p className="text-lg text-muted-foreground text-center">
                    Visão consolidada do desempenho de todas as lojas.
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
                        <CardTitle className="text-sm font-medium">Incentivos Pagos</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalIncentives)}</div>
                         <p className="text-xs text-muted-foreground">Total de prêmios e bônus</p>
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
                                            <TableCell>{seller.storeName}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(seller.vendas)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card>
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Award className="text-green-500" /> Top 5 Vendedores (Incentivos)</CardTitle>
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
                                            <TableCell>{seller.storeName}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(seller.totalIncentives)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                 <Card className="w-full mt-6">
                        <CardHeader>
                            <CardTitle>Desempenho por Loja</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Loja</TableHead>
                                    <TableHead>Vendedores</TableHead>
                                    <TableHead>Vendas</TableHead>
                                    <TableHead className="text-right">Incentivos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {storePerformance.map((store) => (
                                        <TableRow key={store.id}>
                                            <TableCell className="font-medium">{store.name}</TableCell>
                                            <TableCell>{store.sellerCount}</TableCell>
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
    )
}
