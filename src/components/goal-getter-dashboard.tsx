
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Home, CheckCircle, Save } from "lucide-react";

import {
  incentiveProjection,
  type IncentiveProjectionOutput,
} from "@/ai/flows/incentive-projection";
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
  loadStateFromStorage,
  saveState,
  Seller,
  Goals,
  Store,
  Incentives,
} from "@/lib/storage";
import { AdminTab } from "@/components/admin-tab";
import { SellerTab } from "@/components/seller-tab";
import { Skeleton } from "./ui/skeleton";

const availableAvatarIds = [
  "avatar1",
  "avatar2",
  "avatar3",
  "avatar4",
  "avatar5",
  "avatar6",
  "avatar7",
  "avatar8",
  "avatar9",
  "avatar10",
];

const sellerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome é obrigatório"),
  password: z.string().min(4, "A senha deve ter pelo menos 4 caracteres"),
  avatarId: z.string(),
  vendas: z.coerce.number().min(0).default(0),
  pa: z.coerce.number().min(0).default(0),
  ticketMedio: z.coerce.number().min(0).default(0),
  corridinhaDiaria: z.coerce.number().min(0).default(0),
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
export type RankingMetric = "vendas" | "pa" | "ticketMedio";
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
  const [mounted, setMounted] = useState(false);
  const [incentives, setIncentives] = useState<Incentives>({});
  const [rankings, setRankings] = useState<Rankings>({});
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

  const { reset, getValues, setValue } = form;
  const [activeTab, setActiveTab] = useState<string>("loading");

  // 📊 Rankings
  const calculateRankings = useCallback((sellers: Partial<Seller>[]) => {
    const newRankings: Rankings = {};
    if (!sellers || sellers.length === 0) {
      setRankings({});
      return;
    }

    const metrics: RankingMetric[] = ["vendas", "pa", "ticketMedio"];

    metrics.forEach((metric) => {
      const rankedSellers = sellers
        .filter(s => (s[metric] || 0) > 0) // apenas vendedores com vendas
        .sort((a, b) => (b[metric] || 0) - (a[metric] || 0));

      let currentRank = 0;
      let lastValue: number | null = null;

      rankedSellers.forEach((seller, index) => {
        if (!seller.id) return;

        const currentValue = seller[metric] || 0;

        // 🔹 Se a venda for diferente, atualiza posição
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


  // 🎯 Incentivos
  const handleIncentivesCalculated = useCallback(
    (newIncentives: Incentives) => {
      setIncentives(newIncentives);
      const currentState = loadStateFromStorage();
      currentState.incentives[storeId] = newIncentives;
      saveState(currentState);
      calculateRankings(getValues().sellers ?? []);
    },
    [storeId, calculateRankings, getValues]
  );

  // 💾 Salvar Metas Manualmente
  const handleSaveGoals = () => {
      const currentState = loadStateFromStorage();
      currentState.goals[storeId] = getValues().goals;
      saveState(currentState);
      toast({
          title: "Metas Salvas!",
          description: "As novas metas e prêmios foram salvos com sucesso.",
          action: <CheckCircle className="text-green-500" />
      })
  }

  // ➕ Adicionar vendedor (corrigido para salvar imediatamente)
  const addSeller = useCallback(
    (name: string, pass: string) => {
      const currentSellers = getValues("sellers") || [];
      const existingAvatarIds = new Set(currentSellers.map((s) => s.avatarId));
      let randomAvatarId =
        availableAvatarIds[Math.floor(Math.random() * availableAvatarIds.length)];

      if (existingAvatarIds.size < availableAvatarIds.length) {
        while (existingAvatarIds.has(randomAvatarId)) {
          randomAvatarId =
            availableAvatarIds[Math.floor(Math.random() * availableAvatarIds.length)];
        }
      }

      const newSeller: Seller = {
        id: crypto.randomUUID(),
        name,
        password: pass,
        avatarId: randomAvatarId,
        vendas: 0,
        pa: 0,
        ticketMedio: 0,
        corridinhaDiaria: 0,
      };

      const updatedSellers = [...currentSellers, newSeller];
      setValue("sellers", updatedSellers, { shouldDirty: true, shouldValidate: true, shouldTouch: true });

      // ✅ salva imediatamente no storage
      const currentState = loadStateFromStorage();
      currentState.sellers[storeId] = updatedSellers as Seller[];
      currentState.goals[storeId] = getValues("goals");
      currentState.incentives[storeId] = { ...incentives, [newSeller.id]: null };
      saveState(currentState);

      setIncentives(currentState.incentives[storeId]);

      toast({
        title: "Vendedor adicionado!",
        description: `${name} foi adicionado(a) com sucesso.`,
      });

      router.push(`/dashboard/${storeId}?tab=${newSeller.id}`, { scroll: false });
    },
    [getValues, setValue, storeId, router, toast, incentives]
  );

  // 🔄 Carregar dados iniciais
  useEffect(() => {
    setMounted(true);
    const state = loadStateFromStorage();
    const store = state.stores.find((s) => s.id === storeId);

    if (!store) {
      setTimeout(
        () =>
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Loja não encontrada.",
          }),
        0
      );
      router.push("/");
      return;
    }

    setCurrentStore(store);

    const initialSellers = state.sellers[storeId] || [];
    const initialFormValues: FormValues = {
      newSellerName: "",
      newSellerPassword: "",
      goals: state.goals[storeId] || state.goals.default,
      sellers: initialSellers,
    };
    reset(initialFormValues);
    const currentIncentives = state.incentives[storeId] || {};
    setIncentives(currentIncentives);
    calculateRankings(initialSellers);

    const adminAuthenticated = sessionStorage.getItem("adminAuthenticated") === "true";
    setIsAdmin(adminAuthenticated);

    const sellersForStore = initialSellers;
    const tabFromUrl = searchParams.get("tab");
    let tabToActivate =
      tabFromUrl || (adminAuthenticated ? "admin" : sellersForStore.length > 0 && sellersForStore[0].id ? sellersForStore[0].id : "admin");

    if (tabToActivate !== "admin" && !sellersForStore.some((s) => s.id === tabToActivate)) {
      tabToActivate = adminAuthenticated ? "admin" : sellersForStore.length > 0 && sellersForStore[0].id ? sellersForStore[0].id : "admin";
    }

    if (tabToActivate === "admin") {
      if (!adminAuthenticated) {
        const destination = `/dashboard/${storeId}?tab=admin`;
        router.push(`/login?redirect=${encodeURIComponent(destination)}`);
        return;
      }
    } else {
      if (!sellersForStore.find((s) => s.id === tabToActivate)) {
        const fallbackTab = adminAuthenticated ? "admin" : sellersForStore.length > 0 && sellersForStore[0].id ? sellersForStore[0].id : "admin";
        router.push(`/dashboard/${storeId}?tab=${fallbackTab}`);
        return;
      }
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
    setActiveTab(tabToActivate);
  }, [storeId, reset, router, toast, searchParams, calculateRankings]);

  
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

  const currentValues = getValues();
  const validSellers = (currentValues.sellers || []).filter(s => s && s.id);
  
  if (!mounted || activeTab === "loading") {
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
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Todas as Lojas
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
                  {validSellers.map((seller) => (
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
                    onIncentivesCalculated={handleIncentivesCalculated}
                    incentives={incentives}
                    addSeller={addSeller}
                    handleSaveGoals={handleSaveGoals}
                  />
                </TabsContent>
              )}

              {validSellers.map((seller) => (
                <TabsContent key={seller.id} value={seller.id!} className="mt-6">
                  <SellerTab
                    seller={seller as Seller}
                    goals={currentValues.goals}
                    incentives={incentives[seller.id!]}
                    rankings={rankings[seller.id!]}
                  />
                </TabsContent>
              ))}

              {validSellers.length === 0 && !isAdmin && (
                <TabsContent
                  value={activeTab}
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
