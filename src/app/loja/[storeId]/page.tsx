"use client";

import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Home, Shield, Clock, RefreshCw, Moon, Sun, Users } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { SellerAvatar } from "@/components/seller-avatar";
import { useParams, useRouter } from 'next/navigation';
import { Seller, Store } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClientOnly from "@/components/client-only";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { isAdminGlobal, isStoreAuthenticated, isSellerAuthenticated } from "@/lib/auth";
import AppLayout from "@/components/app-layout";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

function handleAccessAdminLoja(storeId: string, router: ReturnType<typeof useRouter>) {
  const lojaDashboardUrl = `/loja/${storeId}/dashboard?tab=admin`;
  if (isAdminGlobal() || isStoreAuthenticated(storeId)) {
    router.push(lojaDashboardUrl);
  } else {
    router.push(`/loja/${storeId}/login?redirect=${encodeURIComponent(lojaDashboardUrl)}`);
  }
}

function handleSellerAccess(storeId: string, sellerId: string, router: ReturnType<typeof useRouter>) {
  const sellerDashboardUrl = `/loja/${storeId}/dashboard?tab=${sellerId}`;

  // Case 1: User has direct access to the seller's dashboard.
  if (isAdminGlobal() || isStoreAuthenticated(storeId) || isSellerAuthenticated(sellerId)) {
    router.push(sellerDashboardUrl);
    return;
  }

  // Case 2: User is not authenticated. Redirect to the seller's login page.
  const sellerLoginUrl = `/login/vendedor?storeId=${storeId}&sellerId=${sellerId}&redirect=${encodeURIComponent(sellerDashboardUrl)}`;
  
  router.push(sellerLoginUrl);
}

const sellerButtonColors = [
    "border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20",
    "border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20",
    "border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20",
    "border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20",
    "border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20",
    "border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20",
    "border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20",
    "border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20",
    "border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
    "border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
];


function StorePageContent() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [formattedLastUpdated, setFormattedLastUpdated] = useState<string | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const storeId = params.storeId as string;

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadStoreData = useCallback(async (showToast = false) => {
    if (!storeId) {
      setError("ID da loja não encontrado na URL.");
      setLoading(false);
      return;
    };

    setLoading(true);
    try {
        const [storeRes, sellersRes] = await Promise.all([
          fetch(`/api/stores/${storeId}`),
          fetch(`/api/sellers?storeId=${storeId}`),
        ]);

        if (!storeRes.ok) {
            if (storeRes.status === 404) {
                 setError('Loja não encontrada. Verifique o ID e tente novamente.');
            } else {
                throw new Error('Falha ao carregar dados da loja');
            }
            setLoading(false);
            return;
        }
        const storeData = await storeRes.json();
        setStore(storeData);

        if (!sellersRes.ok) throw new Error('Falha ao carregar vendedores');
        const sellersData = await sellersRes.json();
        setSellers(sellersData);
        
        setError(null);
        if (showToast) {
            toast({ title: "Dados atualizados", description: "As informações da loja foram recarregadas." });
        }

        if (storeData?.last_incentive_calculation) {
          const date = new Date(storeData.last_incentive_calculation);
          setFormattedLastUpdated(
            date.toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          );
        } else {
          setFormattedLastUpdated(null);
        }

    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro ao carregar os dados da loja.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Erro ao carregar",
          description: errorMessage,
        });
    } finally {
        setLoading(false);
    }
  }, [storeId, toast]);

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  if (error) {
     return (
        <div className="flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950">
            <Card className="max-w-lg w-full">
                <CardHeader>
                    <CardTitle className="text-destructive">Erro ao Carregar Loja</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-destructive/80 mb-6">{error}</p>
                    <Button asChild>
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Voltar para o Início
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
     )
  }

  const renderThemeToggle = () => {
    if (!mounted) {
      return <Skeleton className="h-10 w-10 rounded-full" />;
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant="outline" size="icon" className="rounded-full">
              {theme === 'light' ? <Moon /> : <Sun />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Alterar tema (claro/escuro)</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-1 flex-col items-center p-4 md:p-8 bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950">
        <div className="w-full max-w-7xl">
            <Card className="mb-8 bg-card/80 backdrop-blur-sm border-border/20 shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                      {loading ? <Skeleton className="h-12 w-12 rounded-full" /> : <Logo className="h-12" />}
                      <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                          {loading ? <Skeleton className="h-6 w-48" /> : store?.name}
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Selecione seu usuário para começar.
                        </p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      {renderThemeToggle()}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" onClick={() => handleAccessAdminLoja(storeId, router)}>
                              <Shield className="mr-2 h-4 w-4" />
                              <span className="hidden sm:inline">Painel do Gestor</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Acessar painel de gerenciamento da loja (metas, vendedores, etc.)</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" asChild>
                              <Link href="/">
                                  <Home className="mr-2 h-4 w-4" />
                                  <span className="hidden sm:inline">Início</span>
                              </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Voltar para a página inicial de seleção de lojas.</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" onClick={() => loadStoreData(true)} disabled={loading}>
                              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                              <span className="hidden sm:inline">Atualizar</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Recarregar os dados da loja e vendedores.</p>
                        </TooltipContent>
                      </Tooltip>
                  </div>
              </CardContent>
            </Card>
          
            {formattedLastUpdated && (
                <div className="mb-6 p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-center flex items-center justify-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    <span>Última atualização de dados: {formattedLastUpdated}</span>
                </div>
            )}
          
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="mr-2 h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users /> Vendedores</CardTitle>
                        <CardDescription>Selecione seu usuário para ver seu desempenho.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sellers.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {sellers.map((seller, index) => (
                                <Tooltip key={seller.id}>
                                  <TooltipTrigger asChild>
                                    <button
                                        onClick={() => handleSellerAccess(storeId, seller.id, router)}
                                        className={cn(
                                          "group flex flex-col items-center p-4 rounded-xl border-2 hover:shadow-lg transition-all text-center",
                                          "bg-card hover:bg-muted/50 dark:bg-muted/20 dark:hover:bg-muted/40",
                                          sellerButtonColors[index % sellerButtonColors.length]
                                        )}
                                    >
                                        <SellerAvatar avatarId={seller.avatar_id} className="h-28 w-28 mb-4 border-4 border-background transition-transform group-hover:scale-105" />
                                        <span className="font-semibold text-foreground text-lg">{seller.name}</span>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Acessar painel de {seller.name}</p>
                                  </TooltipContent>
                                </Tooltip>
                              ))}
                          </div>
                      ) : (
                          <p className="text-center text-sm text-muted-foreground py-10">
                              Nenhum vendedor cadastrado nesta loja ainda.
                          </p>
                      )}
                  </CardContent>
                </Card>
            )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function StoreHomePage() {
  return (
    <ClientOnly>
        <AppLayout>
          <StorePageContent />
        </AppLayout>
    </ClientOnly>
  )
}
