
"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Home, Shield, RefreshCw, Moon, Sun, Users, Search, X } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Seller, Store } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import ClientOnly from "@/components/client-only";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/skeleton";
import { isAdminGlobal, isStoreAuthenticated } from "@/lib/auth";
import AppLayout from "@/components/app-layout";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Logo } from "@/components/logo";
import { SellerCard } from "@/components/seller-card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  const sellerLoginUrl = `/login/vendedor?storeId=${storeId}&sellerId=${sellerId}&redirect=${encodeURIComponent(sellerDashboardUrl)}`;
  router.push(sellerLoginUrl);
}

type LastUpdateProps = {
  updatedAt: string;
  isToday: boolean;
};

function LastUpdateBanner({ updatedAt, isToday }: LastUpdateProps) {
  return (
    <div
      className="
        mb-8 flex items-center justify-center rounded-2xl
        border border-amber-200 bg-amber-50/70
        px-4 py-2.5 text-sm
        shadow-[0_4px_12px_rgba(245,158,11,0.15)]
        dark:bg-amber-900/30 dark:border-amber-800
      "
    >
      <div className="relative mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-amber-950 text-amber-500 shadow-sm">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l3 2m4-2a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {isToday && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Última atualização</span>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{updatedAt}</span>
        {isToday && <span className="rounded-full bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-200">Atualizado hoje</span>}
      </div>
    </div>
  );
}

function StorePageContent() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [formattedLastUpdated, setFormattedLastUpdated] = useState<string | null>(null);
  const [updateIsToday, setUpdateIsToday] = useState(false);
  
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const storeId = params.storeId as string;

  useEffect(() => { setMounted(true); }, []);

  const loadStoreData = useCallback(async (showToast = false) => {
    if (!storeId) { setError("ID da loja não encontrado."); setLoading(false); return; };
    setLoading(true);
    try {
        const [storeRes, sellersRes] = await Promise.all([
          fetch(`/api/stores/${storeId}`),
          fetch(`/api/sellers?storeId=${storeId}`),
        ]);
        if (!storeRes.ok) {
            if (storeRes.status === 404) setError('Loja não encontrada.');
            else throw new Error('Falha ao carregar loja');
            setLoading(false); return;
        }
        const storeData = await storeRes.json();
        setStore(storeData);
        if (!sellersRes.ok) throw new Error('Falha ao carregar vendedores');
        const sellersData = await sellersRes.json();
        setSellers(sellersData);
        setError(null);
        if (showToast) toast({ title: "Dados atualizados" });

        if (storeData?.last_incentive_calculation) {
          const updateDate = new Date(storeData.last_incentive_calculation);
          const today = new Date();
          setFormattedLastUpdated(updateDate.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }));
          setUpdateIsToday(updateDate.toDateString() === today.toDateString());
        } else { setFormattedLastUpdated(null); setUpdateIsToday(false); }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Erro ao carregar dados.";
        setError(errorMessage);
        toast({ variant: "destructive", title: "Erro ao carregar", description: errorMessage });
    } finally { setLoading(false); }
  }, [storeId, toast]);

  useEffect(() => { loadStoreData(); }, [loadStoreData]);

  const filteredSellers = useMemo(() => {
    return sellers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sellers, searchTerm]);

  const renderThemeToggle = () => {
    if (!mounted) return <Skeleton className="h-10 w-10 rounded-full" />;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant="outline" size="icon" className="rounded-full">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Alternar tema</p></TooltipContent>
      </Tooltip>
    )
  }

  if (error) return (
    <div className="flex flex-1 items-center justify-center p-8">
        <Card className="max-w-lg w-full"><CardContent className="text-center p-8"><p className="text-destructive font-semibold mb-6">{error}</p><Button asChild><Link href="/"><Home className="mr-2 h-4 w-4" />Voltar ao Início</Link></Button></CardContent></Card>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="flex flex-1 flex-col items-center p-4 md:p-8 bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950">
        <div className="w-full max-w-7xl">
            {/* Header / Brand Card */}
            <Card className="mb-8 bg-primary shadow-2xl border-none overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Logo className="h-10" />
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1">
                        {loading ? <Skeleton className="h-8 w-48" /> : store?.name}
                    </h1>
                    <p className="text-white/80 text-sm font-medium">Selecione seu usuário para ver seu desempenho.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    {renderThemeToggle()}
                    <Button variant="secondary" onClick={() => handleAccessAdminLoja(storeId, router)} className="font-bold">
                        <Shield className="mr-2 h-4 w-4" /> Gestor
                    </Button>
                    <Button variant="outline" asChild className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                        <Link href="/"><Home className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="outline" onClick={() => loadStoreData(true)} disabled={loading} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
              </CardContent>
            </Card>
          
            {formattedLastUpdated && <LastUpdateBanner updatedAt={formattedLastUpdated} isToday={updateIsToday} />}
          
            {/* Search Bar */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar vendedor pelo nome..." 
                        className="pl-10 h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-border/50 focus:ring-primary text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
                </div>
                <div className="text-sm font-bold text-muted-foreground whitespace-nowrap bg-white/30 dark:bg-slate-800/30 px-4 py-2 rounded-full backdrop-blur-sm border border-border/20">
                    {filteredSellers.length} {filteredSellers.length === 1 ? 'Vendedor' : 'Vendedores'}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground font-semibold animate-pulse">Carregando equipe...</p>
                </div>
            ) : filteredSellers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredSellers.map((seller) => (
                    <SellerCard
                        key={seller.id}
                        name={seller.name}
                        onClick={() => handleSellerAccess(storeId, seller.id, router)}
                    />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-border/50 rounded-3xl">
                    <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-xl font-bold text-muted-foreground">Nenhum vendedor encontrado</p>
                    <Button variant="link" onClick={() => setSearchTerm("")} className="mt-2">Limpar busca</Button>
                </div>
            )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default function StoreHomePage() {
  return (
    <ClientOnly>
        <AppLayout><StorePageContent /></AppLayout>
    </ClientOnly>
  )
}
