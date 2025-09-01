
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Home,
} from "lucide-react";

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
import { loadState, saveState, Seller, Incentives, getInitialState, Goals, Store } from "@/lib/storage";
import { AdminTab } from "@/components/admin-tab";
import { SellerTab } from "@/components/seller-tab";


const sellerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome é obrigatório"),
  password: z.string().min(4, "A senha deve ter pelo menos 4 caracteres"),
  avatarId: z.string(),
  vendas: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0).default(0),
  pa: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0).default(0),
  ticketMedio: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0).default(0),
  corridinhaDiaria: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0).default(0),
});

export const formSchema = z.object({
  newSellerName: z.string(),
  newSellerPassword: z.string(),
  goals: z.object({
    metaMinha: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    meta: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    metona: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    metaLendaria: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    legendariaBonusValorVenda: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(1, "Deve ser maior que zero"),
    legendariaBonusValorPremio: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    metaMinhaPrize: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    metaPrize: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    metonaPrize: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    paGoal1: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    paGoal2: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    paGoal3: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    paGoal4: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    paPrize1: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    paPrize2: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    paPrize3: z.coerce.number({ invalid_type_error: "Deve be um número" }).min(0),
    paPrize4: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    ticketMedioGoal1: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    ticketMedioGoal2: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    ticketMedioGoal3: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    ticketMedioGoal4: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    ticketMedioPrize1: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    ticketMedioPrize2: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    ticketMedioPrize3: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    ticketMedioPrize4: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  }),
  sellers: z.array(sellerSchema),
});

export type FormValues = z.infer<typeof formSchema>;
export type RankingMetric = 'vendas' | 'pa' | 'ticketMedio' | 'corridinhaDiaria';
export type Rankings = Record<string, Record<RankingMetric, number>>;

