
"use client";

import type { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Trophy,
    Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Goals, Seller } from "@/lib/storage";
import { RankingMetric } from "./goal-getter-dashboard";
import { Area, AreaChart, CartesianGrid, Label, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";


type ProgressDisplaySalesData = Partial<Seller> & {
    goals: Goals;
};

interface ProgressDisplayProps {
  salesData: ProgressDisplaySalesData;
  incentives: IncentiveProjectionOutput | null;
  rankings: Record<RankingMetric, number> | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
  
const formatPercentage = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const GoalDetail = ({ label, prize, achieved }: { label: string, prize: number, achieved: boolean }) => (
     <div className={cn("flex justify-between items-center p-3 rounded-lg", achieved ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" : "bg-muted/50")}>
        <p className="font-medium">{label}</p>
        <p className={cn("font-bold text-lg", achieved ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>{formatCurrency(prize)}</p>
    </div>
)

const TargetGoalItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center text-sm py-2 border-b border-border/50 last:border-0">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
    </div>
);


export function ProgressDisplay({ salesData, incentives, rankings }: ProgressDisplayProps) {
  const {
    name = "Vendedor",
    vendas = 0,
    pa = 0,
    ticket_medio: ticketMedio = 0,
    goals,
  } = salesData;
  
  if (!goals) {
    return <div className="p-4">Carregando metas...</div>;
  }
  
  const totalIncentives = incentives
    ? Object.values(incentives).reduce((sum, val) => sum + (val || 0), 0)
    : 0;

  const salesRank = vendas > 0 ? rankings?.vendas : undefined;
  
  let rankMedal = "";
  let rankMessage = "";

  if (salesRank && salesRank > 0) {
      if (salesRank === 1) {
          rankMedal = "🥇";
          rankMessage = `Parabéns, ${name}! Você está em 1º lugar, liderando com excelência!`;
      } else if (salesRank === 2) {
          rankMedal = "🥈";
          rankMessage = `Mandou bem, ${name}! Você está no 2º lugar, continue assim!`;
      } else if (salesRank === 3) {
          rankMedal = "🥉";
          rankMessage = `Muito bom, ${name}! Você conquistou o 3º lugar, bora buscar o topo!`;
      } else {
          rankMessage = `Bora subir, ${name}! Você está em ${salesRank}º lugar. Continue se esforçando, o pódio te espera!`;
      }
  }
  
  // Data for charts
  const salesPercentage = goals.metona > 0 ? Math.min(vendas / goals.metona, 1) : 0;
  const paPercentage = goals.paGoal4 > 0 ? Math.min(pa / goals.paGoal4, 1) : 0;
  const ticketMedioPercentage = goals.ticketMedioGoal4 > 0 ? Math.min(ticketMedio / goals.ticketMedioGoal4, 1) : 0;
  
  const salesChartData = [{ month: "Vendas", desktop: vendas }];
  const salesChartConfig = {
    desktop: {
      label: "Vendas",
      color: "hsl(var(--chart-1))",
    },
  } satisfies ChartConfig;

  const paChartData = [{ name: 'PA', value: paPercentage, fill: 'hsl(var(--chart-1))' }];
  const ticketMedioChartData = [{ name: 'Ticket Médio', value: ticketMedioPercentage, fill: 'hsl(var(--chart-1))' }];

  const chartConfig = {
    vendas: {
      label: "Vendas",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  return (
    <div className="space-y-6">
        <Card className="col-span-full bg-primary text-primary-foreground">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-primary-foreground/80">Ganho Total Projetado</p>
                    <p className="text-3xl font-bold">{formatCurrency(totalIncentives)}</p>
                </div>
                 {vendas > 0 && salesRank && salesRank > 0 && (
                     <div className="text-right flex-grow">
                        <div className="flex items-center justify-end gap-2 font-bold">
                            <Trophy className="h-5 w-5" />
                            <span>{salesRank}º Lugar em Vendas</span>
                        </div>
                        {rankMessage && <p className="text-sm text-primary-foreground/80 mt-1">{rankMedal} {rankMessage}</p>}
                    </div>
                )}
            </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                     <CardTitle className="text-xl">Progresso das Metas</CardTitle>
                    <CardDescription>Veja o quão perto você está de bater suas metas.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                       <h3 className="font-semibold">Meta de Vendas</h3>
                       <div className="text-4xl font-bold text-foreground">{formatCurrency(vendas)}</div>
                       <ChartContainer config={chartConfig} className="h-[150px] w-full">
                            <AreaChart accessibilityLayer data={[{vendas, goal: goals.metona}]}>
                                <defs>
                                <linearGradient id="fillVendas" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                    offset="5%"
                                    stopColor="var(--color-vendas)"
                                    stopOpacity={0.8}
                                    />
                                    <stop
                                    offset="95%"
                                    stopColor="var(--color-vendas)"
                                    stopOpacity={0.1}
                                    />
                                </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} />
                                <YAxis 
                                    dataKey="vendas" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={8} 
                                    domain={[0, 'dataMax + 1000']} 
                                    tickFormatter={(value) => formatCurrency(Number(value)).replace(/\,00$/,'').replace(/\s/g,'')}
                                />
                                <XAxis dataKey="month" hide />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area dataKey="vendas" type="natural" fill="url(#fillVendas)" stroke="var(--color-vendas)" />
                            </AreaChart>
                        </ChartContainer>
                   </div>
                   <div className="grid grid-cols-2 gap-6 items-center">
                       <div className="flex flex-col items-center gap-2">
                           <h3 className="font-semibold">Meta PA</h3>
                           <ChartContainer config={{}} className="h-32 w-32">
                             <PieChart>
                                <Pie data={[{ value: paPercentage }, { value: 1-paPercentage }]} dataKey="value" nameKey="name" innerRadius={35} outerRadius={45} startAngle={90} endAngle={450} cornerRadius={5}>
                                  <Label
                                    content={({ viewBox }) => {
                                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                        return (
                                          <text
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="fill-foreground text-xl font-bold"
                                          >
                                            {formatPercentage(paPercentage)}
                                          </text>
                                        );
                                      }
                                    }}
                                  />
                                  <cell fill="hsl(var(--primary))" />
                                  <cell fill="hsl(var(--muted))" />
                                </Pie>
                              </PieChart>
                           </ChartContainer>
                       </div>
                       <div className="flex flex-col items-center gap-2">
                           <h3 className="font-semibold">Meta Ticket Médio</h3>
                           <ChartContainer config={{}} className="h-32 w-32">
                             <PieChart>
                                <Pie data={[{ value: ticketMedioPercentage }, { value: 1-ticketMedioPercentage }]} dataKey="value" nameKey="name" innerRadius={35} outerRadius={45} startAngle={90} endAngle={450} cornerRadius={5}>
                                  <Label
                                    content={({ viewBox }) => {
                                      if (viewBox && "cx" in viewBox) {
                                        return (
                                          <text
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            className="fill-foreground text-xl font-bold"
                                          >
                                            {formatPercentage(ticketMedioPercentage)}
                                          </text>
                                        );
                                      }
                                    }}
                                  />
                                  <cell fill="hsl(var(--primary))" />
                                  <cell fill="hsl(var(--muted))" />
                                </Pie>
                              </PieChart>
                           </ChartContainer>
                       </div>
                   </div>
                </CardContent>
            </Card>

            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Resumo de Ganhos</CardTitle>
                        <CardDescription>Seus prêmios e bônus por performance detalhados.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <GoalDetail label="Prêmio Meta 1" prize={incentives?.meta1Premio || 0} achieved={(incentives?.meta1Premio || 0) > 0} />
                        <GoalDetail label="Prêmio Meta 2" prize={incentives?.meta2Premio || 0} achieved={(incentives?.meta2Premio || 0) > 0} />
                        <GoalDetail label="Prêmio Meta 3" prize={incentives?.meta3Premio || 0} achieved={(incentives?.meta3Premio || 0) > 0} />
                        {goals.performanceBonusEnabled && <GoalDetail label="Bônus Performance" prize={incentives?.legendariaBonus || 0} achieved={(incentives?.legendariaBonus || 0) > 0} />}
                        <Separator/>
                        <GoalDetail label="Bônus PA" prize={incentives?.paBonus || 0} achieved={(incentives?.paBonus || 0) > 0} />
                        <GoalDetail label="Bônus Ticket Médio" prize={incentives?.ticketMedioBonus || 0} achieved={(incentives?.ticketMedioBonus || 0) > 0} />
                        <GoalDetail label="Bônus Corridinha" prize={incentives?.corridinhaDiariaBonus || 0} achieved={(incentives?.corridinhaDiariaBonus || 0) > 0} />
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2"><Target /> Minhas Metas</CardTitle>
                        <CardDescription>Valores definidos pelo gerente para este período.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <h4 className="font-semibold text-sm mb-2">Metas de Vendas</h4>
                        <TargetGoalItem label="Meta 1" value={formatCurrency(goals.metaMinha)} />
                        <TargetGoalItem label="Meta 2" value={formatCurrency(goals.meta)} />
                        <TargetGoalItem label="Meta 3" value={formatCurrency(goals.metona)} />
                         {goals.performanceBonusEnabled && <TargetGoalItem label="Bônus Performance" value={formatCurrency(goals.metaLendaria)} />}
                        <Separator className="my-3"/>
                        <h4 className="font-semibold text-sm mb-2">Metas de PA</h4>
                        <TargetGoalItem label="Nível 1" value={`${goals.paGoal1} PA`} />
                        <TargetGoalItem label="Nível 2" value={`${goals.paGoal2} PA`} />
                        <TargetGoalItem label="Nível 3" value={`${goals.paGoal3} PA`} />
                        <TargetGoalItem label="Nível 4" value={`${goals.paGoal4} PA`} />
                        <Separator className="my-3"/>
                        <h4 className="font-semibold text-sm mb-2">Metas de Ticket Médio</h4>
                        <TargetGoalItem label="Nível 1" value={formatCurrency(goals.ticketMedioGoal1)} />
                        <TargetGoalItem label="Nível 2" value={formatCurrency(goals.ticketMedioGoal2)} />
                        <TargetGoalItem label="Nível 3" value={formatCurrency(goals.ticketMedioGoal3)} />
                        <TargetGoalItem label="Nível 4" value={formatCurrency(goals.ticketMedioGoal4)} />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
