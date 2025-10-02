
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Home, History, ArrowUpRight, ArrowDownRight, Minus, Loader2 } from "lucide-react";

import { incentiveProjection } from "@/ai/flows/incentive-projection";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Goals, Store, Incentives, Seller } from "@/lib/storage";
import { AdminTab } from "@/components/admin-tab";
import { SellerTab } from "@/components/seller-tab";
import { Skeleton } from "./ui/skeleton";
import { isAdminGlobal, isStoreAuthenticated } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// --- SCHEMA & TYPES ---
const sellerSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar_id: z.string(),
  store_id: z.string(),
  vendas: z.coerce.number().default(0),
  pa: z.coerce.number().default(0),
  ticket_medio: z.coerce.number().default(0),
  corridinha_diaria: z.coerce.number().default(0),
  password: z.string().optional(),
});

const goalsSchema = z.object({
  metaMinha: z.coerce.number().default(0),
  meta: z.coerce.number().default(0),
  metona: z.coerce.number().default(0),
  metaLendaria: z.coerce.number().default(0),
  legendariaBonusValorVenda: z.coerce.number().default(0),
  legendariaBonusValorPremio: z.coerce.number().default(0),
  performanceBonusEnabled: z.boolean().optional().default(false),
  metaMinhaPrize: z.coerce.number().default(0),
  metaPrize: z.coerce.number().default(0),
  metonaPrize: z.coerce.number().default(0),
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
});

const formSchema = z.object({
  sellers: z.array(sellerSchema),
  goals: goalsSchema,
  newSellerName: z.string().optional(),
  newSellerPassword: z.string().optional(),
});

export type FormValues = z.infer<typeof formSchema>;
export type GoalsFormValues = z.infer<typeof goalsSchema>;
export type SellerFormValues = z.infer<typeof sellerSchema>;
export type RankingMetric = "vendas" | "pa" | "ticketMedio" | "totalPrize";

// --- MOVED FROM ADMIN DASHBOARD ---
// Interfaces
interface ArchivedPeriod { period: string; storeId: string; sellerCount: number; }
interface SellerHistoryDetail { id: string; period: string; seller_id: string; seller_name: string; vendas: number; pa: number; ticket_medio: number; total_prize: number; }
interface PeriodComparisonData { current: SellerHistoryDetail[]; previous: SellerHistoryDetail[]; }

// Helper Function
const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);

// Comparison Component
function Comparison({ current, previous }: { current: number; previous: number | undefined; }) {
  if (previous == null) return null;
  const diff = current - previous;
  if(diff === 0 && current === 0) return null;
  const percent = previous === 0 ? (current > 0 ? 100.0 : 0) : (diff / previous) * 100;
  const isUp = diff > 0;
  const isDown = diff < 0;
  const color = isUp ? 'text-green-600' : isDown ? 'text-red-600' : 'text-muted-foreground';
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;
  return (
    <span className={`ml-2 text-xs font-mono flex items-center gap-1 ${color}`}>
      <Icon className="w-3 h-3" />
      {previous === 0 && current > 0 ? 'Novo' : `${percent.toFixed(0)}%`}
    </span>
  );
}

