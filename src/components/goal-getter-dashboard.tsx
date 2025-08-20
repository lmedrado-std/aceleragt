"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useTransition } from "react";
import {
  DollarSign,
  Package,
  Ticket,
  TrendingUp,
  Loader2,
  UserPlus,
  Trash2,
  Edit,
  Save,
  X,
  Award,
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
import { IncentivesDisplay } from "@/components/incentives-display";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from 'lucide-react';
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

const sellerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome é obrigatório"),
  vendas: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  pa: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  ticketMedio: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  corridinhaDiaria: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
});

const formSchema = z.object({
  newSellerName: z.string(),
  metaMinha: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  meta: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  metona: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  metaLendaria: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  paGoal1: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  paGoal2: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  paGoal3: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  paGoal4: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  ticketMedioGoal1: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  ticketMedioGoal2: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  ticketMedioGoal3: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  ticketMedioGoal4: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  corridinhaGoal1: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  corridinhaGoal2: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  corridinhaGoal3: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  corridinhaGoal4: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  corridinhaPrize1: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  corridinhaPrize2: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  corridinhaPrize3: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  corridinhaPrize4: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  sellers: z.array(sellerSchema),
});

type FormValues = z.infer<typeof formSchema>;
type Seller = z.infer<typeof sellerSchema>;

const initialSellers: Seller[] = [
  { id: '1', name: 'Val', vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0 },
  { id: '2', name: 'Rose', vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0 },
  { id: '3', name: 'Thays', vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0 },
  { id: '4', name: 'Mercia', vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0 },
  { id: '5', name: 'Joisse', vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0 },
  { id: '6', name: 'Dajila', vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0 },
];

