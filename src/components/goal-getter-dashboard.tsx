
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
  KeyRound
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
import { loadState, saveState, AppState, Seller, Goals, Incentives, setAdminPassword, getAdminPassword } from "@/lib/storage";


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
  adminPassword: z.string(),
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
    ticketMedioGoal2: z.coerce.number({ invalid_type_error: "Deve be um número" }).min(0),
    ticketMedioGoal3: z.coerce.number({ invalid_type_error: "Deve be um número" }).min(0),
    ticketMedioGoal4: z.coerce.number({ invalid_type_error: "Deve be um número" }).min(0),
    ticketMedioPrize1: z.coerce.number({ invalid_type_error: "Deve be um número" }).min(0),
    ticketMedioPrize2: z.coerce.number({ invalid_type_error: "Deve be um número" }).min(0),
    ticketMedioPrize3: z.coerce.number({ invalid_type_error: "Deve be um número" }).min(0),
    ticketMedioPrize4: z.coerce.number({ invalid_type_error: "Deve be um número" }).min(0),
  }),
  sellers: z.array(sellerSchema),
});

type FormValues = z.infer<typeof formSchema>;

type RankingMetric = 'vendas' | 'pa' | 'ticketMedio' | 'corridinhaDiaria' | 'totalIncentives';
type Rankings = Record<string, Record<RankingMetric, number>>;


const goalTiers = [
    { id: 'Metinha', goal: 'paGoal1', prize: 'paPrize1'},
    { id: 'Meta', goal: 'paGoal2', prize: 'paPrize2' },
    { id: 'Metona', goal: 'paGoal3', prize: 'paPrize3' },
    { id: 'Lendária', goal: 'paGoal4', prize: 'paPrize4' },
];

const ticketMedioTiers = [
    { id: 'Metinha', goal: 'ticketMedioGoal1', prize: 'ticketMedioPrize1'},
    { id: 'Meta', goal: 'ticketMedioGoal2', prize: 'ticketMedioPrize2' },
    { id: 'Metona', goal: 'ticketMedioGoal3', prize: 'ticketMedioPrize3' },
    { id: 'Lendária', goal: 'ticketMedioGoal4', prize: 'ticketMedioPrize4' },
];

const availableAvatarIds = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6', 'avatar7', 'avatar8', 'avatar9', 'avatar10'];

