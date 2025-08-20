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
} from "lucide-react";

import {
  incentiveProjection,
  type IncentiveProjectionInput,
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

const formSchema = z.object({
  vendas: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  pa: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  ticketMedio: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
  corridinhaDiaria: z.coerce.number({ invalid_type_error: "Deve ser um número" }).min(0),
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
});

type FormValues = z.infer<typeof formSchema>;

export function GoalGetterDashboard() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [incentives, setIncentives] =
    useState<IncentiveProjectionOutput | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendas: 0,
      pa: 0,
      ticketMedio: 0,
      corridinhaDiaria: 0,
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
    },
  });

  const currentValues = form.watch();

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const result = await incentiveProjection(values);
        setIncentives(result);
        toast({
          title: "Sucesso!",
          description: "Incentivos calculados e painel atualizado.",
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

  return (
    <div className="container mx-auto p-4 py-8 md:p-8">
      <header className="flex items-center gap-4 mb-8">
        <Logo />
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">
            Goal Getter
          </h1>
          <p className="text-muted-foreground">
            Acompanhe suas metas e maximize seus ganhos.
          </p>
        </div>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Controles do Admin</CardTitle>
                  <CardDescription>
                    Ajuste as metas e insira os dados de vendas aqui.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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

                  <div>
                    <h3 className="font-semibold mb-4 text-primary">Lançar Vendas e Métricas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="vendas" render={({ field }) => ( <FormItem><FormLabel>Vendas Totais (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="pa" render={({ field }) => ( <FormItem><FormLabel>PA Atual</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="ticketMedio" render={({ field }) => ( <FormItem><FormLabel>Ticket Médio Atual (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                      <FormField control={form.control} name="corridinhaDiaria" render={({ field }) => ( <FormItem><FormLabel>Corridinha Diária (R$)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={isPending} className="w-full">
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
              <ProgressDisplay salesData={currentValues} />
              <IncentivesDisplay incentives={incentives} loading={isPending} />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
