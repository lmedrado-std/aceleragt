
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Home, CheckCircle, Loader2 } from "lucide-react";

import {
  type IncentiveProjectionOutput,
  incentiveProjection,
} from "@/ai/flows/incentive-projection";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Goals, Store, Incentives, Seller } from "@/lib/storage";
import { AdminTab } from "@/components/admin-tab";
import { SellerTab } from "@/components/seller-tab";
import { Skeleton } from "./ui/skeleton";
import { isAdminGlobal, isStoreAuthenticated, isSellerAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";

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
});

export const formSchema = z.object({
  newSellerName: z.string().optional(),
  newSellerPassword: z.string().optional(),
  goals: goalsSchema.partial(),
  sellers: z.array(sellerSchema.partial()),
});

export type FormValues = z.infer<typeof formSchema>;
export type GoalsFormValues = z.infer<typeof goalsSchema>;
export type RankingMetric = "vendas" | "pa" | "ticketMedio";
export type Rankings = Record<string, Record<RankingMetric, number>>;

const DashboardSkeleton = () => (
  <div className="container mx-auto p-4 py-8 md:p-8">
     <div className="w-full bg-[#2B344D] text-primary-foreground p-6 rounded-xl shadow-lg mb-8">
       <header className="flex flex-wrap items-center justify-between gap-4">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </header>
    </div>
    <div className="border-b mb-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
    <Skeleton className="h-[500px] w-full" />
  </div>
);

const parseForAI = (value: any): number => {
    if (typeof value === 'string') {
        const parsedValue = parseFloat(value.replace(',', '.'));
        return isNaN(parsedValue) ? 0 : parsedValue;
    }
    return value || 0;
};