// Archived Periods Component
function ArchivedPeriods({ storeId }: { storeId: string }) {
    const [periods, setPeriods] = useState<ArchivedPeriod[]>([]);
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState<Record<string, PeriodComparisonData>>({});
    const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    useEffect(() => {
        const fetchPeriods = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/history');
                if (!res.ok) throw new Error('Falha ao buscar histórico de períodos.');
                const allPeriods = await res.json();
                const storePeriods = allPeriods.filter((p: ArchivedPeriod) => p.storeId === storeId);
                setPeriods(storePeriods);
            } catch (e) {
                toast({ variant: 'destructive', title: 'Erro', description: e instanceof Error ? e.message : 'Não foi possível carregar o histórico.' });
            } finally {
                setLoading(false);
            }
        };
        fetchPeriods();
    }, [storeId, toast]);

    const handleAccordionChange = async (value: string) => {
        if (!value || details[value]) return;

        const [period, currentStoreId] = value.split('|');
        setLoadingDetails(prev => ({ ...prev, [value]: true }));
        try {
            const res = await fetch(`/api/history?period=${encodeURIComponent(period)}&storeId=${currentStoreId}`);
            if (!res.ok) throw new Error(`Falha ao buscar detalhes.`);
            const data = await res.json();
            setDetails(prev => ({ ...prev, [value]: data }));
        } catch (e) {
            toast({ variant: 'destructive', title: 'Erro', description: e instanceof Error ? e.message : 'Não foi possível carregar os detalhes.' });
        } finally {
            setLoadingDetails(prev => ({ ...prev, [value]: false }));
        }
    };

    if (loading) return <div className="flex items-center justify-center h-24"><Loader2 className="mr-2 h-8 w-8 animate-spin" /><p>Carregando histórico...</p></div>;
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
                                <AccordionTrigger><div className='flex justify-between w-full pr-4'><span>{period}</span><span className='text-muted-foreground'>{`Vendedores: ${sellerCount}`}</span></div></AccordionTrigger>
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
export function GoalGetterDashboard({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [incentives, setIncentives] = useState<Incentives>({});
  const [rankings, setRankings] = useState<any>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sellers: [],
      goals: {},
      newSellerName: "",
      newSellerPassword: "",
    },
  });

  const isAdmin = isAdminGlobal();
  const isStoreAdmin = isStoreAuthenticated(storeId);
  const initialTab = searchParams.get("tab") || (sellers.length > 0 ? sellers[0].id : (isAdmin || isStoreAdmin ? "admin" : ""));
  const [activeTab, setActiveTab] = useState<string>("loading");

  const calculateRankings = useCallback((sellersToRank: Seller[], incentivesToRank: Incentives) => {
    const metrics: RankingMetric[] = ["vendas", "pa", "ticketMedio", "totalPrize"];
    const newRankings: any = {};

    sellersToRank.forEach(seller => {
        newRankings[seller.id] = {};
    });

    metrics.forEach(metric => {
        const sortedSellers = [...sellersToRank].sort((a, b) => {
            if (metric === "totalPrize") {
                const prizeA = Object.values(incentivesToRank[a.id] || {}).reduce((sum, val) => sum + (val || 0), 0);
                const prizeB = Object.values(incentivesToRank[b.id] || {}).reduce((sum, val) => sum + (val || 0), 0);
                return prizeB - prizeA;
            }
            // Ensure values are numbers for correct sorting
            const valueA = Number(a[metric as keyof Seller] || 0);
            const valueB = Number(b[metric as keyof Seller] || 0);
            return valueB - valueA;
        });

        sortedSellers.forEach((seller, index) => {
            if (newRankings[seller.id]) {
                newRankings[seller.id][metric] = index + 1;
            }
        });
    });

    setRankings(newRankings);
  }, []);

  const calculateAllIncentives = useCallback(async (sellersData: Seller[], goalsData: Goals) => {
      const allIncentives: Incentives = {};
      for (const seller of sellersData) {
        const result = await incentiveProjection({ seller: seller as any, goals: goalsData as any });
        allIncentives[seller.id] = result;
      }
      setIncentives(allIncentives);
      return allIncentives;
  }, []);

  const loadSellers = useCallback(async () => {
    if (!storeId) return;
    try {
      const res = await fetch(`/api/sellers?storeId=${storeId}`);
      if (!res.ok) throw new Error("Failed to fetch sellers");
      const sellersData = await res.json();
      setSellers(sellersData);
      form.setValue("sellers", sellersData);
      return sellersData;
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao carregar vendedores", description: (e as Error).message });
      return [];
    }
  }, [storeId, form, toast]);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [storeRes, goalsRes] = await Promise.all([
        fetch(`/api/stores/${storeId}`),
        fetch(`/api/goals?storeId=${storeId}`),
      ]);

      if (!storeRes.ok) throw new Error("Loja não encontrada");
      const storeData = await storeRes.json();
      setCurrentStore(storeData);
      setLastUpdated(storeData.last_incentive_calculation);

      if (!goalsRes.ok) throw new Error("Metas não encontradas");
      const goalsData = await goalsRes.json();
      form.setValue("goals", goalsData);

      const sellersData = await loadSellers();

      if (sellersData && goalsData) {
        const calculatedIncentives = await calculateAllIncentives(sellersData, goalsData);
        calculateRankings(sellersData, calculatedIncentives);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao carregar dados", description: (e as Error).message });
      router.push(`/loja/${storeId}`);
    } finally {
      setLoading(false);
    }
  }, [storeId, form, loadSellers, calculateAllIncentives, calculateRankings, toast, router]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (loading) return;

    let defaultTab = "";
    if (isAdmin || isStoreAdmin) {
      defaultTab = "admin";
    } else if (sellers.length > 0) {
      defaultTab = sellers[0].id;
    }
    
    const tabFromUrl = searchParams.get("tab");

    if (tabFromUrl) {
      const isValidTab = (isAdmin || isStoreAdmin) && tabFromUrl === "admin" || sellers.some(s => s.id === tabFromUrl);
       setActiveTab(isValidTab ? tabFromUrl : defaultTab);
    } else {
       setActiveTab(defaultTab);
    }
    
  }, [loading, searchParams, sellers, isAdmin, isStoreAdmin]);


  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`/loja/${storeId}/dashboard?tab=${newTab}`, { scroll: false });
  };
  
  const handleSaveGoals = async () => {
    try {
        const values = form.getValues();
        const res = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ store_id: storeId, goals: values.goals })
        });
        if (!res.ok) throw new Error('Falha ao salvar metas');
        
        await loadInitialData(); // Reload all data to ensure consistency
        
    } catch(error) {
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  };

  const handleIncentivesCalculated = (newIncentives: Incentives, newLastUpdated: string) => {
    setIncentives(newIncentives);
    setLastUpdated(newLastUpdated);
    calculateRankings(sellers, newIncentives);
  };
  
  if (loading || activeTab === "loading" || !currentStore) {
      return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-64" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
            <Skeleton className="h-12 w-full max-w-lg" />
            <Skeleton className="h-[400px] w-full" />
        </div>
      );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-0 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard: {currentStore?.name}
            </h1>
            <p className="text-muted-foreground">
              Acompanhe o desempenho da equipe e as metas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(isAdmin || isStoreAdmin) && (
              <Button
                variant="outline"
                onClick={() => handleTabChange("admin")}
                disabled={activeTab === "admin"}
              >
                <ShieldCheck className="mr-2" />
                Admin
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href={`/loja/${storeId}`}>
                <Home className="mr-2" />
                Início da Loja
              </Link>
            </Button>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                 <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 h-auto">
                    {(isAdmin || isStoreAdmin) && (
                        <TabsTrigger value="admin" className="h-16 flex-col">
                            <ShieldCheck/>
                            <span className="mt-1">Admin</span>
                        </TabsTrigger>
                    )}
                    {sellers.map(seller => (
                        <TabsTrigger key={seller.id} value={seller.id} className="h-16 flex-col">
                            <span>{seller.name}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {(isAdmin || isStoreAdmin) && (
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
                    />
                    <div className="mt-8">
                      <ArchivedPeriods storeId={storeId} />
                    </div>
                  </TabsContent>
                )}

                {sellers.map(seller => (
                    <TabsContent key={seller.id} value={seller.id} className="mt-6">
                        <SellerTab 
                            seller={seller} 
                            goals={form.getValues().goals as Goals}
                            incentives={incentives[seller.id] || null}
                            rankings={rankings[seller.id] || null}
                            lastUpdated={lastUpdated}
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

    