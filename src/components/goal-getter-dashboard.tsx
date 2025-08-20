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
  paGoal1: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  paGoal2: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  paGoal3: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  paGoal4: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  ticketMedioGoal1: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  ticketMedioGoal2: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  ticketMedioGoal3: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  ticketMedioGoal4: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  sellers: z.array(sellerSchema),
});

type FormValues = z.infer<typeof formSchema>;
type Seller = z.infer<typeof sellerSchema>;

export function GoalGetterDashboard() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [incentives, setIncentives] =
    useState<Record<string, IncentiveProjectionOutput | null>>({});
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newSellerName: "",
      metaMinha: 8000,
      meta: 9000,
      metona: 10000,
      paGoal1: 1.5,
      paGoal2: 1.6,
      paGoal3: 1.9,
      paGoal4: 2.0,
      ticketMedioGoal1: 180,
      ticketMedioGoal2: 185,
      ticketMedioGoal3: 190,
      ticketMedioGoal4: 200,
      sellers: [],
    },
  });

  const { fields, append, update, remove } =
    //@ts-ignore
    useForm<FormValues>({
      control: form.control,
      name: "sellers",
    });

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

  const currentValues = form.watch();
  
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
          paGoal1: values.paGoal1,
          paGoal2: values.paGoal2,
          paGoal3: values.paGoal3,
          paGoal4: values.paGoal4,
          ticketMedioGoal1: values.ticketMedioGoal1,
          ticketMedioGoal2: values.ticketMedioGoal2,
          ticketMedioGoal3: values.ticketMedioGoal3,
          ticketMedioGoal4: values.ticketMedioGoal4,
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
    if (!incentives[seller.id]) {
      // Optional: auto-calculate when switching seller if data exists
      // onSubmit(form.getValues());
    }
  };


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
                    <h3 className="font-semibold mb-4 text-primary">Cadastrar Vendedor</h3>
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
                    <h3 className="font-semibold mb-4 text-primary">Metas de Vendas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-4 text-primary">Metas de PA</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <FormField control={form.control} name="paGoal1" render={({ field }) => ( <FormItem><FormLabel>Nível 1</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem> )}/>
                        <FormField control={form.control} name="paGoal2" render={({ field }) => ( <FormItem><FormLabel>Nível 2</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem> )}/>
                        <FormField control={form.control} name="paGoal3" render={({ field }) => ( <FormItem><FormLabel>Nível 3</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem> )}/>
                        <FormField control={form.control} name="paGoal4" render={({ field }) => ( <FormItem><FormLabel>Nível 4</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl></FormItem> )}/>
                    </div>
                  </div>

                   <Separator />

                  <div>
                    <h3 className="font-semibold mb-4 text-primary">Metas de Ticket Médio</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <FormField control={form.control} name="ticketMedioGoal1" render={({ field }) => ( <FormItem><FormLabel>Nível 1 (R$)</FormLabel><FormControl><Input type="number" step="5" {...field} /></FormControl></FormItem> )}/>
                        <FormField control={form.control} name="ticketMedioGoal2" render={({ field }) => ( <FormItem><FormLabel>Nível 2 (R$)</FormLabel><FormControl><Input type="number" step="5" {...field} /></FormControl></FormItem> )}/>
                        <FormField control={form.control} name="ticketMedioGoal3" render={({ field }) => ( <FormItem><FormLabel>Nível 3 (R$)</FormLabel><FormControl><Input type="number" step="5" {...field} /></FormControl></FormItem> )}/>
                        <FormField control={form.control} name="ticketMedioGoal4" render={({ field }) => ( <FormItem><FormLabel>Nível 4 (R$)</FormLabel><FormControl><Input type="number" step="5" {...field} /></FormControl></FormItem> )}/>
                    </div>
                  </div>
                  
                  <Separator />

                  {selectedSeller && selectedSellerIndex !== -1 && (
                    <div>
                      <h3 className="font-semibold mb-4 text-primary">Lançar Vendas para {selectedSeller.name}</h3>
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
              {selectedSeller ? (
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
                        paGoal4: currentValues.paGoal4,
                        ticketMedioGoal4: currentValues.ticketMedioGoal4,
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
