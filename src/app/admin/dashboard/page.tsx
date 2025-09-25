"use client";

import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, ArrowLeft, Store, Users, DollarSign, LineChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ClientOnly from '@/components/client-only';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/app-layout';

interface StoreDetail {
    id: string;
    name: string;
    total_vendas: number;
    seller_count: number;
}

interface DashboardStats {
    storeCount: number;
    sellerCount: number;
    totalSales: number;
    storesDetails: StoreDetail[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

function GlobalDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/dashboard-stats');
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.details || 'Falha ao buscar estatísticas.');
                }
                const data = await res.json();
                setStats(data);
            } catch (e) {
                toast({
                    variant: 'destructive',
                    title: 'Erro ao Carregar Dashboard',
                    description: e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.',
                });
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [toast]);
    
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Carregando estatísticas globais...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> Erro ao Carregar Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive/90">Não foi possível carregar os dados do dashboard.</p>
                    <p className="text-muted-foreground mt-2">
                        Verifique a conexão com o banco de dados e tente novamente.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                     <h1 className="text-3xl font-bold">Dashboard Geral</h1>
                     <p className="text-muted-foreground">Visão consolidada de todas as lojas.</p>
                </div>
                 <Button asChild variant="outline">
                    <Link href="/admin">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar ao Painel Admin
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Lojas</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.storeCount}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Vendedores</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.sellerCount}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Desempenho por Loja</CardTitle>
                    <CardDescription>Ranking de lojas por total de vendas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60%]">Loja</TableHead>
                                <TableHead className="text-center hidden sm:table-cell">Vendedores</TableHead>
                                <TableHead className="text-right">Vendas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.storesDetails.map((store) => (
                                <TableRow key={store.id}>
                                    <TableCell className="font-medium">{store.name}</TableCell>
                                    <TableCell className="text-center hidden sm:table-cell">{store.seller_count}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(store.total_vendas)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

        </div>
    );
}


export default function GlobalDashboardPage() {
    return (
        <ClientOnly>
            <AppLayout>
              <GlobalDashboard />
            </AppLayout>
        </ClientOnly>
    );
}