const parseGoalsForAI = (rawGoals: any): Goals => {
    const parsed: any = {};
    for (const key in rawGoals) {
        if (key === 'performanceBonusEnabled') {
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
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newSellerName: "",
      newSellerPassword: "",
      sellers: [],
      goals: {},
    },
  });

  const { reset, getValues } = form;
  const [activeTab, setActiveTab] = useState<string>("loading");
  
  const isAdmin = isAdminGlobal();
  const isStoreAdmin = isStoreAuthenticated(storeId);

  const calculateRankings = useCallback((sellersToRank: Seller[]) => {
    const newRankings: Rankings = {};
    if (!sellersToRank || sellersToRank.length === 0) {
      setRankings({});
      return;
    }
  
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

            if (currentValue !== lastValue) {
                currentRank = index + 1;
                lastValue = currentValue;
            }

            if (!newRankings[seller.id]) {
                newRankings[seller.id] = {} as Record<RankingMetric, number>;
            }
            newRankings[seller.id][metric] = currentRank;
        });
    });
  
    setRankings(newRankings);
  }, []);
  
  const calculateAllIncentives = useCallback(async (sellersData: Seller[], goalsData: any) => {
    const allIncentives: Incentives = {};
    const fixedGoals = parseGoalsForAI(goalsData);

    for (const seller of sellersData) {
        const sellerForAI = {
          id: seller.id,
          name: seller.name,
          avatarId: seller.avatar_id,
          password: seller.password,
          vendas: parseForAI(seller.vendas),
          pa: parseForAI(seller.pa),
          ticketMedio: parseForAI(seller.ticket_medio),
          corridinhaDiaria: parseForAI(seller.corridinha_diaria),
        };
        const result = await incentiveProjection({ 
            seller: sellerForAI, 
            goals: {
                ...fixedGoals,
                performanceBonusEnabled: !!fixedGoals.performanceBonusEnabled,
            }
        });
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
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os vendedores.' });
      return [];
    }
  }, [storeId, form, calculateRankings, toast]);
  
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
        const [storeRes, goalsRes, sellersData] = await Promise.all([
            fetch(`/api/stores/${storeId}`),
            fetch(`/api/goals?storeId=${storeId}`),
            loadSellers()
        ]);

        if (!storeRes.ok) throw new Error('Loja não encontrada');
        const storeData = await storeRes.json();
        setCurrentStore(storeData);

        const goalsData = goalsRes.ok ? await goalsRes.json() : {};
        
        await calculateAllIncentives(sellersData, goalsData);

        form.reset({
            newSellerName: "",
            newSellerPassword: "",
            sellers: sellersData.map((s: Seller) => ({...s, vendas: s.vendas || 0, pa: s.pa || 0, ticket_medio: s.ticket_medio || 0, corridinha_diaria: s.corridinha_diaria || 0})),
            goals: goalsData
        });
        
        if (storeData.last_incentive_calculation) {
            setLastUpdated(storeData.last_incentive_calculation);
        }

        const tabFromUrl = searchParams.get("tab");
        let tabToActivate = tabFromUrl || (sellersData[0]?.id || "admin");

        if (tabToActivate !== "admin" && !sellersData.some((s: Seller) => s.id === tabToActivate)) {
            tabToActivate = sellersData[0]?.id || "admin";
        }
        
        // Default to admin-dashboard if user is admin
        if(isStoreAuthenticated(storeId) || isAdminGlobal()) {
            tabToActivate = tabFromUrl || "admin";
        }


        setActiveTab(tabToActivate);

    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Erro ao carregar dados", description: (error as Error).message });
        router.push('/');
    } finally {
        setLoading(false);
    }
  }, [storeId, form, loadSellers, router, searchParams, toast, calculateAllIncentives, isStoreAdmin, isAdmin]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Route protection
  useEffect(() => {
    if (loading) return;

    const tabFromUrl = searchParams.get("tab") || activeTab;

    if (isAdminGlobal()) return; // Global admin can access anything

    if (tabFromUrl === 'admin') {
      if (!isStoreAuthenticated(storeId)) {
        const redirectUrl = `/dashboard/${storeId}?tab=admin`;
        router.push(`/login/loja?storeId=${storeId}&redirect=${encodeURIComponent(redirectUrl)}`);
      }
    } else if (tabFromUrl && tabFromUrl !== 'loading') { // It's a seller tab
      if (!isStoreAuthenticated(storeId) && !isSellerAuthenticated(tabFromUrl)) {
        const sellerDashboardUrl = `/dashboard/${storeId}?tab=${tabFromUrl}`;
        const sellerLoginUrl = `/login/vendedor?storeId=${storeId}&sellerId=${tabFromUrl}&redirect=${encodeURIComponent(sellerDashboardUrl)}`;
        const lojaLoginUrl = `/login/loja?storeId=${storeId}&redirect=${encodeURIComponent(sellerLoginUrl)}`;
        router.push(lojaLoginUrl);
      }
    }
  }, [storeId, activeTab, searchParams, router, loading, isStoreAdmin]);

  const handleIncentivesCalculated = useCallback(
    (newIncentives: Incentives, newLastUpdated: string) => {
      setIncentives(newIncentives);
      setLastUpdated(newLastUpdated);
      calculateRankings(getValues().sellers as Seller[]);
    },
    [calculateRankings, getValues]
  );
  
  const handleSaveGoals = async () => {
    try {
        const goals = getValues().goals;
        
        const integerFields = [
            "metaMinha", "metaMinhaPrize", "meta", "metaPrize", "metona", "metonaPrize", "metaLendaria",
            "legendariaBonusValorVenda", "legendariaBonusValorPremio",
            "paPrize1", "paPrize2", "paPrize3", "paPrize4",
            "ticketMedioGoal1", "ticketMedioGoal2", "ticketMedioGoal3", "ticketMedioGoal4",
            "ticketMedioPrize1", "ticketMedioPrize2", "ticketMedioPrize3", "ticketMedioPrize4"
        ];

        const cleanedGoals: { [key: string]: any } = {};

        for (const [key, value] of Object.entries(goals)) {
            if (value === null || value === undefined) {
                if (key === 'performanceBonusEnabled') {
                    cleanedGoals[key] = false;
                } else {
                    cleanedGoals[key] = 0;
                }
                continue;
            }

            if (key === 'performanceBonusEnabled') {
                 cleanedGoals[key] = !!value;
                 continue;
            }

            const stringValue = String(value);
            const sanitizedValue = stringValue.replace(',', '.');
            const numericValue = parseFloat(sanitizedValue);

            if (isNaN(numericValue)) {
                cleanedGoals[key] = 0; 
                continue;
            }

            if (integerFields.includes(key)) {
                cleanedGoals[key] = Math.round(numericValue);
            } else {
                cleanedGoals[key] = numericValue;
            }
        }
        
        cleanedGoals.performanceBonusEnabled = !!cleanedGoals.performanceBonusEnabled;

        // Ensure store_id is not nested inside the goals object
        delete cleanedGoals.store_id;
        delete cleanedGoals.id;

        const res = await fetch(`/api/goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ store_id: storeId, goals: cleanedGoals })
        });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.details || errorData.error || 'Falha ao salvar metas');
        }
        toast({
            title: "Metas Salvas!",
            description: "As novas metas e prêmios foram salvos com sucesso.",
            action: <CheckCircle className="text-green-500" />
        });
    } catch(error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`/dashboard/${storeId}?tab=${newTab}`, { scroll: false });
  };
  
  if (loading || activeTab === "loading" || !currentStore) {
    return <DashboardSkeleton />;
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto p-0 md:p-8">
        <div className="w-full bg-[#2B344D] text-primary-foreground p-6 rounded-xl shadow-lg mb-8">
          <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold font-headline">{currentStore?.name}</h1>
              <p className="text-primary-foreground/80">Acompanhe as metas e os ganhos da equipe.</p>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="secondary" className="shadow bg-black/20 hover:bg-black/30 text-white">
                    <Link href={`/loja/${storeId}`}>
                      <Home className="mr-2 h-4 w-4" />
                      Página da Loja
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Voltar para a seleção de vendedores</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </header>
        </div>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="overflow-x-auto pb-2">
                  <TabsList className="h-auto p-0 bg-transparent border-b-0">
                    {sellers.length > 0 ? sellers.map((seller) => (
                      <Tooltip key={seller.id}>
                        <TooltipTrigger asChild>
                           <TabsTrigger
                            key={seller.id}
                            value={seller.id}
                            className="px-4 py-2 rounded-t-md border-b-2 border-transparent transition-all font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-b-blue-700"
                           >
                            {seller.name}
                           </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Acessar painel de {seller.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    )) : !(isAdmin || isStoreAdmin) && (
                      <div className="p-4 text-muted-foreground">Nenhum vendedor cadastrado.</div>
                    )}
                    {(isAdmin || isStoreAdmin) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <TabsTrigger
                            value="admin"
                            className="px-4 py-2 rounded-t-md border-b-2 border-transparent transition-all font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-b-blue-700"
                           >
                            <ShieldCheck className="h-5 w-5 mr-2" /> Admin
                           </TabsTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Painel do Gerente da Loja</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TabsList>
                </div>

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
                  </TabsContent>
                )}

                {sellers.map((seller) => (
                  <TabsContent key={seller.id} value={seller.id!} className="mt-6">
                    <SellerTab
                      seller={seller}
                      goals={getValues().goals as Goals}
                      incentives={incentives[seller.id!] || null}
                      rankings={(rankings[seller.id!] || null) as Record<RankingMetric, number> | null}
                      lastUpdated={lastUpdated}
                    />
                  </TabsContent>
                ))}

                {sellers.length === 0 && !(isAdmin || isStoreAdmin) && (
                  <TabsContent value={activeTab} className="mt-10 text-center text-muted-foreground py-10">
                    <p className="text-lg">Bem-vindo!</p>
                    <p>Nenhum vendedor cadastrado nesta loja ainda. Peça ao administrador para adicioná-lo.</p>
                  </TabsContent>
                )}
              </Tabs>
          </form>
        </Form>
      </div>
    </TooltipProvider>
  );
}

    

    
