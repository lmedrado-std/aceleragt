
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Home, CheckCircle, Save, Loader2 } from "lucide-react";

import { type IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Seller,
  Goals,
  Store,
  Incentives,
} from "@/lib/storage";
import { AdminTab } from "@/components/admin-tab";
import { SellerTab } from "@/components/seller-tab";
import { Skeleton } from "./ui/skeleton";

const sellerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome é obrigatório"),
  password: z.string().min(4, "A senha deve ter pelo menos 4 caracteres"),
  avatar_id: z.string(),
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
})

export const formSchema = z.object({
  newSellerName: z.string().optional(),
  newSellerPassword: z.string().optional(),
  goals: goalsSchema,
  sellers: z.array(sellerSchema.partial()),
});

export type FormValues = z.infer<typeof formSchema>;
export type RankingMetric = "vendas" | "pa" | "ticket_medio";
export type Rankings = Record<string, Record<RankingMetric, number>>;

const DashboardSkeleton = () => (
  <div className="container mx-auto p-4 py-8 md:p-8">
     <div className="w-full bg-gradient-to-r from-primary to-destructive text-primary-foreground p-6 rounded-xl shadow-lg mb-8">
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

export function GoalGetterDashboard({ storeId }: { storeId: string }) {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [mounted, setMounted] = useState(false);
  const [incentives, setIncentives] = useState<Incentives>({});
  const [rankings, setRankings] = useState<Rankings>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newSellerName: "",
      newSellerPassword: "",
      sellers: [],
      goals: {},
    },
  });

  const { reset, getValues, setValue } = form;
  const [activeTab, setActiveTab] = useState<string>("loading");
  
  const calculateRankings = useCallback((currentSellers: Partial<Seller>[]) => {
    const newRankings: Rankings = {};
    if (!currentSellers || currentSellers.length === 0) {
      setRankings({});
      return;
    }

    const metrics: RankingMetric[] = ["vendas", "pa", "ticket_medio"];

    metrics.forEach((metric) => {
      const rankedSellers = currentSellers
        .filter(s => (s[metric] || 0) > 0)
        .sort((a, b) => (b[metric] || 0) - (a[metric] || 0));

      let currentRank = 0;
      let lastValue: number | null = null;

      rankedSellers.forEach((seller, index) => {
        if (!seller.id) return;
        const currentValue = seller[metric] || 0;
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

  const fetchSellersAndGoals = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch sellers
      const sellersRes = await fetch(`/api/sellers?storeId=${storeId}`);
      if (!sellersRes.ok) throw new Error("Falha ao carregar vendedores");
      const sellersData = await sellersRes.json();
      setSellers(sellersData);
      
      // Fetch goals
      const goalsRes = await fetch(`/api/goals/${storeId}`);
      if (!goalsRes.ok) {
        if (goalsRes.status === 404) {
             console.log("Nenhuma meta encontrada para esta loja. Usando valores padrão.");
             setValue("goals", {});
        } else {
            throw new Error("Falha ao carregar metas");
        }
      } else {
        const goalsData = await goalsRes.json();
        setValue("goals", goalsData);
      }
      
      // Set form values after data is fetched
      setValue("sellers", sellersData);

      calculateRankings(sellersData);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar os dados da loja.' });
    } finally {
      setIsLoading(false);
    }
  }, [storeId, setValue, toast, calculateRankings]);


  const handleIncentivesCalculated = useCallback(
    (newIncentives: Incentives, newLastUpdated: string) => {
      setIncentives(newIncentives);
      setLastUpdated(newLastUpdated);
      calculateRankings(getValues().sellers ?? []);
    },
    [calculateRankings, getValues]
  );

  const handleSaveGoals = async () => {
      try {
        const currentGoals = getValues().goals;
        const res = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...currentGoals, store_id: storeId }),
        });

        if (!res.ok) throw new Error('Falha ao salvar metas');
        
        toast({
            title: "Metas Salvas!",
            description: "As novas metas e prêmios foram salvos com sucesso.",
            action: <CheckCircle className="text-green-500" />
        })

      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar as metas.' });
      }
  }

  useEffect(() => {
    setMounted(true);
    const adminAuthenticated = sessionStorage.getItem("adminAuthenticated") === "true";
    setIsAdmin(adminAuthenticated);

    fetchSellersAndGoals();

    const tabFromUrl = searchParams.get("tab");
    let tabToActivate = tabFromUrl || (adminAuthenticated ? "admin" : "loading");
    
    if (!isLoading && sellers.length > 0 && tabToActivate === 'loading') {
       tabToActivate = sellers[0].id;
    }
    
    // Auth & redirect logic
    if (tabToActivate !== "loading") {
      if (tabToActivate === "admin") {
        if (!adminAuthenticated) {
          const destination = `/dashboard/${storeId}?tab=admin`;
          router.push(`/login?redirect=${encodeURIComponent(destination)}`);
          return;
        }
      } else if (sellers.some(s => s.id === tabToActivate)) {
         if (
          !adminAuthenticated &&
          !sessionStorage.getItem(`sellerAuthenticated-${tabToActivate}`)
        ) {
          const destination = `/dashboard/${storeId}?tab=${tabToActivate}`;
          router.push(
            `/login/vendedor?storeId=${storeId}&sellerId=${tabToActivate}&redirect=${encodeURIComponent(destination)}`);
          return;
        }
      }
    }
    setActiveTab(tabToActivate);

  }, [storeId, router, searchParams, fetchSellersAndGoals, isLoading, sellers]);

  
  const handleTabChange = (newTab: string) => {
    const adminAuthenticated = sessionStorage.getItem("adminAuthenticated") === "true";

    if (newTab === "admin" && !adminAuthenticated) {
      const destination = `/dashboard/${storeId}?tab=admin`;
      router.push(`/login?redirect=${encodeURIComponent(destination)}`);
      return;
    }

    if (newTab !== "admin" && !adminAuthenticated && !sessionStorage.getItem(`sellerAuthenticated-${newTab}`)) {
      const destination = `/dashboard/${storeId}?tab=${newTab}`;
      router.push(
        `/login/vendedor?storeId=${storeId}&sellerId=${newTab}&redirect=${encodeURIComponent(destination)}`,
        { scroll: false }
      );
      return;
    }

    setActiveTab(newTab);
    router.push(`/dashboard/${storeId}?tab=${newTab}`, { scroll: false });
  };
  
  if (!mounted || activeTab === "loading" || isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 py-8 md:p-8 relative">
       <div className="w-full bg-gradient-to-r from-primary to-destructive text-primary-foreground p-6 rounded-xl shadow-lg mb-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-headline">
                {currentStore?.name || "Carregando..."}
              </h1>
              <p className="text-primary-foreground/80">Acompanhe as metas e os ganhos da equipe.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" className="shadow">
              <Link href={`/loja/${storeId}`}>
                <Home className="mr-2 h-4 w-4" />
                Página da Loja
              </Link>
            </Button>
            {isAdmin && (
              <Button asChild variant="secondary" className="shadow">
                <Link href="/admin">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Admin Global
                </Link>
              </Button>
            )}
          </div>
        </header>
      </div>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
          <TooltipProvider>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="flex items-center border-b justify-between">
                <TabsList className="flex-wrap h-auto p-0 bg-transparent border-b-0">
                  {sellers.map((seller) => (
                    <TabsTrigger
                      key={seller.id}
                      value={seller.id!}
                      className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      {seller.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="flex items-center gap-4">
                  
                  {isAdmin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TabsList className="h-auto p-0 bg-transparent border-b-0">
                          <TabsTrigger
                            value="admin"
                            className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                          >
                            <ShieldCheck className="h-5 w-5 mr-2" />
                            Admin
                          </TabsTrigger>
                        </TabsList>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Painel do Administrador da Loja</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              {isAdmin && (
                <TabsContent value="admin" className="mt-6">
                  <AdminTab
                    form={form}
                    storeId={storeId}
                    sellers={sellers}
                    onSellersChange={fetchSellersAndGoals}
                    onIncentivesCalculated={handleIncentivesCalculated}
                    handleSaveGoals={handleSaveGoals}
                    lastUpdated={lastUpdated}
                  />
                </TabsContent>
              )}

              {sellers.map((seller) => (
                <TabsContent key={seller.id} value={seller.id!} className="mt-6">
                  <SellerTab
                    seller={seller as Seller}
                    goals={getValues().goals}
                    incentives={incentives[seller.id!]}
                    rankings={rankings[seller.id!]}
                  />
                </TabsContent>
              ))}

              {sellers.length === 0 && !isAdmin && (
                <TabsContent
                  value="no-sellers"
                  className="mt-10 text-center text-muted-foreground py-10"
                >
                  <p className="text-lg">Bem-vindo!</p>
                  <p>Parece que não há vendedores cadastrados nesta loja ainda.</p>
                  <p>Peça ao administrador para adicioná-lo.</p>
                </TabsContent>
              )}
            </Tabs>
          </TooltipProvider>
        </form>
      </Form>
    </div>
  );
}