export function GoalGetterDashboard() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [incentives, setIncentives] =
    useState<Record<string, IncentiveProjectionOutput | null>>({});
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(initialSellers[0] || null);
  const [editingSellerId, setEditingSellerId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newSellerName: "",
      metaMinha: 8000,
      meta: 9000,
      metona: 10000,
      metaLendaria: 12000,
      paGoal1: 1.5,
      paGoal2: 1.6,
      paGoal3: 1.9,
      paGoal4: 2.0,
      ticketMedioGoal1: 180,
      ticketMedioGoal2: 185,
      ticketMedioGoal3: 190,
      ticketMedioGoal4: 200,
      corridinhaGoal1: 1000,
      corridinhaGoal2: 1500,
      corridinhaGoal3: 2000,
      corridinhaGoal4: 3000,
      corridinhaPrize1: 5,
      corridinhaPrize2: 10,
      corridinhaPrize3: 15,
      corridinhaPrize4: 20,
      sellers: initialSellers,
    },
  });

  const currentValues = form.watch();

  const addSeller = () => {
    const newSellerName = form.getValues("newSellerName");
    if (newSellerName.trim() === "") {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O nome do vendedor não pode estar vazio.",
      });
      return;
    }
    const newSeller: Seller = {
      id: new Date().toISOString(),
      name: newSellerName,
      vendas: 0,
      pa: 0,
      ticketMedio: 0,
      corridinhaDiaria: 0,
    };
    form.setValue("sellers", [...form.getValues("sellers"), newSeller]);
    form.setValue("newSellerName", "");
    if (!selectedSeller) {
        setSelectedSeller(newSeller);
    }
  };

  const removeSeller = (sellerId: string) => {
    const updatedSellers = currentValues.sellers.filter(s => s.id !== sellerId);
    form.setValue("sellers", updatedSellers);
    if (selectedSeller?.id === sellerId) {
        setSelectedSeller(updatedSellers[0] || null);
        setIncentives(prev => {
            const newIncentives = {...prev};
            delete newIncentives[sellerId];
            return newIncentives;
        });
    }
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

    const newName = form.getValues(`sellers.${sellerIndex}.name`);
    if (newName.trim() === "") {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O nome do vendedor não pode estar vazio.",
      });
      return;
    }
    setEditingSellerId(null);
  }

  const selectedSellerIndex = currentValues.sellers.findIndex(s => s.id === selectedSeller?.id);

  const onSubmit = (values: FormValues) => {
    if (!selectedSeller) {
      toast({
        variant: "destructive",
        title: "Nenhum vendedor selecionado",
        description: "Por favor, selecione um vendedor para calcular os incentivos.",
      });
      return;
    }

    startTransition(async () => {
      try {
        const sellerData = values.sellers.find(s => s.id === selectedSeller.id);
        if (!sellerData) throw new Error("Vendedor não encontrado");

        const result = await incentiveProjection({
          vendas: sellerData.vendas,
          pa: sellerData.pa,
          ticketMedio: sellerData.ticketMedio,
          corridinhaDiaria: sellerData.corridinhaDiaria,
          metaMinha: values.metaMinha,
          meta: values.meta,
          metona: values.metona,
          metaLendaria: values.metaLendaria,
          paGoal1: values.paGoal1,
          paGoal2: values.paGoal2,
          paGoal3: values.paGoal3,
          paGoal4: values.paGoal4,
          ticketMedioGoal1: values.ticketMedioGoal1,
          ticketMedioGoal2: values.ticketMedioGoal2,
          ticketMedioGoal3: values.ticketMedioGoal3,
          ticketMedioGoal4: values.ticketMedioGoal4,
          corridinhaGoal1: values.corridinhaGoal1,
          corridinhaGoal2: values.corridinhaGoal2,
          corridinhaGoal3: values.corridinhaGoal3,
          corridinhaGoal4: values.corridinhaGoal4,
          corridinhaPrize1: values.corridinhaPrize1,
          corridinhaPrize2: values.corridinhaPrize2,
          corridinhaPrize3: values.corridinhaPrize3,
          corridinhaPrize4: values.corridinhaPrize4,
        });
        setIncentives(prev => ({ ...prev, [selectedSeller.id]: result }));
        toast({
          title: "Sucesso!",
          description: `Incentivos para ${selectedSeller.name} calculados.`,
        });
      } catch (error) {
        console.error("Calculation Error:", error);
        toast({
          variant: "destructive",
          title: "Erro de Cálculo",
          description:
            "Não foi possível calcular os incentivos. Tente novamente.",
        });
      }
    });
  };

  const handleSellerChange = (seller: Seller) => {
    setSelectedSeller(seller);
  };

  const renderGoalInputs = (level: string, goal1: any, prize1: any, goal2: any, prize2: any, goal3: any, prize3: any, goal4: any, prize4: any) => (
    <div>
        <h3 className="font-semibold mb-4 text-primary">Metas de {level}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            <div className="space-y-2">
                <h4 className="font-medium text-sm">Metinha</h4>
                <div className="flex items-center gap-2">
                    <FormField control={form.control} name={goal1} render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem> )}/>
                    <FormField control={form.control} name={prize1} render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl></FormItem> )}/>
                </div>
            </div>
             <div className="space-y-2">
                <h4 className="font-medium text-sm">Meta</h4>
                 <div className="flex items-center gap-2">
                    <FormField control={form.control} name={goal2} render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem> )}/>
                    <FormField control={form.control} name={prize2} render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl></FormItem> )}/>
                </div>
            </div>
             <div className="space-y-2">
                <h4 className="font-medium text-sm">Metona</h4>
                 <div className="flex items-center gap-2">
                    <FormField control={form.control} name={goal3} render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem> )}/>
                    <FormField control={form.control} name={prize3} render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl></FormItem> )}/>
                </div>
            </div>
             <div className="space-y-2">
                <h4 className="font-medium text-sm">Lendária</h4>
                 <div className="flex items-center gap-2">
                    <FormField control={form.control} name={goal4} render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Meta</FormLabel><FormControl><Input type="number" placeholder="Meta" {...field} /></FormControl></FormItem> )}/>
                    <FormField control={form.control} name={prize4} render={({ field }) => ( <FormItem className="flex-grow"><FormLabel className="sr-only">Prêmio</FormLabel><FormControl><Input type="number" placeholder="Prêmio (R$)" {...field} /></FormControl></FormItem> )}/>
                </div>
            </div>
        </div>
    </div>
  )


  return (
    <div className="container mx-auto p-4 py-8 md:p-8">
      <header className="flex items-center gap-4 mb-8">
        <Logo />
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">
            Corridinha GT
          </h1>
          <p className="text-muted-foreground">
            Acompanhe suas metas e maximize seus ganhos.
          </p>
        </div>
      </header>
       <div className="mb-6 flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                  {selectedSeller ? selectedSeller.name : "Selecione um Vendedor"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {currentValues.sellers.length > 0 ? (
                  currentValues.sellers.map((seller) => (
                    <DropdownMenuItem
                      key={seller.id}
                      onSelect={() => handleSellerChange(seller)}
                    >
                      {seller.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>Nenhum vendedor cadastrado</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="text-muted-foreground">
                {currentValues.sellers.length > 0 ? "Selecione um vendedor para ver seu desempenho." : "Cadastre um vendedor para começar."}
            </span>
       </div>


      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Controles do Admin</CardTitle>
                  <CardDescription>
                    Ajuste as metas e gerencie os vendedores aqui.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                 <div>
                    <h3 className="font-semibold mb-2 text-primary">Cadastrar Novo Vendedor</h3>
                    <div className="flex items-center gap-2">
                       <FormField control={form.control} name="newSellerName" render={({ field }) => (
                          <FormItem className="flex-grow">
                            <FormLabel className="sr-only">Nome do Vendedor</FormLabel>
                            <FormControl><Input placeholder="Nome do Vendedor" {...field} /></FormControl>
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
                        {currentValues.sellers.map((seller, index) => (
                            <div key={seller.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50">
                                {editingSellerId === seller.id ? (
                                    <>
                                        <FormField control={form.control} name={`sellers.${index}.name`} render={({ field }) => (
                                          <FormItem className="flex-grow"><FormControl><Input {...field} /></FormControl></FormItem>
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
                    <h3 className="font-semibold mb-4 text-primary">Metas de Vendas</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="metaMinha" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Metinha (R$)</FormLabel>
                            <FormControl><Input type="number" step="100" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="meta" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meta (R$)</FormLabel>
                            <FormControl><Input type="number" step="100" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="metona" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Metona (R$)</FormLabel>
                            <FormControl><Input type="number" step="100" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="metaLendaria" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lendária (R$)</FormLabel>
                            <FormControl><Input type="number" step="100" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-4 text-primary">Metas de PA</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <FormField control={form.control} name="paGoal1" render={({ field }) => ( <FormItem><FormLabel>Metinha</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem> )}/>
                        <FormField control={form.control} name="paGoal2" render={({ field }) => ( <FormItem><FormLabel>Meta</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem> )}/>
                        <FormField control={form.control} name="paGoal3" render={({ field }) => ( <FormItem><FormLabel>Metona</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem> )}/>
                        <FormField control={form.control} name="paGoal4" render={({ field }) => ( <FormItem><FormLabel>Lendária</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem> )}/>
                    </div>
                  </div>

                   <Separator />

                  <div>
                    <h3 className="font-semibold mb-4 text-primary">Metas de Ticket Médio</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <FormField control={form.control} name="ticketMedioGoal1" render={({ field }) => ( <FormItem><FormLabel>Metinha (R$)</FormLabel><FormControl><Input type="number" step="5" {...field} /></FormControl></FormItem> )}/>
                        <FormField control={form.control} name="ticketMedioGoal2" render={({ field }) => ( <FormItem><FormLabel>Meta (R$)</FormLabel><FormControl><Input type="number" step="5" {...field} /></FormControl></FormItem> )}/>
                        <FormField control={form.control} name="ticketMedioGoal3" render={({ field }) => ( <FormItem><FormLabel>Metona (R$)</FormLabel><FormControl><Input type="number" step="5" {...field} /></FormControl></FormItem> )}/>
                        <FormField control={form.control} name="ticketMedioGoal4" render={({ field }) => ( <FormItem><FormLabel>Lendária (R$)</FormLabel><FormControl><Input type="number" step="5" {...field} /></FormControl></FormItem> )}/>
                    </div>
                  </div>

                   <Separator />

                    {renderGoalInputs(
                        "Corridinha Diária",
                        "corridinhaGoal1", "corridinhaPrize1",
                        "corridinhaGoal2", "corridinhaPrize2",
                        "corridinhaGoal3", "corridinhaPrize3",
                        "corridinhaGoal4", "corridinhaPrize4"
                    )}
                  
                  <Separator />

                  {selectedSeller && selectedSellerIndex !== -1 && (
                    <div>
                      <h3 className="font-semibold mb-4 text-primary">Lançar Vendas para {currentValues.sellers[selectedSellerIndex]?.name}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name={`sellers.${selectedSellerIndex}.vendas`} render={({ field }) => ( <FormItem><FormLabel>Vendas Totais (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name={`sellers.${selectedSellerIndex}.pa`} render={({ field }) => ( <FormItem><FormLabel>PA Atual</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name={`sellers.${selectedSellerIndex}.ticketMedio`} render={({ field }) => ( <FormItem><FormLabel>Ticket Médio Atual (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name={`sellers.${selectedSellerIndex}.corridinhaDiaria`} render={({ field }) => ( <FormItem><FormLabel>Corridinha Diária (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                      </div>
                    </div>
                  )}
                  
                  <Button type="submit" disabled={isPending || !selectedSeller} className="w-full">
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      "Calcular Incentivos e Atualizar Painel"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-3 space-y-8">
              {selectedSeller && selectedSellerIndex !== -1 ? (
                <>
                  <ProgressDisplay 
                    salesData={{
                        vendas: currentValues.sellers[selectedSellerIndex]?.vendas || 0,
                        pa: currentValues.sellers[selectedSellerIndex]?.pa || 0,
                        ticketMedio: currentValues.sellers[selectedSellerIndex]?.ticketMedio || 0,
                        corridinhaDiaria: currentValues.sellers[selectedSellerIndex]?.corridinhaDiaria || 0,
                        metaMinha: currentValues.metaMinha,
                        meta: currentValues.meta,
                        metona: currentValues.metona,
                        metaLendaria: currentValues.metaLendaria,
                        paGoal4: currentValues.paGoal4,
                        ticketMedioGoal4: currentValues.ticketMedioGoal4,
                        corridinhaGoal4: currentValues.corridinhaGoal4,
                    }}
                   />
                  <IncentivesDisplay incentives={incentives[selectedSeller.id]} loading={isPending} />
                </>
              ) : (
                <Card className="shadow-lg flex items-center justify-center h-full">
                    <CardContent className="text-center text-muted-foreground p-10">
                        <UserPlus className="mx-auto h-12 w-12" />
                        <p className="mt-4">
                            Selecione um vendedor ou cadastre um novo para ver o painel de progresso e incentivos.
                        </p>
                    </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
