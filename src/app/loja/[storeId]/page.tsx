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

type LastUpdateBannerProps = {
  updatedAt: string;
  isToday: boolean;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  total: number;
};

export function LastUpdateBanner({ updatedAt, isToday, searchTerm, setSearchTerm, total }: LastUpdateBannerProps) {
  return (
    <div className="mb-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.08] via-accent/[0.08] to-primary/[0.08] backdrop-blur-lg px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.06)] space-y-3 transition-all">
      {/* topo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <span className="text-muted-foreground font-medium">Atualizado:</span>
          <span className="font-semibold tracking-tight">{updatedAt}</span>
          {isToday && (
            <span className="text-[10px] px-2 py-[2px] rounded-full bg-emerald-500/15 text-emerald-600 font-semibold">HOJE</span>
          )}
        </div>
        <div className="text-[11px] font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full shrink-0">
          {total} vendedores
        </div>
      </div>
      {/* busca PRO */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Buscar vendedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-9 sm:h-10 rounded-xl pl-9 pr-3 bg-white/70 dark:bg-slate-900/60 border border-border/50 outline-none focus:ring-2 focus:ring-primary/25 transition-all text-sm"
        />
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

  useEffect(() => {
    const updateDensity = () => {
      document.body.classList.toggle("compact-ui", window.innerHeight < 780);
    };
    updateDensity();
    window.addEventListener("resize", updateDensity);
    return () => window.removeEventListener("resize", updateDensity);
  }, []);

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
      <div className="flex flex-1 flex-col items-center p-4 md:px-8 md:py-4 bg-gradient-to-b from-background to-slate-100/60 dark:to-slate-900">
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6">
            <Card className="mb-4 bg-primary shadow-lg border-none overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-xl" />
              <CardContent className="p-3 sm:p-4 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4 relative z-10 header">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                    <Logo className="h-7" />
                  </div>
                  <div>
                    <h1 className="text-lg md:text-xl font-bold tracking-tight text-white leading-tight">
                        {loading ? <Skeleton className="h-6 w-32" /> : store?.name}
                    </h1>
                    <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold hidden sm:block">Equipe de Vendas</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
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
          
            {formattedLastUpdated && (
              <LastUpdateBanner
                updatedAt={formattedLastUpdated}
                isToday={updateIsToday}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                total={filteredSellers.length}
              />
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground font-semibold animate-pulse">Carregando equipe...</p>
                </div>
            ) : filteredSellers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
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