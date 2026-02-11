'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Home, Loader2, History, ArrowUpRight, ArrowDownRight, Minus, Trash2, Trophy, LogOut } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { type IncentiveProjectionOutput, incentiveProjection } from "@/ai/flows/incentive-projection";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Goals, Store, Incentives, Seller } from "@/lib/storage";
import { AdminTab } from "@/components/admin-tab";
import { SellerTab } from "@/components/seller-tab";
import { Skeleton } from "./ui/skeleton";
import { isAdminGlobal, isStoreAuthenticated, isSellerAuthenticated, logoutStore, logoutSeller, logoutAll } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { WelcomeModal } from "./welcome-modal";
import { cn } from "@/lib/utils";

// --- ZOD SCHEMAS & TYPES ---
const sellerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome é obrigatório"),
  password: z.string().min(4, "A senha deve ter pelo menos 4 caracteres"),
  avatar_id: z.string(),
  store_id: z.string(),
  vendas: z.coerce.number().min(0).default(0),
  pa: z.coerce.number().min(0).default(0),
  ticket_medio: z.coerce.number().min(0).default(0),
  corridinha_diaria: z.coerce.number().min(0).default(0),
});

const goalsSchema = z.object({
  metaHoje: z.coerce.number().default(0),
  paMetaHoje: z.coerce.number().default(0),
  metaMinha: z.coerce.number().default(0),
  metaMinhaPrize: z.coerce.number().default(0),
  meta: z.coerce.number().default(0),
  metaPrize: z.coerce.number().default(0),
  metona: z.coerce.number().default(0),
  metonaPrize: z.coerce.number().default(0),
  metaLendaria: z.coerce.number().default(0),
  legendariaBonusValorVenda: z.coerce.number().default(0),
  legendariaBonusValorPremio: z.coerce.number().default(0),
  performanceBonusEnabled: z.boolean().default(false),
  paGoal1: z.coerce.number().default(0),
  paPrize1: z.coerce.number().default(0),
  paGoal2: z.coerce.number().default(0),
  paPrize2: z.coerce.number().default(0),
  paGoal3: z.coerce.number().default(0),
  paPrize3: z.coerce.number().default(0),
  paGoal4: z.coerce.number().default(0),
  paPrize4: z.coerce.number().default(0),
  ticketMedioGoal1: z.coerce.number().default(0),
  ticketMedioPrize1: z.coerce.number().default(0),
  ticketMedioGoal2: z.coerce.number().default(0),
  ticketMedioPrize2: z.coerce.number().default(0),
  ticketMedioGoal3: z.coerce.number().default(0),
  ticketMedioPrize3: z.coerce.number().default(0),
  ticketMedioGoal4: z.coerce.number().default(0),
  ticketMedioPrize4: z.coerce.number().default(0),
  corridinhaStartDate: z.string().optional().nullable(),
  corridinhaEndDate: z.string().optional().nullable(),
  corridinhaObjective1: z.string().optional(),
  corridinhaPrize1: z.coerce.number().optional(),
  corridinhaObjective2: z.string().optional(),
  corridinhaPrize2: z.coerce.number().optional(),
  corridinhaObjective3: z.string().optional(),
  corridinhaPrize3: z.coerce.number().optional(),
  corridinhaObjective4: z.string().optional(),
  corridinhaPrize4: z.coerce.number().optional(),
});

export const formSchema = z.object({
  newSellerName: z.string().optional(),
  newSellerPassword: z.string().optional(),
  goals: goalsSchema.partial(),
  sellers: z.array(sellerSchema.partial()),
});

export type FormValues = z.infer<typeof formSchema>;
export type RankingMetric = "vendas" | "pa" | "ticketMedio";
export type Rankings = Record<string, Record<RankingMetric, number>>;
export type GoalsFormValues = z.infer<typeof goalsSchema>;

// --- HISTORY FEATURE COMPONENTS & TYPES ---
interface ArchivedPeriod { period: string; storeId: string; sellerCount: number; }
interface SellerHistoryDetail { id: string; period: string; seller_id: string; seller_name: string; vendas: number; pa: number; ticket_medio: number; total_prize: number; createdAt: string; }
interface PeriodComparisonData { current: SellerHistoryDetail[]; previous: SellerHistoryDetail[]; }

