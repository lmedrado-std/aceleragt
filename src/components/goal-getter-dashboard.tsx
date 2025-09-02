"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Home,
  Loader2,
  CheckCircle,
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
import { Skeleton } from "./ui/skeleton";


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
    paPrize3: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
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
  const [isCalculating, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [incentives, setIncentives] = useState<Incentives>({});
  const [rankings, setRankings] = useState<Rankings>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggedInSellerId, setLoggedInSellerId] = useState<string | null>(null);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        newSellerName: "",
        newSellerPassword: "",
        goals: getInitialState().goals.default,
        sellers: [],
      }
  });
  
  const getInitialStateForForm = useCallback(() => {
    const state = loadState();
    return {
      newSellerName: "",
      newSellerPassword: "",
      goals: state.goals[storeId] || state.goals.default,
      sellers: state.sellers[storeId] || [],
    }
  }, [storeId]);

  const { watch, reset, getValues } = form;

  const [activeTab, setActiveTab] = useState<string>("loading");

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

  const calculateAllIncentives = useCallback((values: FormValues) => {
    startTransition(async () => {
      try {
        const newIncentives: Record<string, IncentiveProjectionOutput | null> = {};
        for (const seller of values.sellers) {
          const result = await incentiveProjection({
            vendas: seller.vendas, pa: seller.pa, ticketMedio: seller.ticketMedio, corridinhaDiaria: seller.corridinhaDiaria,
            ...values.goals
          });
          newIncentives[seller.id] = result;
        }
        setIncentives(newIncentives);
        calculateRankings(values.sellers, newIncentives);
        
        const currentState = loadState();
        currentState.sellers[storeId] = values.sellers || [];
        currentState.goals[storeId] = values.goals as Goals;
        currentState.incentives[storeId] = newIncentives;
        saveState(currentState);
        
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1500);

      } catch (error) {
        console.error("Calculation Error:", error);
        toast({ variant: "destructive", title: "Erro de Cálculo", description: "Não foi possível calcular os incentivos. Tente novamente." });
      }
    });
  }, [storeId, calculateRankings, toast]);
  
  useEffect(() => {
    setMounted(true);
    const state = loadState();
    const store = state.stores.find(s => s.id === storeId);

    if (!store) {
      setTimeout(() => toast({ variant: "destructive", title: "Erro", description: "Loja não encontrada." }), 0);
      router.push('/');
      return;
    }
    
    setCurrentStore(store);
    
    const initialFormValues = getInitialStateForForm();
    reset(initialFormValues);
    
    const initialIncentives = state.incentives[storeId] || {};
    setIncentives(initialIncentives);
    calculateRankings(initialFormValues.sellers, initialIncentives);

    // Auth and Tab logic
    const adminAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    setIsAdmin(adminAuthenticated);

    let currentLoggedInSeller: string | null = null;
    if (!adminAuthenticated) {
        (state.sellers[storeId] || []).forEach(seller => {
            if(sessionStorage.getItem(`sellerAuthenticated-${seller.id}`) === 'true') {
                currentLoggedInSeller = seller.id;
            }
        });
        setLoggedInSellerId(currentLoggedInSeller);
    }
    
    const sellersForStore = state.sellers[storeId] || [];
    const tabFromUrl = searchParams.get('tab');
    const tabToActivate = tabFromUrl || (sellersForStore.length > 0 ? sellersForStore[0].id : 'admin');
    
    const sellerIsAuthenticated = (sellerId: string) => sessionStorage.getItem(`sellerAuthenticated-${sellerId}`) === 'true';

    if (tabToActivate === 'admin') {
        if (!adminAuthenticated) {
            const destination = `/dashboard/${storeId}?tab=admin`;
            router.push(`/login?redirect=${encodeURIComponent(destination)}`);
            return;
        }
    } else {
        if (!sellersForStore.find(s => s.id === tabToActivate)) {
             router.push(`/dashboard/${storeId}?tab=${sellersForStore[0]?.id || 'admin'}`);
             return;
        }
        if (!adminAuthenticated && !sellerIsAuthenticated(tabToActivate)) {
            const destination = `/dashboard/${storeId}?tab=${tabToActivate}`;
            router.push(`/login/vendedor?storeId=${storeId}&sellerId=${tabToActivate}&redirect=${encodeURIComponent(destination)}`);
            return;
        }
        if (!adminAuthenticated && currentLoggedInSeller && tabToActivate !== currentLoggedInSeller) {
            toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você só pode ver seu próprio painel.' });
            router.push(`/dashboard/${storeId}?tab=${currentLoggedInSeller}`);
            return;
        }
    }
    
    setActiveTab(tabToActivate);
  }, [storeId, reset, router, toast, searchParams, getInitialStateForForm, calculateRankings]);

  // Recalculate on form change
  const stableCalculateAllIncentives = useCallback(calculateAllIncentives, [calculateAllIncentives]);

  useEffect(() => {
    const subscription = watch((value) => {
      if (calculationTimeoutRef.current) {
          clearTimeout(calculationTimeoutRef.current);
      }
      calculationTimeoutRef.current = setTimeout(() => {
        stableCalculateAllIncentives(value as FormValues);
      }, 500); // Debounce
    });
    return () => {
        subscription.unsubscribe();
        if (calculationTimeoutRef.current) {
            clearTimeout(calculationTimeoutRef.current);
        }
    };
  }, [watch, stableCalculateAllIncentives]);


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

  const currentValues = getValues();
  const visibleSellers = isAdmin ? (currentValues.sellers || []) : (currentValues.sellers || []).filter(s => s.id === loggedInSellerId);

  if (!mounted) {
    return <DashboardSkeleton />;
  }

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
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
           <TooltipProvider>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="flex items-center border-b justify-between">
                    <TabsList className="flex-grow h-auto p-0 bg-transparent border-0 rounded-none">
                        {visibleSellers.map(seller => (
                             <TabsTrigger key={seller.id} value={seller.id} className="rounded-lg px-3 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                                {seller.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    
                    <div className="flex items-center gap-4">
                         {isCalculating && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                                <Loader2 className="h-4 w-4 animate-spin"/>
                                <span>Calculando...</span>
                            </div>
                        )}
                        {isSaving && (
                             <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4"/>
                                <span>Salvo!</span>
                            </div>
                        )}
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
                </div>

                {isAdmin && (
                    <TabsContent value="admin">
                        <AdminTab form={form} storeId={storeId} setIncentives={setIncentives} />
                    </TabsContent>
                )}
                
                {(currentValues.sellers || []).map((seller) => (
                    <TabsContent key={seller.id} value={seller.id} className="mt-4">
                        <SellerTab
                            seller={seller}
                            goals={currentValues.goals}
                            incentives={incentives[seller.id]}
                            rankings={rankings[seller.id]}
                            loading={isCalculating}
                            themeColor={currentStore?.themeColor}
                        />
                    </TabsContent>
                ))}

                 {(currentValues.sellers || []).length === 0 && activeTab !== 'admin' && (
                     <TabsContent value={activeTab} className="mt-4 text-center text-muted-foreground py-10">
                        <p>Esta loja ainda não tem vendedores.</p>
                        <p>O administrador precisa adicionar vendedores no painel de administração.</p>
                    </TabsContent>
                )}
            </Tabs>
           </TooltipProvider>
        </form>
      </Form>
    </div>
  );
}
