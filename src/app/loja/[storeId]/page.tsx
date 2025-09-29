"use client";

import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Home, Shield, Clock, RefreshCw, Moon, Sun } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { SellerAvatar } from "@/components/seller-avatar";
import { useParams, useRouter,useRouter as useNextRouter } from 'next/navigation';
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

function handleAccessAdminLoja(storeId: string, router: ReturnType<typeof useNextRouter>) {
  const lojaDashboardUrl = `/dashboard/${storeId}?tab=admin`;
  if (isAdminGlobal() || isStoreAuthenticated(storeId)) {
    router.push(lojaDashboardUrl);
  } else {
    router.push(`/loja/${storeId}/login?redirect=${encodeURIComponent(lojaDashboardUrl)}`);
  }
}

function handleSellerAccess(storeId: string, sellerId: string, router: ReturnType<typeof useNextRouter>) {
  const sellerDashboardUrl = `/dashboard/${storeId}?tab=${sellerId}`;

  // Case 1: User has direct access to the seller's dashboard.
  if (isAdminGlobal() || isStoreAuthenticated(storeId) || isSellerAuthenticated(sellerId)) {
    router.push(sellerDashboardUrl);
    return;
  }

  // Case 2: User is not authenticated. Redirect to the seller's login page.
  const sellerLoginUrl = `/login/vendedor?storeId=${storeId}&sellerId=${sellerId}&redirect=${encodeURIComponent(sellerDashboardUrl)}`;
  
  router.push(sellerLoginUrl);
}


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

  useEffect(() => {
    if (store?.last_incentive_calculation) {
      const date = new Date(store.last_incentive_calculation);
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
  }, [store?.last_incentive_calculation]);


  if (error) {
     return (
        <div className="bg-card rounded-lg flex flex-col items-center justify-center p-8 text-center h-full max-w-lg mx-auto">
             <h1 className="text-2xl font-bold text-destructive mb-4">Erro ao Carregar Loja</h1>
             <p className="text-destructive/80 mb-6">{error}</p>
             <Button asChild>
                <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Voltar para o Início
                </Link>
             </Button>
        </div>
     )
  }

  const renderThemeToggle = () => {
    if (!mounted) {
      return <Skeleton className="h-10 w-10 rounded-full bg-white/20" />;
    }
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant="ghost" size="icon" className="rounded-full text-white/80 hover:bg-white/20 hover:text-white">
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
      <div className="w-full max-w-7xl mx-auto">
          <div className="mb-6 p-4 rounded-xl bg-[#2B344D] shadow-lg text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h1 className="text-3xl font-bold">{loading ? "Carregando..." : store?.name}</h1>
                  <div className="flex items-center gap-2">
                      {renderThemeToggle()}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="secondary" onClick={() => handleAccessAdminLoja(storeId, router)} className="bg-white/90 text-primary hover:bg-white">
                              <Shield className="mr-2 h-4 w-4" />
                              <span className="hidden sm:inline">Painel do Gerente</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Acessar painel de gerenciamento da loja (metas, vendedores, etc.)</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="secondary" asChild className="bg-white/90 text-primary hover:bg-white">
                              <Link href="/">
                                  <Home className="mr-2 h-4 w-4" />
                                  <span className="hidden sm:inline">Página Inicial</span>
                              </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Voltar para a página inicial de seleção de lojas.</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" onClick={() => loadStoreData(true)} disabled={loading} className="bg-transparent text-white hover:bg-white/20 hover:text-white border-white/50">
                              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                              <span className="hidden sm:inline">Atualizar</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Recarregar os dados da loja e vendedores.</p>
                        </TooltipContent>
                      </Tooltip>
                  </div>
              </div>
              <p className="text-white/80 mt-2">Selecione seu usuário para começar.</p>
          </div>
          
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
                      <CardTitle>Vendedores</CardTitle>
                      <p className="text-sm text-muted-foreground">Selecione seu usuário para ver seu desempenho.</p>
                  </CardHeader>
                  <CardContent>
                      {sellers.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                              {sellers.map((seller) => (
                                <Tooltip key={seller.id}>
                                  <TooltipTrigger asChild>
                                    <button
                                        onClick={() => handleSellerAccess(storeId, seller.id, router)}
                                        className="group flex flex-col items-center p-3 rounded-lg border hover:bg-muted hover:shadow-lg transition-all text-center"
                                    >
                                        <SellerAvatar avatarId={seller.avatar_id} className="h-24 w-24 mb-3 transition-transform group-hover:scale-105" />
                                        <span className="font-semibold text-foreground">{seller.name}</span>
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

    