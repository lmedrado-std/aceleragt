
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

export const formSchema = z.object({
  newSellerName: z.string().optional(),
  newSellerPassword: z.string().optional(),
  goals: z.record(z.any()), // metas flexíveis
  sellers: z.array(sellerSchema),
});

export type FormValues = z.infer<typeof formSchema>;
export type RankingMetric = "vendas" | "pa" | "ticketMedio" | "corridinhaDiaria";
export type Rankings = Record<string, Record<RankingMetric, number>>;

const DashboardSkeleton = () => (
  <div className="container mx-auto p-4 py-8 md:p-8">
    <header className="flex items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </header>
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
  const calculateRankings = useCallback(
    (sellers: Seller[], currentIncentives: Record<string, IncentiveProjectionOutput | null>) => {
      const newRankings: Rankings = {};
      if (!sellers || sellers.length === 0) {
        setRankings({});
        return;
      }
      const metrics: RankingMetric[] = ["vendas", "pa", "ticketMedio"];
      const totalGains: Record<string, number> = {};

      sellers.forEach(seller => {
        const sellerIncentives = currentIncentives[seller.id];
        totalGains[seller.id] = sellerIncentives
          ? Object.values(sellerIncentives).reduce((sum, val) => sum + (val || 0), 0)
          : 0;
      });

      metrics.forEach((metric) => {
        const sortedSellers = [...sellers].sort((a, b) => {
          const valueA =
            metric === "corridinhaDiaria"
              ? (totalGains[a.id] || 0)
              : (a[metric as keyof Omit<Seller, "id" | "name" | "avatarId" | "password">] || 0);
          const valueB =
            metric === "corridinhaDiaria"
              ? (totalGains[b.id] || 0)
              : (b[metric as keyof Omit<Seller, "id" | "name" | "avatarId" | "password">] || 0);
          return valueB - valueA;
        });

        let rank = 1;
        for (let i = 0; i < sortedSellers.length; i++) {
          if (i > 0 && sortedSellers[i][metric as keyof Seller]! < sortedSellers[i - 1][metric as keyof Seller]!) {
            rank = i + 1;
          }
          const sellerId = sortedSellers[i].id;
          if (!newRankings[sellerId]) {
            newRankings[sellerId] = {} as Record<RankingMetric, number>;
          }
          newRankings[sellerId][metric] = rank;
        }
      });

      setRankings(newRankings);
    },
    []
  );

  // 🎯 Incentivos
  const handleIncentivesCalculated = useCallback(
    (newIncentives: Incentives) => {
      setIncentives(newIncentives);
      const currentState = loadStateFromStorage();
      currentState.incentives[storeId] = newIncentives;
      saveState(currentState);
      calculateRankings(getValues().sellers, newIncentives);
    },
    [storeId, calculateRankings, getValues]
  );

  // 💾 Salvar Metas Manualmente
  const handleSaveGoals = () => {
      const currentState = loadStateFromStorage();
      currentState.goals[storeId] = getValues().goals as Goals;
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
      currentState.sellers[storeId] = updatedSellers;
      currentState.goals[storeId] = getValues("goals") as Goals;
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

    const initialFormValues = {
      newSellerName: "",
      newSellerPassword: "",
      goals: state.goals[storeId] || state.goals.default,
      sellers: state.sellers[storeId] || [],
    };
    reset(initialFormValues);
    const currentIncentives = state.incentives[storeId] || {};
    setIncentives(currentIncentives);
    calculateRankings(initialFormValues.sellers, currentIncentives);

    const adminAuthenticated = sessionStorage.getItem("adminAuthenticated") === "true";
    setIsAdmin(adminAuthenticated);

    const sellersForStore = state.sellers[storeId] || [];
    const tabFromUrl = searchParams.get("tab");
    let tabToActivate =
      tabFromUrl || (adminAuthenticated ? "admin" : sellersForStore.length > 0 ? sellersForStore[0].id : "admin");

    if (tabToActivate !== "admin" && !sellersForStore.some((s) => s.id === tabToActivate)) {
      tabToActivate = adminAuthenticated ? "admin" : sellersForStore.length > 0 ? sellersForStore[0].id : "admin";
    }

    if (tabToActivate === "admin") {
      if (!adminAuthenticated) {
        const destination = `/dashboard/${storeId}?tab=admin`;
        router.push(`/login?redirect=${encodeURIComponent(destination)}`);
        return;
      }
    } else {
      if (!sellersForStore.find((s) => s.id === tabToActivate)) {
        const fallbackTab = adminAuthenticated ? "admin" : sellersForStore.length > 0 ? sellersForStore[0].id : "admin";
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
  
  if (!mounted || activeTab === "loading") {
    return <DashboardSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 py-8 md:p-8 relative">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">
              {currentStore?.name || "Carregando..."}
            </h1>
            <p className="text-muted-foreground">Acompanhe as metas e os ganhos da equipe.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Todas as Lojas
            </Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="outline">
              <Link href="/admin">
                <ShieldCheck className="mr-2 h-4 w-4" />
                Admin Global
              </Link>
            </Button>
          )}
        </div>
      </header>

      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
          <TooltipProvider>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="flex items-center border-b justify-between">
                <TabsList className="flex-wrap h-auto p-0 bg-transparent border-b-0">
                  {(currentValues.sellers || []).map((seller) => (
                    <TabsTrigger
                      key={seller.id}
                      value={seller.id}
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

              {(currentValues.sellers || []).map((seller) => (
                <TabsContent key={seller.id} value={seller.id} className="mt-6">
                  <SellerTab
                    seller={seller}
                    goals={currentValues.goals as Goals}
                    incentives={incentives[seller.id]}
                    rankings={rankings[seller.id]}
                  />
                </TabsContent>
              ))}

              {(currentValues.sellers || []).length === 0 && !isAdmin && (
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