export function GoalGetterDashboard({ storeId }: { storeId: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [incentives, setIncentives] = useState<Incentives>({});
  const [rankings, setRankings] = useState<Rankings>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggedInSellerId, setLoggedInSellerId] = useState<string | null>(null);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getInitialStateForForm(),
  });
  
  function getInitialStateForForm(): FormValues {
      const state = loadState();
      return {
        newSellerName: "",
        newSellerPassword: "",
        goals: state.goals[storeId] || state.goals.default,
        sellers: state.sellers[storeId] || [],
      }
  }

  const { watch, reset, formState: { isDirty } } = form;
  const currentValues = watch();

  const [activeTab, setActiveTab] = useState(() => {
    const state = loadState();
    const sellers = state.sellers[storeId] || [];
    return sellers?.[0]?.id ?? 'admin';
  });

  const calculateRankings = useCallback((sellers: Seller[], currentIncentives: Record<string, IncentiveProjectionOutput | null>) => {
    const newRankings: Rankings = {};
    if (!sellers || sellers.length === 0) {
        setRankings({});
        return;
    }
    const metrics: RankingMetric[] = ['vendas', 'pa', 'ticketMedio', 'corridinhaDiaria'];

    metrics.forEach(metric => {
        const sortedSellers = [...sellers]
            .map(seller => {
                let value = 0;
                if (metric === 'corridinhaDiaria') {
                    const incentiveData = currentIncentives[seller.id];
                    value = incentiveData?.corridinhaDiariaBonus || 0;
                }
                else {
                    value = seller[metric as keyof Omit<Seller, 'id' | 'name' | 'avatarId' | 'password'>] as number;
                }
                return { id: seller.id, value };
            })
            .sort((a, b) => b.value - a.value);

        let rank = 1;
        for (let i = 0; i < sortedSellers.length; i++) {
            if (i > 0 && sortedSellers[i].value < sortedSellers[i - 1].value) {
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
  }, []);

  const loadDataForStore = useCallback(() => {
    try {
      const state = loadState();
      const store = state.stores.find(s => s.id === storeId);
      if (!store) {
        setTimeout(() => toast({ variant: "destructive", title: "Erro", description: "Loja não encontrada." }), 0);
        router.push('/');
        return;
      }
       setCurrentStore(store);
      if (store.themeColor) {
        document.documentElement.style.setProperty('--primary', '195 89% 52%');
      }
      
      const storeSellers = state.sellers[storeId] || [];
      const storeGoals = state.goals[storeId] || state.goals.default;
      const storeIncentives = state.incentives[storeId] || {};

      reset({
        ...form.getValues(),
        sellers: storeSellers,
        goals: storeGoals,
      });

      setIncentives(storeIncentives);
      calculateRankings(storeSellers, storeIncentives);

    } catch (error) {
        console.error("Failed to load state from localStorage", error);
    }
  }, [storeId, reset, router, calculateRankings, toast, form]);
  
  useEffect(() => {
      loadDataForStore();
  }, [loadDataForStore]);

  // Auth and Tab logic
  useEffect(() => {
    const adminAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    setIsAdmin(adminAuthenticated);

    const state = loadState();
    const tabFromUrl = searchParams.get('tab');
    let currentLoggedInSeller: string | null = null;
    if (!adminAuthenticated) {
        (state.sellers[storeId] || []).forEach(seller => {
            if(sessionStorage.getItem(`sellerAuthenticated-${seller.id}`) === 'true') {
                currentLoggedInSeller = seller.id;
            }
        });
        setLoggedInSellerId(currentLoggedInSeller);
    }

    const tabToActivate = tabFromUrl || (state.sellers[storeId]?.[0]?.id ?? 'admin');

    if (adminAuthenticated) {
    } else if (currentLoggedInSeller) {
        if (tabToActivate !== currentLoggedInSeller) {
            toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você só pode ver seu próprio painel.' });
            router.push(`/dashboard/${storeId}?tab=${currentLoggedInSeller}`);
            return;
        }
    } else {
        const destination = `/dashboard/${storeId}?tab=${tabToActivate}`;
        if (tabToActivate === 'admin') {
            router.push(`/login?redirect=${encodeURIComponent(destination)}`);
        } else {
            router.push(`/login/vendedor?storeId=${storeId}&sellerId=${tabToActivate}&redirect=${encodeURIComponent(destination)}`);
        }
        return;
    }
    
    if (tabToActivate !== activeTab) {
        setActiveTab(tabToActivate);
    }
  }, [storeId, router, toast, searchParams, activeTab]);

  // Save state on change
  useEffect(() => {
    if (!isDirty) return;
    
    const subscription = watch((value) => {
        try {
            const state = loadState();
            state.sellers[storeId] = value.sellers || [];
            state.goals[storeId] = value.goals as Goals;
            state.incentives[storeId] = incentives;
            saveState(state);
            if(value.sellers && incentives){
                 calculateRankings(value.sellers, incentives);
            }
        } catch(error) {
            console.error("Failed to save state to localStorage", error);
        }
    });
    return () => subscription.unsubscribe();
  }, [watch, incentives, storeId, calculateRankings, isDirty]);


  const handleTabChange = (newTab: string) => {
      if (!isAdmin && loggedInSellerId && newTab !== loggedInSellerId) {
          toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você só pode acessar o seu painel.' });
          router.push(`/dashboard/${storeId}?tab=${loggedInSellerId}`);
          return;
      }
       if (newTab === 'admin' && !isAdmin) {
          toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você precisa ser um administrador.'})
          const destination = `/dashboard/${storeId}?tab=admin`;
          router.push(`/login?redirect=${encodeURIComponent(destination)}`);
          return;
      }
      
      const sellerIsAuthenticated = (sellerId: string) => {
        return sessionStorage.getItem(`sellerAuthenticated-${sellerId}`) === 'true';
      }

      if(newTab !== 'admin' && !isAdmin && !sellerIsAuthenticated(newTab)){
        const destination = `/dashboard/${storeId}?tab=${newTab}`;
        router.push(`/login/vendedor?storeId=${storeId}&sellerId=${newTab}&redirect=${encodeURIComponent(destination)}`);
        return;
      }

      setActiveTab(newTab);
      router.push(`/dashboard/${storeId}?tab=${newTab}`, { scroll: false });
  }

  const calculateAllIncentives = (values: FormValues) => {
    startTransition(async () => {
      try {
        const newIncentives: Record<string, IncentiveProjectionOutput | null> = {};
        for (const seller of values.sellers) {
          const result = await incentiveProjection({
            vendas: seller.vendas, pa: seller.pa, ticketMedio: seller.ticketMedio, corridinhaDiaria: seller.corridinhaDiaria,
            metaMinha: values.goals.metaMinha, meta: values.goals.meta, metona: values.goals.metona,
            metaLendaria: values.goals.metaLendaria, legendariaBonusValorVenda: values.goals.legendariaBonusValorVenda,
            legendariaBonusValorPremio: values.goals.legendariaBonusValorPremio, metaMinhaPrize: values.goals.metaMinhaPrize,
            metaPrize: values.goals.metaPrize, metonaPrize: values.goals.metonaPrize, paGoal1: values.goals.paGoal1,
            paGoal2: values.goals.paGoal2, paGoal3: values.goals.paGoal3, paGoal4: values.goals.paGoal4,
            paPrize1: values.goals.paPrize1, paPrize2: values.goals.paPrize2, paPrize3: values.goals.paPrize3,
            paPrize4: values.goals.paPrize4, ticketMedioGoal1: values.goals.ticketMedioGoal1,
            ticketMedioGoal2: values.goals.ticketMedioGoal2, ticketMedioGoal3: values.goals.ticketMedioGoal3,
            ticketMedioGoal4: values.goals.ticketMedioGoal4, ticketMedioPrize1: values.goals.ticketMedioPrize1,
            ticketMedioPrize2: values.goals.ticketMedioPrize2, ticketMedioPrize3: values.goals.ticketMedioPrize3,
            ticketMedioPrize4: values.goals.ticketMedioPrize4,
          });
          newIncentives[seller.id] = result;
        }
        setIncentives(newIncentives);
        calculateRankings(values.sellers, newIncentives);
        toast({ title: "Sucesso!", description: "Painel de todos os vendedores atualizado com sucesso." });
      } catch (error) {
        console.error("Calculation Error:", error);
        toast({ variant: "destructive", title: "Erro de Cálculo", description: "Não foi possível calcular os incentivos. Tente novamente." });
      }
    });
  };

  const onSubmit = (values: FormValues) => calculateAllIncentives(values);
  
  const visibleSellers = isAdmin ? (currentValues.sellers || []) : (currentValues.sellers || []).filter(s => s.id === loggedInSellerId);

  return (
    <div className="container mx-auto p-4 py-8 md:p-8 relative">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-headline" style={{color: currentStore?.themeColor}}>
                {currentStore?.name || 'Carregando...'}
              </h1>
              <p className="text-muted-foreground">
                Acompanhe as metas e os ganhos da equipe.
              </p>
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
           <TooltipProvider>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="flex items-center border-b">
                    <TabsList className="flex-grow h-auto p-0 bg-transparent border-0 rounded-none">
                        {visibleSellers.map(seller => (
                             <TabsTrigger key={seller.id} value={seller.id} className="rounded-lg px-3 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                                {seller.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {isAdmin && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <TabsList className="h-auto p-0 bg-transparent border-0 rounded-none">
                                    <TabsTrigger value="admin" className="rounded-lg px-3 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                                        <ShieldCheck className="h-5 w-5"/>
                                        <span className="sr-only">Admin</span>
                                    </TabsTrigger>
                                </TabsList>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Painel do Administrador da Loja</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>

                {isAdmin && (
                    <TabsContent value="admin">
                        <AdminTab form={form} storeId={storeId} setIncentives={setIncentives} />
                    </TabsContent>
                )}
                
                {(currentValues.sellers || []).map((seller, index) => (
                    <TabsContent key={seller.id} value={seller.id} className="mt-4">
                        <SellerTab
                            seller={seller}
                            goals={currentValues.goals}
                            incentives={incentives[seller.id]}
                            rankings={rankings[seller.id]}
                            loading={isPending}
                            themeColor={currentStore?.themeColor}
                        />
                    </TabsContent>
                ))}

                {currentValues.sellers && currentValues.sellers.length === 0 && activeTab !== 'admin' && (
                    <TabsContent value={activeTab} className="mt-4">
                        <p>Sem vendedores</p>
                    </TabsContent>
                )}
            </Tabs>
           </TooltipProvider>
        </form>
      </Form>
    </div>
  );
}
