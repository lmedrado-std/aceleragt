
"use client";

import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Home, Shield, Clock, RefreshCw, Moon, Sun, Users } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Seller, Store } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import ClientOnly from "@/components/client-only";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { isAdminGlobal, isStoreAuthenticated, isSellerAuthenticated } from "@/lib/auth";
import AppLayout from "@/components/app-layout";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { SellerCard } from "@/components/seller-card";

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

const sellerCardColors: ("pink" | "green" | "purple" | "orange")[] = [
    "pink",
    "green",
    "purple",
    "orange",
];

type LastUpdateProps = {
  updatedAt: string;
  isToday: boolean;
};

function LastUpdateBanner({ updatedAt, isToday }: LastUpdateProps) {
  return (
    <div
      className="
        my-6 flex items-center justify-center rounded-2xl
        border border-amber-200 bg-amber-50/70
        px-4 py-2.5 text-sm
        shadow-[0_4px_12px_rgba(245,158,11,0.15)]
        dark:bg-amber-900/30 dark:border-amber-800
      "
    >
      <div className="relative mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-amber-950 text-amber-500 shadow-sm">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6l3 2m4-2a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {isToday && (
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
        )}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
          Última atualização
        </span>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">
          {updatedAt}
        </span>
        {isToday && (
          <span className="rounded-full bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-200">
            Atualizado hoje
          </span>
        )}
      </div>
    </div>
  );
}


function StorePageContent() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [formattedLastUpdated, setFormattedLastUpdated] = useState<string | null>(null);
  const [updateIsToday, setUpdateIsToday] = useState(false);
  
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
          const updateDate = new Date(storeData.last_incentive_calculation);
          const today = new Date();

          setFormattedLastUpdated(
            updateDate.toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          );

          setUpdateIsToday(
            updateDate.getFullYear() === today.getFullYear() &&
            updateDate.getMonth() === today.getMonth() &&
            updateDate.getDate() === today.getDate()
          );

        } else {
          setFormattedLastUpdated(null);
          setUpdateIsToday(false);
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
            <Card className="mb-8 bg-accent/80 backdrop-blur-sm border-border/20 shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {loading ? <Skeleton className="h-12 w-40" /> : <Logo />}
                  
                  <h1 className="text-3xl font-bold tracking-tight text-white order-first sm:order-none sm:absolute sm:left-1/2 sm:-translate-x-1/2">
                    {loading ? <Skeleton className="h-8 w-48" /> : store?.name}
                  </h1>

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
                <LastUpdateBanner updatedAt={formattedLastUpdated} isToday={updateIsToday} />
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
                                <SellerCard
                                    key={seller.id}
                                    name={seller.name}
                                    color={sellerCardColors[index % sellerCardColors.length]}
                                    onClick={() => handleSellerAccess(storeId, seller.id, router)}
                                />
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

    