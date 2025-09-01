
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Loader2,
  UserPlus,
  Trash2,
  Edit,
  Save,
  X,
  ShieldCheck,
  Calculator,
  Home,
  ChevronRight,
  Target
} from "lucide-react";

import {
  incentiveProjection,
  type IncentiveProjectionOutput,
} from "@/ai/flows/incentive-projection";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ProgressDisplay } from "@/components/progress-display";
import { Logo } from "@/components/logo";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { loadState, saveState, Seller, Incentives, getInitialState, Goals } from "@/lib/storage";


const sellerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome é obrigatório"),
  avatarId: z.string(),
  vendas: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0).default(0),
  pa: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0).default(0),
  ticketMedio: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0).default(0),
  corridinhaDiaria: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0).default(0),
});

const formSchema = z.object({
  newSellerName: z.string(),
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

type FormValues = z.infer<typeof formSchema>;

type RankingMetric = 'vendas' | 'pa' | 'ticketMedio' | 'corridinhaDiaria' | 'totalIncentives';
type Rankings = Record<string, Record<RankingMetric, number>>;


const goalTiers = [
    { id: 'Nível 1', goal: 'paGoal1', prize: 'paPrize1'},
    { id: 'Nível 2', goal: 'paGoal2', prize: 'paPrize2' },
    { id: 'Nível 3', goal: 'paGoal3', prize: 'paPrize3' },
    { id: 'Nível 4', goal: 'paGoal4', prize: 'paPrize4' },
];

const ticketMedioTiers = [
    { id: 'Nível 1', goal: 'ticketMedioGoal1', prize: 'ticketMedioPrize1'},
    { id: 'Nível 2', goal: 'ticketMedioGoal2', prize: 'ticketMedioPrize2' },
    { id: 'Nível 3', goal: 'ticketMedioGoal3', prize: 'ticketMedioPrize3' },
    { id: 'Nível 4', goal: 'ticketMedioGoal4', prize: 'ticketMedioPrize4' },
];

const availableAvatarIds = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6', 'avatar7', 'avatar8', 'avatar9', 'avatar10'];

export function GoalGetterDashboard({ storeId }: { storeId: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [incentives, setIncentives] = useState<Incentives>({});
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [rankings, setRankings] = useState<Rankings>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [storeName, setStoreName] = useState('');
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
        goals: state.goals[storeId] || state.goals.default,
        sellers: state.sellers[storeId] || [],
      }
  }

  const { watch, getValues, setValue, reset, formState: { isDirty } } = form;
  const currentValues = watch();

  const getActiveTab = useCallback(() => {
    const sellers = getValues('sellers');
    const firstSellerId = sellers && sellers.length > 0 ? sellers[0].id : 'admin';
    return searchParams.get('tab') || firstSellerId;
  }, [searchParams, getValues]);
  
  const [activeTab, setActiveTab] = useState(getActiveTab);

  // Effect to check auth and handle initial tab loading
  useEffect(() => {
    const adminAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    setIsAdmin(adminAuthenticated);

    const state = loadState();
    const store = state.stores.find(s => s.id === storeId);
    setStoreName(store?.name || 'Loja não encontrada');

    const tab = getActiveTab();
    
    if (tab === 'admin' && !adminAuthenticated) {
      toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Por favor, faça login como administrador.' });
      const destination = `/dashboard/${storeId}?tab=admin`;
      router.push(`/login?redirect=${encodeURIComponent(destination)}`);
      return;
    }
    
    setActiveTab(tab);
  }, [storeId, getActiveTab, router, toast, getValues]);

  const calculateRankings = useCallback((sellers: Seller[], currentIncentives: Record<string, IncentiveProjectionOutput | null>) => {
    const newRankings: Rankings = {};
    if (!sellers || sellers.length === 0) {
        setRankings({});
        return;
    }
    const metrics: RankingMetric[] = ['vendas', 'pa', 'ticketMedio', 'corridinhaDiaria', 'totalIncentives'];

    metrics.forEach(metric => {
        const sortedSellers = [...sellers]
            .map(seller => {
                let value = 0;
                if (metric === 'totalIncentives') {
                    const incentiveData = currentIncentives[seller.id];
                    value = incentiveData ? Object.values(incentiveData).reduce((sum, val) => sum + val, 0) : 0;
                } else if (metric === 'corridinhaDiaria') {
                    const incentiveData = currentIncentives[seller.id];
                    value = incentiveData?.corridinhaDiariaBonus || 0;
                }
                else {
                    value = seller[metric as keyof Omit<Seller, 'id' | 'name' | 'avatarId'>] as number;
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
      const storeExists = state.stores.some(s => s.id === storeId);
      if (!storeExists) {
        toast({ variant: "destructive", title: "Erro", description: "Loja não encontrada." });
        router.push('/');
        return;
      }
      
      const storeSellers = state.sellers[storeId] || [];
      const storeGoals = state.goals[storeId] || state.goals.default;
      const storeIncentives = state.incentives[storeId] || {};

      reset({
        ...getValues(), // keep other form values like newStoreName
        sellers: storeSellers,
        goals: storeGoals,
      });

      setIncentives(storeIncentives);
      calculateRankings(storeSellers, storeIncentives);

    } catch (error) {
        console.error("Failed to load state from localStorage", error);
    }
  }, [storeId, reset, router, calculateRankings, toast, getValues]);
  
  useEffect(() => {
      loadDataForStore();
  }, [loadDataForStore]);

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

  const addSeller = () => {
    const newSellerName = getValues("newSellerName");
    if (newSellerName.trim() === "") {
      toast({ variant: "destructive", title: "Erro", description: "O nome do vendedor não pode estar vazio." });
      return;
    }
    const currentSellers = getValues("sellers") || [];
    const existingAvatarIds = new Set(currentSellers.map(s => s.avatarId));
    let randomAvatarId = availableAvatarIds[Math.floor(Math.random() * availableAvatarIds.length)];
    
    if (existingAvatarIds.size < availableAvatarIds.length) {
        while (existingAvatarIds.has(randomAvatarId)) {
            randomAvatarId = availableAvatarIds[Math.floor(Math.random() * availableAvatarIds.length)];
        }
    }
    const newSeller: Seller = {
      id: new Date().toISOString(), name: newSellerName, avatarId: randomAvatarId,
      vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0,
    };
    const updatedSellers = [...currentSellers, newSeller];
    setValue("sellers", updatedSellers, { shouldDirty: true });
    setValue("newSellerName", "");
    router.push(`/dashboard/${storeId}?tab=${newSeller.id}`);
  };

  const removeSeller = (sellerId: string) => {
    const updatedSellers = (currentValues.sellers || []).filter(s => s.id !== sellerId);
    setValue("sellers", updatedSellers, { shouldDirty: true });
    setIncentives(prev => {
        const newIncentives = {...prev};
        delete newIncentives[sellerId];
        return newIncentives;
    });
    const newTab = updatedSellers.length > 0 ? updatedSellers[0].id : "admin";
    router.push(`/dashboard/${storeId}?tab=${newTab}`);
  }

  const startEditing = (sellerId: string) => setEditingSellerId(sellerId);
  const cancelEditing = () => setEditingSellerId(null);

  const saveSellerName = (sellerId: string) => {
    const sellerIndex = (currentValues.sellers || []).findIndex(s => s.id === sellerId);
    if (sellerIndex === -1) return;

    const newName = getValues(`sellers.${sellerIndex}.name`);
    if (newName.trim() === "") {
      toast({ variant: "destructive", title: "Erro", description: "O nome do vendedor não pode estar vazio." });
      return;
    }
    setEditingSellerId(null);
    toast({ title: "Sucesso!", description: "Nome do vendedor atualizado." });
  }
  
  const handleTabChange = (newTab: string) => {
      if (newTab === 'admin' && !isAdmin) {
          toast({ variant: 'destructive', title: 'Acesso Negado', description: 'Você precisa ser um administrador.'})
          const destination = `/dashboard/${storeId}?tab=admin`;
          router.push(`/login?redirect=${encodeURIComponent(destination)}`);
          return;
      }
      setActiveTab(newTab);
      router.push(`/dashboard/${storeId}?tab=${newTab}`);
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
  
  const renderGoalInputs = (level: string, tiers: typeof goalTiers | typeof ticketMedioTiers) => (
    <div>
        <h3 className="font-semibold mb-4 text-primary">{level}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            {tiers.map(tier => (
                 <div className="space-y-2" key={tier.id}>
                    <h4 className="font-medium text-sm">{tier.id}</h4>
                    <div className="flex items-center gap-2">
                        <FormField control={form.control} name={`goals.${tier.goal}` as any} render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name={`goals.${tier.prize}` as any} render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </div>
                </div>
            ))}
        </div>
    </div>
  )

  return (
    <div className="container mx-auto p-4 py-8 md:p-8 relative">
       <div className="absolute top-2 right-2 bg-yellow-200 text-yellow-800 text-xs font-bold p-1 rounded z-10">PÁGINA: PAINEL (goal-getter-dashboard.tsx)</div>
      <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
            <Logo />
            <div>
              <h1 className="text-3xl font-bold font-headline text-primary">
                {storeName}
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
          <Button asChild variant="ghost">
            <Link href={`/loja/${storeId}`}>
              <ChevronRight className="mr-2 h-4 w-4" />
              Painel da Loja
            </Link>
          </Button>
        </div>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
           <TooltipProvider>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="flex items-center border-b">
                    <TabsList className="flex-grow h-auto p-0 bg-transparent border-0 rounded-none">
                        {(currentValues.sellers || []).map(seller => (
                            <TabsTrigger key={seller.id} value={seller.id} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-primary/5">
                                {seller.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {isAdmin && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <TabsList className="h-auto p-0 bg-transparent border-0 rounded-none">
                                    <TabsTrigger value="admin" className="px-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-primary/5">
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
                        <Card className="mt-4 border-primary/20">
                            <CardHeader>
                            <CardTitle>Painel Administrativo da Loja</CardTitle>
                            <CardDescription>
                                Ajuste as metas, prêmios e gerencie os vendedores desta loja aqui.
                            </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-10">
                                
                                <div className="grid lg:grid-cols-2 gap-x-8 gap-y-10">
                                    <div className="space-y-8">
                                       <Card>
                                            <CardHeader><h3 className="font-semibold text-lg text-primary flex items-center gap-2"><UserPlus /> Gerenciar Vendedores</h3></CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <FormLabel>Cadastrar Novo Vendedor</FormLabel>
                                                    <div className="flex items-center gap-2">
                                                        <FormField control={form.control} name="newSellerName" render={({ field }) => (
                                                            <FormItem className="flex-grow">
                                                                <FormLabel className="sr-only">Nome do Vendedor</FormLabel>
                                                                <FormControl><Input placeholder="Nome do Vendedor" {...field} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSeller(); }}} /></FormControl>
                                                            </FormItem>
                                                        )}/>
                                                        <Button type="button" onClick={addSeller}><UserPlus/></Button>
                                                    </div>
                                                </div>
                                                <Separator/>
                                                <div className="space-y-2">
                                                  <FormLabel>Vendedores Atuais</FormLabel>
                                                  {(currentValues.sellers || []).length > 0 ? (
                                                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                                          {(currentValues.sellers || []).map((seller, index) => (
                                                              <div key={seller.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                                                                  {editingSellerId === seller.id ? (
                                                                      <>
                                                                          <FormField control={form.control} name={`sellers.${index}.name`} render={({ field }) => (
                                                                          <FormItem className="flex-grow"><FormControl><Input {...field} autoFocus onKeyDown={(e) => { if(e.key === 'Enter') saveSellerName(seller.id); if(e.key==='Escape') cancelEditing(); }}/></FormControl></FormItem>
                                                                          )}/>
                                                                          <Button size="icon" variant="ghost" onClick={() => saveSellerName(seller.id)}><Save className="h-4 w-4"/></Button>
                                                                          <Button size="icon" variant="ghost" onClick={cancelEditing}><X className="h-4 w-4"/></Button>
                                                                      </>
                                                                  ) : (
                                                                      <>
                                                                          <span className="font-medium">{seller.name}</span>
                                                                          <div className="flex items-center">
                                                                              <Button size="icon" variant="ghost" onClick={() => startEditing(seller.id)}><Edit className="h-4 w-4"/></Button>
                                                                              <AlertDialog>
                                                                                  <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                                                                                  <AlertDialogContent>
                                                                                      <AlertDialogHeader><AlertDialogTitle>Você tem certeza?</AlertDialogTitle><AlertDialogDescription>Essa ação não pode ser desfeita. Isso irá remover permanentemente o vendedor e seus dados.</AlertDialogDescription></AlertDialogHeader>
                                                                                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => removeSeller(seller.id)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction></AlertDialogFooter>
                                                                                  </AlertDialogContent>
                                                                              </AlertDialog>
                                                                          </div>
                                                                      </>
                                                                  )}
                                                              </div>
                                                          ))}
                                                      </div>
                                                    ) : (<p className="text-sm text-muted-foreground text-center py-4">Nenhum vendedor cadastrado.</p>)}
                                                </div>
                                            </CardContent>
                                        </Card>
                                        
                                       <Card>
                                        <CardHeader><h3 className="font-semibold text-lg text-primary flex items-center gap-2"><Target /> Lançar Vendas</h3></CardHeader>
                                        <CardContent className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                            {(currentValues.sellers || []).length > 0 ? currentValues.sellers.map((seller, index) => (
                                                <div key={seller.id}>
                                                    <h4 className="font-medium mb-2">{seller.name}</h4>
                                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                                        <FormField control={form.control} name={`sellers.${index}.vendas`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Vendas (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                        <FormField control={form.control} name={`sellers.${index}.pa`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">PA</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                        <FormField control={form.control} name={`sellers.${index}.ticketMedio`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Ticket Médio</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                        <FormField control={form.control} name={`sellers.${index}.corridinhaDiaria`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Corridinha</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                    </div>
                                                </div>
                                            )) : (<p className="text-sm text-muted-foreground text-center py-4">Cadastre um vendedor para lançar as vendas.</p>)}
                                        </CardContent>
                                       </Card>
                                    </div>

                                    <div className="space-y-8">
                                       <Card>
                                          <CardHeader><h3 className="font-semibold text-lg text-primary">Metas de Vendas</h3></CardHeader>
                                          <CardContent className="space-y-6">
                                            <div className="space-y-2"><h4 className="font-medium text-sm">Metinha</h4><div className="flex items-center gap-2"><FormField control={form.control} name="goals.metaMinha" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem> )}/><FormField control={form.control} name="goals.metaMinhaPrize" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl></FormItem> )}/></div></div>
                                            <div className="space-y-2"><h4 className="font-medium text-sm">Meta</h4><div className="flex items-center gap-2"><FormField control={form.control} name="goals.meta" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem> )}/><FormField control={form.control} name="goals.metaPrize" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl></FormItem> )}/></div></div>
                                            <div className="space-y-2"><h4 className="font-medium text-sm">Metona</h4><div className="flex items-center gap-2"><FormField control={form.control} name="goals.metona" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem> )}/><FormField control={form.control} name="goals.metonaPrize" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl></FormItem> )}/></div></div>
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-sm">Lendária</h4>
                                                <FormField control={form.control} name="goals.metaLendaria" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem> )}/>
                                                <div className="flex items-center gap-2">
                                                    <FormField control={form.control} name="goals.legendariaBonusValorVenda" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel>A cada (R$)</FormLabel><FormControl><Input type="number" placeholder="Valor Venda" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                    <FormField control={form.control} name="goals.legendariaBonusValorPremio" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel>Bônus (R$)</FormLabel><FormControl><Input type="number" placeholder="Valor Prêmio" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                        
                                        <Card>
                                          <CardHeader><h3 className="font-semibold text-lg text-primary">Metas de PA e Ticket Médio</h3></CardHeader>
                                          <CardContent className="space-y-6">{renderGoalInputs("Metas de PA", goalTiers)}<Separator />{renderGoalInputs("Metas de Ticket Médio", ticketMedioTiers)}</CardContent>
                                        </Card>
                                    </div>
                                </div>
                                <Separator />
                                <Button type="submit" disabled={isPending} size="lg" className="w-full">
                                    {isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando...</>) : "Salvar Metas e Calcular Todos os Incentivos"}
                                    <Calculator className="ml-2 h-5 w-5"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
                
                {(currentValues.sellers || []).map((seller, index) => (
                    <TabsContent key={seller.id} value={seller.id} className="mt-4">
                        <ProgressDisplay 
                            salesData={{
                                vendas: currentValues.sellers[index]?.vendas || 0,
                                pa: currentValues.sellers[index]?.pa || 0,
                                ticketMedio: currentValues.sellers[index]?.ticketMedio || 0,
                                corridinhaDiaria: currentValues.sellers[index]?.corridinhaDiaria || 0,
                                ...currentValues.goals
                            }}
                            incentives={incentives[seller.id]}
                            rankings={rankings[seller.id]}
                            loading={isPending}
                        />
                    </TabsContent>
                ))}

                {currentValues.sellers && currentValues.sellers.length === 0 && activeTab !== 'admin' && (
                    <TabsContent value={activeTab} className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sem vendedores</CardTitle>
                                <CardDescription>
                                    Esta loja ainda não tem vendedores. Peça ao administrador para adicionar vendedores no painel de controle.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
           </TooltipProvider>
        </form>
      </Form>
    </div>
  );
}
