"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, LogOut, Store, Users, DollarSign, BarChart, ExternalLink } from "lucide-react";
import AppLayout from "@/components/app-layout";
import ClientOnly from "@/components/client-only";
import { logoutAll } from "@/lib/auth";
import Link from "next/link";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface StoreDetail {
  id: string;
  name: string;
  total_vendas: number;
  seller_count: number;
}

interface GlobalStats {
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
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('adminAuthenticated') === 'true';
    if (!isAdmin) {
      router.push('/login?redirect=/admin/dashboard');
      return;
    }

    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/dashboard-stats');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Falha ao buscar estatísticas.");
        }
        const data: GlobalStats = await res.json();
        setStats(data);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido."
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [router, toast]);

  const handleLogout = () => {
    logoutAll();
    toast({ title: "Sessão encerrada", description: "Você saiu do modo de administrador." });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando dashboard global...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Não foi possível carregar os dados.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
        <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Dashboard Geral Consolidado</h1>
                    <p className="text-muted-foreground">Visão geral do desempenho de todas as lojas.</p>
                </div>
                 <div className="flex items-center gap-2">
                  <Button asChild variant="outline">
                    <Link href="/admin">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Painel Admin
                    </Link>
                  </Button>
                  <Button onClick={handleLogout} variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                 <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Lojas</CardTitle>
                        <Store className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{stats.storeCount}</div>
                    </CardContent>
                </Card>
                 <Card className="bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Vendedores</CardTitle>
                        <Users className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{stats.sellerCount}</div>
                    </CardContent>
                </Card>
                 <Card className="bg-gradient-to-br from-green-500 to-green-700 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vendas Consolidadas</CardTitle>
                        <DollarSign className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{formatCurrency(stats.totalSales)}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart /> Ranking de Lojas</CardTitle>
                    <CardDescription>Classificação das lojas por total de vendas no período atual.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Rank</TableHead>
                                <TableHead>Loja</TableHead>
                                <TableHead className="text-right">Nº de Vendedores</TableHead>
                                <TableHead className="text-right">Vendas Totais</TableHead>
                                <TableHead className="w-[100px] text-center">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stats.storesDetails.length > 0 ? (
                                stats.storesDetails.map((store, index) => (
                                <TableRow key={store.id} className={index < 3 ? "bg-muted/50" : ""}>
                                    <TableCell className="font-bold text-lg">{index + 1}</TableCell>
                                    <TableCell className="font-medium">{store.name}</TableCell>
                                    <TableCell className="text-right">{store.seller_count}</TableCell>
                                    <TableCell className="text-right font-semibold">{formatCurrency(store.total_vendas)}</TableCell>
                                    <TableCell className="text-center">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                           <Button asChild variant="ghost" size="icon">
                                            <Link href={`/loja/${store.id}/dashboard?tab=admin`}>
                                              <ExternalLink className="h-4 w-4"/>
                                            </Link>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Acessar painel da loja</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TableCell>
                                </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Nenhum dado de loja para exibir.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </TooltipProvider>
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
