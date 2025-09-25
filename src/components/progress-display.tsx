
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
import { Progress } from "@/components/ui/progress";


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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

const CircularProgress = ({ percentage }: { percentage: number }) => {
    const radius = 50;
    const stroke = 10;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-28 h-28 flex-shrink-0">
            <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-90"
            >
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="text-white/30"
                />
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="text-white transition-all duration-300"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                 <span className="flex items-center justify-center text-2xl font-bold text-white bg-black/10 rounded-full h-16 w-16">
                    {Math.round(percentage)}%
                 </span>
            </div>
        </div>
    );
};


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
  
  const salesPercentage = goals.metona > 0 ? Math.min((vendas / goals.metona) * 100, 100) : 0;
  const paPercentage = goals.paGoal4 > 0 ? Math.min((Number(pa) / goals.paGoal4) * 100, 100) : 0;
  const ticketMedioPercentage = goals.ticketMedioGoal4 > 0 ? Math.min((Number(ticketMedio) / goals.ticketMedioGoal4) * 100, 100) : 0;


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
                     <CardTitle className="text-xl">Painel de Desempenho do Vendedor</CardTitle>
                    <CardDescription>Acompanhe seu progresso em relação às metas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Sales to Goal */}
                    <div className="p-6 rounded-lg bg-blue-600 text-white">
                        <h3 className="text-lg font-semibold mb-4">Vendas até a Meta 3</h3>
                        <div className="flex items-center gap-4">
                            <Progress value={salesPercentage} className="h-3 flex-1 bg-white/30 [&>div]:bg-white" />
                            <span className="text-lg font-bold">{formatPercentage(salesPercentage / 100)}</span>
                        </div>
                    </div>
                    {/* PA and Ticket to Goal */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="p-6 rounded-lg bg-green-500 text-white flex items-center justify-between gap-4">
                            <CircularProgress percentage={paPercentage} />
                            <div className="text-right">
                                <h3 className="text-lg font-semibold">PA até a Meta</h3>
                                <p className="text-sm opacity-80">Nível 4</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-lg bg-orange-500 text-white flex items-center justify-between gap-4">
                            <CircularProgress percentage={ticketMedioPercentage} />
                             <div className="text-right">
                                <h3 className="text-lg font-semibold">Ticket Médio</h3>
                                <p className="text-sm opacity-80">Nível 4</p>
                            </div>
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
