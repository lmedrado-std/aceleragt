

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Home,
  Loader2,
  CheckCircle,
} from "lucide-react";

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
import { loadState, saveState, Seller, Goals, Store, Incentives } from "@/lib/storage";
import { AdminTab } from "@/components/admin-tab";
import { SellerTab } from "@/components/seller-tab";
import { Skeleton } from "./ui/skeleton";

const availableAvatarIds = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6', 'avatar7', 'avatar8', 'avatar9', 'avatar10'];

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
  newSellerName: z.string().optional(),
  newSellerPassword: z.string().optional(),
  goals: z.object({
    metaMinha: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    meta: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    metona: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    metaLendaria: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    legendariaBonusValorVenda: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
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
    ticketMedioGoal3: z.coerce.number({ invalid_type_error: "Deve be um número" }).min(0),
    ticketMedioGoal4: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    ticketMedioPrize1: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
    ticketMedioPrize2: z.coerce.number({ invalid_type_error: "Deve be um número" }).min(0),
    ticketMedioPrize3: z.coerce.number({ invalid_type_error: "Deve be um número" }).min(0),
    ticketMedioPrize4: z.coerce.number({ invalid_type_error: "Deve be um número" }).min(0),
  }),
  sellers: z.array(sellerSchema),
});

export type FormValues = z.infer<typeof formSchema>;

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
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggedInSellerId, setLoggedInSellerId] = useState<string | null>(null);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [mounted, setMounted] = useState(false);
  const [incentives, setIncentives] = useState<Incentives>({});
  const searchParams = useSearchParams();
  const router = useRouter();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newSellerName: "",
      newSellerPassword: "",
      sellers: [],
    }
  });
  
  const { watch, reset, getValues, setValue } = form;
  const [activeTab, setActiveTab] = useState<string>("loading");

  const handleIncentivesCalculated = (newIncentives: Incentives) => {
    setIncentives(newIncentives);
    const currentState = loadState();
    currentState.incentives[storeId] = newIncentives;
    saveState(currentState);
  };

  const addSeller = (name: string, pass: string) => {
    const currentSellers = getValues("sellers") || [];
    const existingAvatarIds = new Set(currentSellers.map(s => s.avatarId));
    let randomAvatarId = availableAvatarIds[Math.floor(Math.random() * availableAvatarIds.length)];

    if (existingAvatarIds.size < availableAvatarIds.length) {
        while (existingAvatarIds.has(randomAvatarId)) {
            randomAvatarId = availableAvatarIds[Math.floor(Math.random() * availableAvatarIds.length)];
        }
    }
    const newSeller: Seller = {
        id: crypto.randomUUID(),
        name,
        password: pass,
        avatarId: randomAvatarId,
        vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0,
    };
    const updatedSellers = [...currentSellers, newSeller];
    setValue("sellers", updatedSellers, { shouldDirty: true });
    toast({ title: "Vendedor adicionado!", description: `${name} foi adicionado(a) com sucesso.` });
    router.push(`/dashboard/${storeId}?tab=${newSeller.id}`);
  };


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
    
    const initialFormValues = {
      newSellerName: "",
      newSellerPassword: "",
      goals: state.goals[storeId] || state.goals.default,
      sellers: state.sellers[storeId] || [],
    };
    reset(initialFormValues);
    setIncentives(state.incentives[storeId] || {});
    
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
    let tabToActivate = tabFromUrl || (sellersForStore.length > 0 ? sellersForStore[0].id : 'admin');
    
    // Fallback if the tab points to a non-existent seller
    if (tabToActivate !== 'admin' && !sellersForStore.some(s => s.id === tabToActivate)) {
      tabToActivate = sellersForStore.length > 0 ? sellersForStore[0].id : 'admin';
    }


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
  }, [storeId, reset, router, toast, searchParams]);

  useEffect(() => {
    const subscription = watch((value) => {
      if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        const currentState = loadState();
        currentState.sellers[storeId] = value.sellers || [];
        currentState.goals[storeId] = value.goals as Goals;
        saveState(currentState);
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1500);
      }, 500);
    });
    return () => {
        subscription.unsubscribe();
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
    };
  }, [watch, storeId]);


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
                        <AdminTab 
                          form={form} 
                          storeId={storeId} 
                          onIncentivesCalculated={handleIncentivesCalculated}
                          incentives={incentives}
                          addSeller={addSeller}
                        />
                    </TabsContent>
                )}
                
                {(currentValues.sellers || []).map((seller) => (
                    <TabsContent key={seller.id} value={seller.id} className="mt-4">
                        <SellerTab
                            seller={seller}
                            goals={currentValues.goals}
                            incentives={incentives[seller.id]}
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