const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

function Comparison({ current, previous }: { current: number; previous: number | undefined; }) {
  if (previous === undefined || previous === null || isNaN(previous)) return null;

  if (previous === 0) {
    if (current > 0) {
      return <span className="ml-2 text-xs font-mono flex items-center gap-1 text-green-600">Novo</span>;
    }
    return null; 
  }

  const diff = current - previous;
  if (diff === 0) return null;

  const percent = (diff / previous) * 100;
  if (!isFinite(percent)) {
    return <span className="ml-2 text-xs font-mono flex items-center gap-1 text-muted-foreground">—</span>;
  }
  
  const isUp = diff > 0;
  const isDown = diff < 0;
  const color = isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-muted-foreground';
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;

  return (
    <span className={`ml-2 text-xs font-mono flex items-center gap-1 ${color}`}>
      <Icon className="w-3 h-3" />
      {`${percent.toFixed(0)}%`}
    </span>
  );
}


export function ArchivedPeriods({ storeId, onDataNeedsRefresh }: { storeId: string; onDataNeedsRefresh: (callback: () => void) => void }) {
    const [periods, setPeriods] = useState<ArchivedPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [details, setDetails] = useState<Record<string, PeriodComparisonData>>({});
    const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    const fetchPeriods = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/history?storeId=${storeId}`);
            if (!res.ok) throw new Error('Falha ao buscar histórico de períodos.');
            const periodsData: ArchivedPeriod[] = await res.json();
            setPeriods(periodsData);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'Não foi possível carregar o histórico.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [storeId]);

    useEffect(() => {
        fetchPeriods();
    }, [fetchPeriods]);
    
    useEffect(() => {
      onDataNeedsRefresh(fetchPeriods);
    },[onDataNeedsRefresh, fetchPeriods])

    const handleAccordionChange = async (value: string) => {
        if (!value || details[value]) return;
        const [period, currentStoreId] = value.split('|');
        setLoadingDetails(prev => ({ ...prev, [value]: true }));
        try {
            const res = await fetch(`/history?storeId=${currentStoreId}&period=${encodeURIComponent(period)}`);
            if (!res.ok) throw new Error(`Falha ao buscar detalhes.`);
            const data = await res.json();
            setDetails(prev => ({ ...prev, [value]: data }));
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erro', description: e instanceof Error ? e.message : 'Não foi possível carregar os detalhes.' });
        } finally {
            setLoadingDetails(prev => ({ ...prev, [value]: false }));
        }
    };

    const handleDeletePeriod = async (periodName: string) => {
        try {
            const res = await fetch(`/api/history?storeId=${storeId}&period=${encodeURIComponent(periodName)}`, {
                method: 'DELETE',
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Falha ao remover período.');
            }
            toast({
                title: 'Sucesso!',
                description: `Período "${periodName}" removido.`,
            });
            fetchPeriods(); 
        } catch (e) {
            toast({
                variant: 'destructive',
                title: 'Erro ao Remover',
                description: e instanceof Error ? e.message : 'Não foi possível remover o período.',
            });
        }
    };

    if (loading) return <div className="flex items-center justify-center h-24"><Loader2 className="mr-2 h-8 w-8 animate-spin" /><p>Carregando histórico...</p></div>;
    
    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><History /> Histórico de Períodos</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-destructive">{error}</p>
                </CardContent>
            </Card>
        );
    }
    
    if (periods.length === 0) return (
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><History /> Histórico de Períodos</CardTitle></CardHeader><CardContent><p className='text-muted-foreground'>Nenhum período da sua loja foi arquivado ainda.</p></CardContent></Card>
    );

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><History /> Histórico de Períodos</CardTitle><CardDescription>Consulte e compare o desempenho da sua equipe em períodos anteriores.</CardDescription></CardHeader>
            <CardContent>
                <Accordion type="single" collapsible onValueChange={handleAccordionChange}>
                    {periods.map(({ period, storeId, sellerCount }) => {
                        const value = `${period}|${storeId}`;
                        const periodData = details[value];
                        const previousDataMap = periodData?.previous.reduce((acc, seller) => { acc[seller.seller_id] = seller; return acc; }, {} as Record<string, SellerHistoryDetail>);

                        return (
                             <AccordionItem value={value} key={value}>
                                <div className="flex items-center w-full">
                                    <AccordionTrigger className="flex-1">
                                      <div className='flex justify-between items-center w-full pr-4'>
                                        <span>{period}</span>
                                        <span className='text-muted-foreground text-sm'>{`Vendedores: ${sellerCount}`}</span>
                                      </div>
                                    </AccordionTrigger>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0">
                                              <Trash2 className="h-4 w-4" />
                                          </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                          <AlertDialogHeader>
                                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                  Esta ação removerá permanentemente o período de histórico <span className="font-bold">"{period}"</span>. Esta ação não pode ser desfeita.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                              <AlertDialogAction
                                                  onClick={() => handleDeletePeriod(period)}
                                                  className="bg-destructive hover:bg-destructive/90"
                                              >
                                                  Remover
                                              </AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                                <AccordionContent>
                                    {loadingDetails[value] && <div className="flex items-center justify-center p-4"><Loader2 className="mr-2 h-6 w-6 animate-spin" /><span>Carregando...</span></div>}
                                    {periodData?.current && (
                                        <Table>
                                            <TableHeader><TableRow><TableHead>Vendedor</TableHead><TableHead className="text-right">Vendas</TableHead><TableHead className="text-right hidden sm:table-cell">PA</TableHead><TableHead className="text-right hidden sm:table-cell">Ticket Médio</TableHead><TableHead className="text-right">Prêmio</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {periodData.current.map(seller => {
                                                    const prev = previousDataMap?.[seller.seller_id];
                                                    return (
                                                        <TableRow key={seller.id}>
                                                            <TableCell className="font-medium">{seller.seller_name}</TableCell>
                                                            <TableCell className="text-right"><div className='flex items-center justify-end'>{formatCurrency(seller.vendas)}<Comparison current={seller.vendas} previous={prev?.vendas} /></div></TableCell>
                                                            <TableCell className="text-right hidden sm:table-cell"><div className='flex items-center justify-end'>{seller.pa}<Comparison current={seller.pa} previous={prev?.pa} /></div></TableCell>
                                                            <TableCell className="text-right hidden sm:table-cell"><div className='flex items-center justify-end'>{formatCurrency(seller.ticket_medio)}<Comparison current={seller.ticket_medio} previous={prev?.ticket_medio} /></div></TableCell>
                                                            <TableCell className="text-right font-semibold"><div className={`flex items-center justify-end ${seller.total_prize > 0 ? 'text-green-600' : ''}`}>{formatCurrency(seller.total_prize)}<Comparison current={seller.total_prize} previous={prev?.total_prize} /></div></TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
}

// --- MAIN DASHBOARD COMPONENT ---
const DashboardSkeleton = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <Loader2 className="mr-2 h-16 w-16 animate-spin text-primary" />
    <p className="mt-4 text-muted-foreground">Carregando Dashboard...</p>
  </div>
);

const parseForAI = (value: any): number => {
    if (typeof value === 'string') {
        const parsedValue = parseFloat(value.replace(',', '.'));
        return isNaN(parsedValue) ? 0 : parsedValue;
    }
    return Number(value) || 0;
};

const parseGoalsForAI = (rawGoals: any): Goals => {
    const parsed: any = {};
    for (const key in rawGoals) {
        if (key === 'performanceBonusEnabled' || key === 'corridinhaEnabled') {
            parsed[key] = !!rawGoals[key];
        } else {
            parsed[key] = parseForAI(rawGoals[key]);
        }
    }
    return parsed as Goals;
};

export function GoalGetterDashboard({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [incentives, setIncentives] = useState<Incentives>({});
  const [rankings, setRankings] = useState<Rankings>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dataRefreshCallback, setDataRefreshCallback] = useState<() => void>(() => () => {});

  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { newSellerName: "", newSellerPassword: "", sellers: [], goals: {} },
  });

  const { getValues } = form;
  const [activeTab, setActiveTab] = useState<string>("loading");
  
  const isAdmin = isAdminGlobal();
  const isStoreAdmin = isStoreAuthenticated(storeId);

  const calculateRankings = useCallback((sellersToRank: Seller[]) => {
    const newRankings: Rankings = {};
    if (!sellersToRank || sellersToRank.length === 0) { setRankings({}); return; }
    const metrics: RankingMetric[] = ["vendas", "pa", "ticketMedio"];
    metrics.forEach((metric) => {
        const sortedSellers = [...sellersToRank]
            .filter(s => (s[metric as keyof Seller] as number || 0) > 0)
            .sort((a, b) => (b[metric as keyof Seller] as number || 0) - (a[metric as keyof Seller] as number || 0));
        let currentRank = 0;
        let lastValue: number | null = null;
        sortedSellers.forEach((seller, index) => {
            if (!seller.id) return;
            const currentValue = seller[metric as keyof Seller] as number || 0;
            if (currentValue !== lastValue) { currentRank = index + 1; lastValue = currentValue; }
            if (!newRankings[seller.id]) newRankings[seller.id] = {} as Record<RankingMetric, number>;
            newRankings[seller.id][metric] = currentRank;
        });
    });
    setRankings(newRankings);
  }, []);
  
  const calculateAllIncentives = useCallback(async (sellersData: Seller[], goalsData: any) => {
    if (!sellersData || sellersData.length === 0) {
        setIncentives({});
        return;
    }
    const allIncentives: Incentives = {};
    const goals = parseGoalsForAI(goalsData);
    for (const seller of sellersData) {
        const sellerForAI = {
            id: seller.id,
            name: seller.name,
            avatarId: String(seller.avatar_id || 'avatar1'),
            password: String(seller.password || 'password'),
            vendas: parseForAI(seller.vendas),
            pa: parseForAI(seller.pa),
            ticketMedio: parseForAI(seller.ticket_medio),
            corridinhaDiaria: parseForAI(seller.corridinha_diaria),
        };
        
        const result: IncentiveProjectionOutput = await incentiveProjection({ seller: sellerForAI, goals });
        allIncentives[seller.id!] = result;
    }
    setIncentives(allIncentives);
}, []);

  const loadSellers = useCallback(async () => {
    try {
      const res = await fetch(`/api/sellers?storeId=${storeId}`);
      if (!res.ok) throw new Error('Falha ao carregar vendedores');
      const data = await res.json();
      setSellers(data);
      form.setValue('sellers', data.map((s: Seller) => ({...s, vendas: s.vendas || 0, pa: s.pa || 0, ticket_medio: s.ticket_medio || 0, corridinha_diaria: s.corridinha_diaria || 0})));
      calculateRankings(data);
      return data;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os vendedores.' });
      return [];
    }
  }, [storeId, form, calculateRankings, toast]);
  
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
        const [storeRes, goalsRes] = await Promise.all([ fetch(`/api/stores/${storeId}`), fetch(`/api/goals?storeId=${storeId}`)]);
        if (!storeRes.ok) throw new Error('Loja não encontrada');
        const storeData = await storeRes.json();
        setCurrentStore(storeData);
        const goalsData = goalsRes.ok ? await goalsRes.json() : {};
        const sellersData = await loadSellers();
        await calculateAllIncentives(sellersData, goalsData);
        form.reset({ ...form.getValues(), sellers: sellersData, goals: goalsData });
        if (storeData.last_incentive_calculation) setLastUpdated(storeData.last_incentive_calculation);

        const tabFromUrl = searchParams.get("tab");
        const isManagerView = isAdminGlobal() || isStoreAuthenticated(storeId);
        
        let tabToActivate: string;

        if (tabFromUrl === 'admin' && isManagerView) {
            tabToActivate = 'admin';
        } else if (tabFromUrl && sellersData.some((s: Seller) => s.id === tabFromUrl)) {
            const sellerId = tabFromUrl;
            if (isSellerAuthenticated(sellerId) || isManagerView) {
                tabToActivate = sellerId;
            } else {
                router.push(`/login/vendedor?storeId=${storeId}&sellerId=${sellerId}&redirect=${encodeURIComponent(`/loja/${storeId}/dashboard?tab=${sellerId}`)}`);
                return;
            }
        } else if (isManagerView) {
            tabToActivate = 'admin';
        } else {
             const firstSellerId = sellersData[0]?.id;
             if (firstSellerId && isSellerAuthenticated(firstSellerId)) {
                tabToActivate = firstSellerId;
             } else {
                router.push(`/loja/${storeId}`);
                return;
             }
        }
        
        setActiveTab(tabToActivate);
        if (tabToActivate !== tabFromUrl) {
            router.replace(`/loja/${storeId}/dashboard?tab=${tabToActivate}`, { scroll: false });
        }

    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao carregar dados", description: (error as Error).message });
        router.push('/');
    } finally {
        setLoading(false);
    }
  }, [storeId, form, loadSellers, router, searchParams, toast, calculateAllIncentives]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  useEffect(() => {
    if (loading) return;
    
    const tabFromUrl = searchParams.get("tab");
    const isManagerView = isAdminGlobal() || isStoreAuthenticated(storeId);

    if (tabFromUrl === 'admin') {
      if (!isManagerView) {
        router.push(`/loja/${storeId}/login?redirect=${encodeURIComponent(`/loja/${storeId}/dashboard?tab=admin`)}`);
      }
    } else if (tabFromUrl && sellers.some(s => s.id === tabFromUrl)) {
      if (!isManagerView && !isSellerAuthenticated(tabFromUrl)){
        router.push(`/login/vendedor?storeId=${storeId}&sellerId=${tabFromUrl}&redirect=${encodeURIComponent(`/loja/${storeId}/dashboard?tab=${tabFromUrl}`)}`);
      }
    }
  }, [storeId, activeTab, searchParams, router, loading, sellers]);


  const handleIncentivesCalculated = useCallback((newIncentives: Incentives, newLastUpdated: string) => {
      setIncentives(newIncentives);
      setLastUpdated(newLastUpdated);
      calculateRankings(getValues().sellers as Seller[]);
  },[calculateRankings, getValues]);
  
  const handleSaveGoals = async (): Promise<boolean> => {
    try {
      const goals = getValues().goals;
      const payload = { store_id: storeId, goals };
      const res = await fetch(`/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
  
      if (!res.ok) {
        let errorData: any = {};
        try { errorData = await res.json(); } catch { const text = await res.text(); errorData = { raw: text }; }
        console.error("Erro ao salvar metas:", res.status, errorData);
        throw new Error(errorData.details || errorData.error || errorData.raw || 'Falha ao salvar metas');
      }
      return true;
    } catch(error) {
      toast({ variant: 'destructive', title: 'Erro ao Salvar Metas', description: (error as Error).message });
      return false;
    }
  };


  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`/loja/${storeId}/dashboard?tab=${newTab}`, { scroll: false });
  };

  const handleManagerLogout = () => {
    logoutStore(storeId);
    logoutAll(); 
    toast({ title: "Sessão encerrada", description: "Você saiu do modo de gestor." });
    router.push(`/loja/${storeId}`);
  };

  const handleSellerLogout = () => {
    if (activeTab !== 'admin' && activeTab !== 'loading') {
        logoutSeller(activeTab);
        toast({ title: "Sessão encerrada", description: "Sua sessão foi encerrada com sucesso." });
        router.push(`/loja/${storeId}`);
    }
  };
  
  if (loading || activeTab === "loading" || !currentStore) return <DashboardSkeleton />;

  const isManagerView = isAdmin || isStoreAdmin;

  const safeGoals = {
    performanceBonusEnabled: false,
    ...getValues().goals,
  } as Goals;

  const tabTriggerClass = cn(
    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
    "text-muted-foreground border border-transparent",
    "hover:bg-muted/50",
    "data-[state=active]:bg-primary",
    "data-[state=active]:text-primary-foreground",
    "data-[state=active]:shadow-sm"
  );

  return (
    <TooltipProvider>
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
        <Card className="mb-8 bg-accent/80 backdrop-blur-sm border-border/20 shadow-lg">
             <CardContent className="p-4 grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                <div className="text-left">
                </div>
                
                <div className="text-center">
                  <h1 className="text-3xl font-bold font-headline text-white truncate">
                    {currentStore?.name}
                    {isManagerView && activeTab === 'admin' && (
                      <span className="text-xl font-semibold opacity-80 ml-2">_Gestor_</span>
                    )}
                  </h1>
                   <p className="text-white/80 text-sm">Acompanhe as metas e os ganhos da equipe.</p>
                </div>

                <div className="flex items-center justify-end gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button asChild variant="outline" className="shadow-sm">
                                <Link href={`/loja/${storeId}`}>
                                    <Home className="mr-2 h-4 w-4" />Página da Loja
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Voltar para a seleção de vendedores</p></TooltipContent>
                    </Tooltip>
                    {isManagerView ? (
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button onClick={handleManagerLogout} variant="destructive" className="shadow-sm">
                                  <LogOut className="mr-2 h-4 w-4" />Sair
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Encerrar sessão de gestor</p></TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button onClick={handleSellerLogout} variant="destructive" className="shadow-sm">
                                  <LogOut className="mr-2 h-4 w-4" />Sair
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Encerrar sua sessão</p></TooltipContent>
                      </Tooltip>
                    )}
                </div>
            </CardContent>
        </Card>
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                 {(isManagerView) && (
                    <div className="flex flex-wrap items-center border-b pb-2 gap-x-4 gap-y-2">
                        <TabsList className="h-auto p-1 bg-muted/30 rounded-xl">
                            <Tooltip>
                                <TooltipTrigger>
                                    <TabsTrigger value="admin" className={tabTriggerClass}>
                                        <ShieldCheck className="h-5 w-5 mr-2" /> Painel do Gestor
                                    </TabsTrigger>
                                </TooltipTrigger>
                                <TooltipContent><p>Acessar o painel de gerenciamento da loja</p></TooltipContent>
                            </Tooltip>
                        </TabsList>
                        <div className="flex-1 min-w-0">
                            <TabsList className="h-auto p-1 bg-muted/30 rounded-xl gap-2 overflow-x-auto">
                                {sellers.map((seller) => (
                                    <Tooltip key={seller.id}>
                                        <TooltipTrigger>
                                            <TabsTrigger value={seller.id} className={tabTriggerClass}>{seller.name}</TabsTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent><p>Acessar painel de {seller.name}</p></TooltipContent>
                                    </Tooltip>
                                ))}
                            </TabsList>
                        </div>
                    </div>
                 )}

                {isManagerView && (
                  <TabsContent value="admin" className="mt-6">
                    <AdminTab
                      form={form}
                      storeId={storeId}
                      sellers={sellers}
                      onSellersChange={loadSellers}
                      onIncentivesCalculated={handleIncentivesCalculated}
                      handleSaveGoals={handleSaveGoals}
                      lastUpdated={lastUpdated}
                      incentives={incentives}
                      onArchiveSuccess={dataRefreshCallback}
                    />
                  </TabsContent>
                )}

                {sellers.map((seller) => (
                  <TabsContent key={seller.id} value={seller.id!} className="mt-6">
                    <SellerTab 
                      storeId={storeId} 
                      seller={seller} 
                      goals={safeGoals} 
                      incentives={incentives[seller.id!] || null} 
                      rankings={(rankings[seller.id!] || null) as Record<RankingMetric, number> | null} 
                      lastUpdated={lastUpdated} 
                      isManagerView={isManagerView} 
                    />
                  </TabsContent>
                ))}

              </Tabs>
          </form>
        </Form>
      </div>
    </TooltipProvider>
  );
}