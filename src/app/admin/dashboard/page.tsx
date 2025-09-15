
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppState, loadStateFromStorage, Seller, Store } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, DollarSign, Users, Award, Trophy, BarChartHorizontal, Home, Shield } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import ClientOnly from '@/components/client-only';

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

function AdminDashboard() {
    const [state, setState] = useState<AppState | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const isAdmin = sessionStorage.getItem('adminAuthenticated') === 'true';
        if (!isAdmin) {
            router.push('/login?redirect=/admin/dashboard');
        } else {
            // This part is now simplified as we are fetching data directly from API
            // and not relying on a complex client-side state object.
            // The `useMemo` below will handle data fetching and processing.
            setLoading(false);
        }
    }, [router]);
    
    // NOTE: This component's logic is being kept but might need future refactoring
    // to use direct API calls instead of a monolithic `AppState` from localStorage,
    // which is not being used anymore. For now, it's adapted to gracefully degrade.
    // The `useMemo` will return empty data.

    const {
        totalSales,
        totalIncentives,
        totalSellers,
        topSellersBySales,
        topSellersByIncentives,
        storePerformance,
    } = useMemo(() => {
       // This calculation is now disabled as we move away from localStorage
       // A future task would be to rebuild this dashboard with live API data.
        return {
            totalSales: 0,
            totalIncentives: 0,
            totalSellers: 0,
            topSellersBySales: [],
            topSellersByIncentives: [],
            storePerformance: [],
        };

    }, []);


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
                <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Carregando dashboard...</p>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-foreground">
                    Dashboard Geral
                </h1>
                <div className="flex items-center gap-2">
                    <Button asChild variant="outline">
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/">
                        <Home className="mr-2 h-4 w-4" />
                        Início
                      </Link>
                    </Button>
                </div>
            </div>


            <Card>
                <CardHeader>
                    <CardTitle>Dashboard em Manutenção</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Esta área de dashboard geral está sendo reconstruída para usar dados em tempo real do banco de dados.
                        Por enquanto, por favor, gerencie as lojas e acesse os dashboards individuais através do painel de administração.
                    </p>
                </CardContent>
            </Card>

            {/* The rest of the dashboard is commented out until it's refactored to use live data */}
            {/*
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
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
            */}
        </div>
    );
}

export default function AdminDashboardPage() {
    return (
        <ClientOnly>
            <AdminDashboard />
        </ClientOnly>
    )
}
