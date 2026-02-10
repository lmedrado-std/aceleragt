"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Home, Shield, RefreshCw, Moon, Sun, Users, Search, X, Clock } from "lucide-react";
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
        mb-4 flex items-center justify-center rounded-full
        border border-amber-200 bg-amber-50/50
        px-4 py-1 text-[11px]
        shadow-sm
        dark:bg-amber-900/20 dark:border-amber-800/50
      "
    >
      <div className="flex items-center gap-2">
        <Clock className={cn("h-3 w-3", isToday ? "text-emerald-500" : "text-amber-500")} />
        <span className="font-medium uppercase tracking-wider text-amber-700/80 dark:text-amber-300/80">Última atualização:</span>
        <span className="font-bold text-slate-900 dark:text-slate-200">{updatedAt}</span>
        {isToday && (
          <span className="flex items-center gap-1.5 ml-2 pl-2 border-l border-amber-200 dark:border-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-emerald-700 dark:text-emerald-400">Hoje</span>
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
    if (!mounted) return <Skeleton className="h-9 w-9 rounded-full" />;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} variant="outline" size="icon" className="rounded-full h-9 w-9">
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
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
      <div className="flex flex-1 flex-col items-center p-4 md:px-8 md:py-4 bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950">
        <div className="w-full max-w-7xl">
            {/* Header / Brand Card Compacto */}
            <Card className="mb-4 bg-primary shadow-lg border-none overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl" />
              <CardContent className="p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                    <Logo className="h-7" />
                  </div>
                  <div>
                    <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-tight">
                        {loading ? <Skeleton className="h-6 w-32" /> : store?.name}
                    </h1>
                    <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold hidden sm:block">Equipe de Vendas</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    {renderThemeToggle()}
                    <Button variant="secondary" size="sm" onClick={() => handleAccessAdminLoja(storeId, router)} className="font-bold h-9">
                        <Shield className="mr-1.5 h-3.5 w-3.5" /> Gestor
                    </Button>
                    <Button variant="outline" size="icon" asChild className="h-9 w-9 bg-white/10 text-white border-white/20 hover:bg-white/20">
                        <Link href="/"><Home className="h-4 w-4" /></Link>
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => loadStoreData(true)} disabled={loading} className="h-9 w-9 bg-white/10 text-white border-white/20 hover:bg-white/20">
                        <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    </Button>
                </div>
              </CardContent>
            </Card>
          
            {formattedLastUpdated && <LastUpdateBanner updatedAt={formattedLastUpdated} isToday={updateIsToday} />}
          
            {/* Search Bar + Contador na mesma linha */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar vendedor..." 
                        className="pl-10 h-10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-border/50 focus:ring-primary text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
                </div>
                <div className="text-[11px] font-bold text-muted-foreground whitespace-nowrap bg-white/30 dark:bg-slate-800/30 px-4 py-2.5 rounded-full backdrop-blur-sm border border-border/20 uppercase tracking-tighter">
                    {filteredSellers.length} {filteredSellers.length === 1 ? 'Vendedor' : 'Vendedores'}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground font-semibold animate-pulse">Carregando equipe...</p>
                </div>
            ) : filteredSellers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredSellers.map((seller) => (
                    <SellerCard
                        key={seller.id}
                        name={seller.name}
                        onClick={() => handleSellerAccess(storeId, seller.id, router)}
                    />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed border-border/50 rounded-2xl">
                    <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-lg font-bold text-muted-foreground">Nenhum vendedor encontrado</p>
                    <Button variant="link" size="sm" onClick={() => setSearchTerm("")} className="mt-1">Limpar busca</Button>
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
