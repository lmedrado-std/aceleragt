
"use client";

import React, { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Goals, Seller } from "@/lib/storage";
import { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { DollarSign, Package, Percent, Target } from "lucide-react";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";

interface Props {
  salesData: Partial<Seller> & { goals: Goals };
  incentives: IncentiveProjectionOutput | null;
}

const formatCurrency = (value: number) => {
    return (Number(value) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const MetricCard = ({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description?: string }) => (
    <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
)

export const ProgressDisplay: React.FC<Props> = ({ salesData, incentives }) => {
  const { toast } = useToast();
  
  const ganhoTotal = useMemo(() => {
    if (!incentives) return 0;
    return Object.values(incentives).reduce((acc, val) => acc + (val || 0), 0);
  }, [incentives]);

  const { goals, vendas, pa, ticketMedio, corridinhaDiaria } = salesData;

  const highestGoal = Math.max(goals?.metaMinha || 0, goals?.meta || 0, goals?.metona || 0, goals?.metaLendaria || 0) || 1;
  const salesProgress = (Number(vendas) / highestGoal) * 100;

  return (
    <div className="space-y-6">
        <Card className="bg-primary text-primary-foreground shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl">Dashboard de Metas</CardTitle>
                <CardDescription className="text-primary-foreground/90">Seu resumo de desempenho e ganhos.</CardDescription>
            </CardHeader>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
                title="Vendas Realizadas"
                value={formatCurrency(Number(vendas))}
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                description="Total vendido no período"
            />
             <MetricCard 
                title="Produtos por Atendimento (PA)"
                value={String(Number(pa || 0).toFixed(2))}
                icon={<Package className="h-4 w-4 text-muted-foreground" />}
                 description="Média de itens por venda"
            />
             <MetricCard 
                title="Ticket Médio"
                value={formatCurrency(ticketMedio || 0)}
                icon={<Percent className="h-4 w-4 text-muted-foreground" />}
                 description="Valor médio por venda"
            />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Resumo de Ganhos</CardTitle>
                 <CardDescription>O total de prêmios projetado com base no seu desempenho atual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center bg-accent/20 dark:bg-accent/30 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-accent-foreground/80 dark:text-accent-foreground/90">Ganho Total Projetado</h3>
                    <p className="text-3xl font-bold text-accent dark:text-accent-foreground">
                        {formatCurrency(ganhoTotal)}
                    </p>
                </div>

                {incentives && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div className="space-y-2">
                             <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Prêmio de Vendas:</span><strong className="font-medium">{formatCurrency((incentives.metinhaPremio || 0) + (incentives.metaPremio || 0) + (incentives.metonaPremio || 0))}</strong></div>
                             <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Bônus Lendária:</span><strong className="font-medium">{formatCurrency(incentives.legendariaBonus || 0)}</strong></div>
                        </div>
                         <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Prêmio PA:</span><strong className="font-medium">{formatCurrency(incentives.paBonus || 0)}</strong></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Prêmio Ticket Médio:</span><strong className="font-medium">{formatCurrency(incentives.ticketMedioBonus || 0)}</strong></div>
                            <div className="flex justify-between items-center text-sm"><span className="text-muted-foreground">Corridinha:</span><strong className="font-medium">{formatCurrency(incentives.corridinhaDiariaBonus || 0)}</strong></div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target/> Progresso das Metas</CardTitle>
                <CardDescription>Veja o quão perto você está de alcançar seus objetivos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">Progresso de Vendas</span>
                        <span className="text-muted-foreground">{formatCurrency(Number(vendas))} / {formatCurrency(highestGoal)}</span>
                    </div>
                    <Progress value={salesProgress} />
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                     <ProgressItem title="Meta PA" currentValue={pa || 0} goalValue={goals?.paGoal4 || 0} formatValue={(v) => Number(v || 0).toFixed(2)}/>
                     <ProgressItem title="Meta Ticket Médio" currentValue={ticketMedio || 0} goalValue={goals?.ticketMedioGoal4 || 0} formatValue={formatCurrency}/>
                </div>
            </CardContent>
        </Card>
    </div>
  );
};

const ProgressItem = ({ title, currentValue, goalValue, formatValue }: { title: string, currentValue: number, goalValue: number, formatValue: (v: number) => string }) => {
    const progress = goalValue > 0 ? (Number(currentValue) / goalValue) * 100 : 0;
    const achieved = Number(currentValue) >= goalValue;
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{title}</span>
                <span className={cn("font-semibold", achieved ? "text-green-600" : "text-muted-foreground")}>{formatValue(Number(currentValue))} / {formatValue(goalValue)}</span>
            </div>
            <Progress value={progress} className={achieved ? "[&>div]:bg-green-500" : ""} />
        </div>
    )
}