export function GoalGetterDashboard({ storeId }: { storeId: string }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [incentives, setIncentives] = useState<Incentives>({});
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);
  const [rankings, setRankings] = useState<Rankings>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newSellerName: "",
      adminPassword: "",
      goals: loadState().goals.default,
      sellers: [],
    },
  });
  
  const { watch, getValues, setValue, reset, formState: { isDirty } } = form;
  const currentValues = watch();

  const getInitialTab = useCallback(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && (isAdmin || (currentValues.sellers && currentValues.sellers.some(s => s.id === tabFromUrl)))) {
      return tabFromUrl;
    }
    if (currentValues.sellers && currentValues.sellers.length > 0) return currentValues.sellers[0].id;
    return "admin";
  }, [searchParams, currentValues.sellers, isAdmin]);
  
  const [activeTab, setActiveTab] = useState('admin');

  useEffect(() => {
    const adminAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
    setIsAdmin(adminAuthenticated);
    const initialTab = getInitialTab();
    setActiveTab(initialTab);
    
    // If trying to access admin tab without auth, redirect
    if (initialTab === 'admin' && !adminAuthenticated) {
       router.replace(`/dashboard/${storeId}?tab=${currentValues.sellers?.[0]?.id || ''}`);
    }

  }, [getInitialTab, storeId, isAdmin, router, currentValues.sellers]);


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
        newSellerName: "",
        adminPassword: "",
        sellers: storeSellers,
        goals: storeGoals,
      });

      setIncentives(storeIncentives);
      calculateRankings(storeSellers, storeIncentives);

    } catch (error) {
        console.error("Failed to load state from localStorage", error);
    }
  }, [storeId, reset, router, calculateRankings, toast]);
  
  useEffect(() => {
      loadDataForStore();
  }, [loadDataForStore]);

  useEffect(() => {
    const subscription = watch((value) => {
        if (!isDirty) return;
        try {
            const state = loadState();
            state.sellers[storeId] = value.sellers || [];
            state.goals[storeId] = value.goals;
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
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O nome do vendedor não pode estar vazio.",
      });
      return;
    }
    const currentSellers = getValues("sellers");
    const existingAvatarIds = new Set(currentSellers.map(s => s.avatarId));
    let randomAvatarId = availableAvatarIds[Math.floor(Math.random() * availableAvatarIds.length)];
    
    if (existingAvatarIds.size < availableAvatarIds.length) {
        while (existingAvatarIds.has(randomAvatarId)) {
            randomAvatarId = availableAvatarIds[Math.floor(Math.random() * availableAvatarIds.length)];
        }
    }


    const newSeller: Seller = {
      id: new Date().toISOString(),
      name: newSellerName,
      avatarId: randomAvatarId,
      vendas: 0,
      pa: 0,
      ticketMedio: 0,
      corridinhaDiaria: 0,
    };
    const updatedSellers = [...currentSellers, newSeller];
    setValue("sellers", updatedSellers, { shouldDirty: true });
    setValue("newSellerName", "");
    router.push(`/dashboard/${storeId}?tab=${newSeller.id}`);
  };

  const removeSeller = (sellerId: string) => {
    const updatedSellers = currentValues.sellers.filter(s => s.id !== sellerId);
    setValue("sellers", updatedSellers, { shouldDirty: true });
    setIncentives(prev => {
        const newIncentives = {...prev};
        delete newIncentives[sellerId];
        return newIncentives;
    });
    
    const newTab = updatedSellers.length > 0 ? updatedSellers[0].id : "admin";
    router.push(`/dashboard/${storeId}?tab=${newTab}`);
  }

  const startEditing = (sellerId: string) => {
    setEditingSellerId(sellerId);
  }

  const cancelEditing = () => {
    setEditingSellerId(null);
  }

  const saveSellerName = (sellerId: string) => {
    const sellerIndex = currentValues.sellers.findIndex(s => s.id === sellerId);
    if (sellerIndex === -1) return;

    const newName = getValues(`sellers.${sellerIndex}.name`);
    if (newName.trim() === "") {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O nome do vendedor não pode estar vazio.",
      });
      return;
    }
    // setValue will be handled by watch, just end editing
    setEditingSellerId(null);
  }
  
  const handleTabChange = (newTab: string) => {
      router.push(`/dashboard/${storeId}?tab=${newTab}`);
  }
  
   const handleChangePassword = () => {
    const newPassword = getValues("adminPassword");
    if (newPassword.length < 4) {
      toast({
        variant: "destructive",
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 4 caracteres.",
      });
      return;
    }
    setAdminPassword(newPassword);
    setValue("adminPassword", "");
    toast({
      title: "Sucesso!",
      description: "Sua senha foi alterada.",
    });
  };

  const calculateAllIncentives = (values: FormValues) => {
    startTransition(async () => {
      try {
        const newIncentives: Record<string, IncentiveProjectionOutput | null> = {};
        for (const seller of values.sellers) {
          const result = await incentiveProjection({
            vendas: seller.vendas,
            pa: seller.pa,
            ticketMedio: seller.ticketMedio,
            corridinhaDiaria: seller.corridinhaDiaria,
            metaMinha: values.goals.metaMinha,
            meta: values.goals.meta,
            metona: values.goals.metona,
            metaLendaria: values.goals.metaLendaria,
            legendariaBonusValorVenda: values.goals.legendariaBonusValorVenda,
            legendariaBonusValorPremio: values.goals.legendariaBonusValorPremio,
            metaMinhaPrize: values.goals.metaMinhaPrize,
            metaPrize: values.goals.metaPrize,
            metonaPrize: values.goals.metonaPrize,
            paGoal1: values.goals.paGoal1,
            paGoal2: values.goals.paGoal2,
            paGoal3: values.goals.paGoal3,
            paGoal4: values.goals.paGoal4,
            paPrize1: values.goals.paPrize1,
            paPrize2: values.goals.paPrize2,
            paPrize3: values.goals.paPrize3,
            paPrize4: values.goals.paPrize4,
            ticketMedioGoal1: values.goals.ticketMedioGoal1,
            ticketMedioGoal2: values.goals.ticketMedioGoal2,
            ticketMedioGoal3: values.goals.ticketMedioGoal3,
            ticketMedioGoal4: values.goals.ticketMedioGoal4,
            ticketMedioPrize1: values.goals.ticketMedioPrize1,
            ticketMedioPrize2: values.goals.ticketMedioPrize2,
            ticketMedioPrize3: values.goals.ticketMedioPrize3,
            ticketMedioPrize4: values.goals.ticketMedioPrize4,
          });
          newIncentives[seller.id] = result;
        }
        setIncentives(newIncentives);
        calculateRankings(values.sellers, newIncentives);
        toast({
          title: "Sucesso!",
          description: "Painel de todos os vendedores atualizado com sucesso.",
        });
      } catch (error) {
        console.error("Calculation Error:", error);
        toast({
          variant: "destructive",
          title: "Erro de Cálculo",
          description: "Não foi possível calcular os incentivos. Tente novamente.",
        });
      }
    });
  };

  const onSubmit = (values: FormValues) => {
    calculateAllIncentives(values);
  };
  
  const renderGoalInputs = (level: string, tiers: typeof goalTiers | typeof ticketMedioTiers) => (
    <div>
        <h3 className="font-semibold mb-4 text-primary">Metas de {level}</h3>
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
    <div className="container mx-auto p-4 py-8 md:p-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
            <Logo />
            <div>
              <h1 className="text-3xl font-bold font-headline text-primary">
                Corridinha GT
              </h1>
              <p className="text-muted-foreground">
                Acompanhe suas metas e maximize seus ganhos.
              </p>
            </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/loja/${storeId}`}>
            <Home className="mr-2 h-4 w-4" />
            Página da Loja
          </Link>
        </Button>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
           <TooltipProvider>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="flex items-center border-b">
                    <TabsList className="flex-grow h-auto p-0 bg-transparent border-0 rounded-none">
                        {currentValues.sellers && currentValues.sellers.map(seller => (
                            <TabsTrigger key={seller.id} value={seller.id} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none">
                                {seller.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {isAdmin && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <TabsList className="h-auto p-0 bg-transparent border-0 rounded-none">
                                    <TabsTrigger value="admin" className="px-3">
                                        <ShieldCheck className="h-5 w-5"/>
                                        <span className="sr-only">Admin</span>
                                    </TabsTrigger>
                                </TabsList>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Painel do Administrador</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>

                {isAdmin && (
                    <TabsContent value="admin">
                        <Card className="mt-4">
                            <CardHeader>
                            <CardTitle>Controles do Administrador</CardTitle>
                            <CardDescription>
                                Ajuste as metas, prêmios, gerencie os vendedores e a segurança aqui.
                            </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                
                                <div className="grid lg:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold mb-2 text-primary">Cadastrar Novo Vendedor</h3>
                                            <div className="flex items-center gap-2">
                                            <FormField control={form.control} name="newSellerName" render={({ field }) => (
                                                <FormItem className="flex-grow">
                                                    <FormLabel className="sr-only">Nome do Vendedor</FormLabel>
                                                    <FormControl><Input placeholder="Nome do Vendedor" {...field} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSeller(); }}} /></FormControl>
                                                </FormItem>
                                            )}
                                            />
                                            <Button type="button" onClick={addSeller}><UserPlus/></Button>
                                            </div>
                                        </div>

                                        <Separator/>

                                        <div>
                                            <h3 className="font-semibold mb-4 text-primary">Gerenciar Vendedores</h3>
                                            <div className="space-y-2">
                                                {currentValues.sellers && currentValues.sellers.map((seller, index) => (
                                                    <div key={seller.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                                                        {editingSellerId === seller.id ? (
                                                            <>
                                                                <FormField control={form.control} name={`sellers.${index}.name`} render={({ field }) => (
                                                                <FormItem className="flex-grow"><FormControl><Input {...field} autoFocus onKeyDown={(e) => { if(e.key === 'Enter') saveSellerName(seller.id); if(e.key==='Escape') cancelEditing(); }}/></FormControl></FormItem>
                                                                )}
                                                            />
                                                                <Button size="icon" variant="ghost" onClick={() => saveSellerName(seller.id)}><Save className="h-4 w-4"/></Button>
                                                                <Button size="icon" variant="ghost" onClick={cancelEditing}><X className="h-4 w-4"/></Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="font-medium">{seller.name}</span>
                                                                <div className="flex items-center">
                                                                    <Button size="icon" variant="ghost" onClick={() => startEditing(seller.id)}><Edit className="h-4 w-4"/></Button>
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger asChild>
                                                                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                                                <AlertDialogDescription>Essa ação não pode ser desfeita. Isso irá remover permanentemente o vendedor e seus dados.</AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                                <AlertDialogAction onClick={() => removeSeller(seller.id)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <Separator/>

                                        <div>
                                            <h3 className="font-semibold mb-4 text-primary">Lançar Vendas</h3>
                                            <div className="space-y-4">
                                                {currentValues.sellers && currentValues.sellers.map((seller, index) => (
                                                    <div key={seller.id}>
                                                        <h4 className="font-medium mb-2">{seller.name}</h4>
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                                            <FormField control={form.control} name={`sellers.${index}.vendas`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Vendas</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                            <FormField control={form.control} name={`sellers.${index}.pa`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">PA</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                            <FormField control={form.control} name={`sellers.${index}.ticketMedio`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Ticket Médio</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                            <FormField control={form.control} name={`sellers.${index}.corridinhaDiaria`} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Corridinha</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Separator />

                                        <div>
                                            <h3 className="font-semibold mb-2 text-primary">Segurança</h3>
                                            <div className="flex items-end gap-2">
                                                 <FormField
                                                    control={form.control}
                                                    name="adminPassword"
                                                    render={({ field }) => (
                                                        <FormItem className="flex-grow">
                                                            <FormLabel>Alterar Senha de Administrador</FormLabel>
                                                            <FormControl>
                                                                <Input type="password" placeholder="Nova senha" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <Button type="button" onClick={handleChangePassword}>
                                                    <KeyRound /> Alterar
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">A senha é salva localmente no navegador. Limpar os dados do site exigirá que a senha padrão "supermoda" seja usada novamente.</p>
                                        </div>

                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="font-semibold mb-4 text-primary">Metas de Vendas</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-sm">Metinha</h4>
                                                <div className="flex items-center gap-2">
                                                    <FormField control={form.control} name="goals.metaMinha" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem> )}/>
                                                    <FormField control={form.control} name="goals.metaMinhaPrize" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl></FormItem> )}/>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-sm">Meta</h4>
                                                <div className="flex items-center gap-2">
                                                    <FormField control={form.control} name="goals.meta" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem> )}/>
                                                    <FormField control={form.control} name="goals.metaPrize" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl></FormItem> )}/>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-sm">Metona</h4>
                                                <div className="flex items-center gap-2">
                                                    <FormField control={form.control} name="goals.metona" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem> )}/>
                                                    <FormField control={form.control} name="goals.metonaPrize" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl></FormItem> )}/>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h4 className="font-medium text-sm">Lendária</h4>
                                                <FormField control={form.control} name="goals.metaLendaria" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem> )}/>
                                                <div className="flex items-center gap-2">
                                                    <FormField control={form.control} name="goals.legendariaBonusValorVenda" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel>A cada (R$)</FormLabel><FormControl><Input type="number" placeholder="Valor Venda" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                    <FormField control={form.control} name="goals.legendariaBonusValorPremio" render={({ field }) => ( <FormItem className="flex-grow"><FormLabel>Bônus (R$)</FormLabel><FormControl><Input type="number" placeholder="Valor Prêmio" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                                                </div>
                                            </div>
                                            </div>
                                        </div>

                                        <Separator />
                                        {renderGoalInputs("PA", goalTiers)}
                                        <Separator />
                                        {renderGoalInputs("Ticket Médio", ticketMedioTiers)}
                                    </div>
                                </div>

                                <Separator />

                                <Button type="submit" disabled={isPending} className="w-full">
                                    {isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando...</>) : "Salvar Metas e Calcular Todos os Incentivos"}
                                    <Calculator className="ml-2 h-5 w-5"/>
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
                
                {currentValues.sellers && currentValues.sellers.map((seller, index) => (
                    <TabsContent key={seller.id} value={seller.id} className="mt-4">
                        <div className="grid lg:grid-cols-1 gap-8">
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
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
           </TooltipProvider>
        </form>
      </Form>
    </div>
  );
}
