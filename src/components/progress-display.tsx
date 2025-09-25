
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


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

const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value || 0);
}

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


const SalesProgressBar = ({ vendas, goals }: { vendas: number, goals: Goals }) => {
    const metas = [
        { label: "Meta 1", value: goals.metaMinha, prize: goals.metaMinhaPrize },
        { label: "Meta 2", value: goals.meta, prize: goals.metaPrize },
        { label: "Meta 3", value: goals.metona, prize: goals.metonaPrize },
    ];
    const totalMeta = goals.metona;
    const progressPercentage = totalMeta > 0 ? (vendas / totalMeta) * 100 : 0;

    const findNextGoal = () => {
        if (vendas < goals.metaMinha) return { label: "Meta 1", value: goals.metaMinha };
        if (vendas < goals.meta) return { label: "Meta 2", value: goals.meta };
        if (vendas < goals.metona) return { label: "Meta 3", value: goals.metona };
        if (goals.performanceBonusEnabled && vendas < goals.metaLendaria) return { label: "Bônus", value: goals.metaLendaria };
        return null;
    };
    const nextGoal = findNextGoal();

    return (
        <div>
            <h4 className="font-semibold text-card-foreground">Vendas até a Meta</h4>
            <p className="text-sm text-muted-foreground mb-3">Progresso em relação às metas principais de vendas.</p>
            <div className="relative h-8 w-full rounded-full bg-muted mt-8">
                {/* Metas como marcadores */}
                {metas.map((meta, index) => {
                    const left = totalMeta > 0 ? (meta.value / totalMeta) * 100 : 0;
                    const achieved = vendas >= meta.value;
                    return (
                        <TooltipProvider key={index}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute top-0 h-full flex items-center" style={{ left: `${left}%`, transform: 'translateX(-50%)' }}>
                                        <div className={cn("h-full w-1", achieved ? "bg-green-500" : "bg-border")}></div>
                                        <div className="absolute -top-7 text-xs font-medium text-muted-foreground">{meta.label}</div>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{meta.label}: {formatCurrency(meta.value)}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}

                {/* Barra de Progresso */}
                <div className="absolute top-0 left-0 h-full rounded-full bg-primary" style={{ width: `${progressPercentage}%` }}></div>

                {/* Indicador de Meta Atingida */}
                {metas.map((meta, index) => {
                    const left = totalMeta > 0 ? (meta.value / totalMeta) * 100 : 0;
                    if (vendas >= meta.value) {
                         return (
                            <div key={index} className="absolute top-0 flex items-center" style={{ left: `${left}%`, transform: 'translateX(-50%)' }}>
                                <Trophy className="h-5 w-5 text-yellow-400 absolute -bottom-6" />
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
             <div className="mt-8 text-center text-sm">
                {nextGoal ? (
                    <p className="text-muted-foreground">
                        Faltam <span className="font-bold text-primary">{formatCurrency(nextGoal.value - vendas)}</span> para a <span className="font-bold text-primary">{nextGoal.label}</span>!
                    </p>
                ) : (
                    <p className="font-bold text-green-600 flex items-center justify-center gap-2"><Trophy/> Todas as metas principais foram atingidas! Parabéns!</p>
                )}
            </div>
        </div>
    );
};

const CircularGauge = ({ label, currentValue, goals, unit, valueFormatter }: { label: string; currentValue: number; goals: {value: number, label: string}[]; unit: string; valueFormatter: (value: number) => string; }) => {
    
    let currentTier = 0;
    let nextGoalValue = goals[0]?.value || 0;
    let nextGoalLabel = goals[0]?.label || 'Nível 1';

    for (let i = goals.length - 1; i >= 0; i--) {
        if (currentValue >= goals[i].value) {
            currentTier = i + 1;
            if (i < goals.length - 1) {
                nextGoalValue = goals[i+1].value;
                nextGoalLabel = goals[i+1].label;
            } else {
                nextGoalValue = goals[i].value; // Already at max tier
                nextGoalLabel = goals[i].label;
            }
            break;
        }
    }
    
     if (currentTier === 0 && goals.length > 0) {
        nextGoalValue = goals[0].value;
        nextGoalLabel = goals[0].label;
    }


    const progressPercentage = nextGoalValue > 0 ? Math.min((currentValue / nextGoalValue) * 100, 100) : 0;
    
    const strokeWidth = 12;
    const radius = 60;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

    const nextGoalInfo = () => {
        if (currentTier < goals.length) {
            const diff = nextGoalValue - currentValue;
            return `Faltam ${valueFormatter(diff)} para ${nextGoalLabel}`;
        }
        return `${goals[goals.length-1].label} atingido!`;
    };

    return (
        <div className="flex flex-col items-center">
            <h4 className="font-semibold text-card-foreground mb-2">{label}</h4>
            <div className="relative" style={{width: radius*2, height: radius*2}}>
                <svg height={radius * 2} width={radius * 2} className="-rotate-90">
                    <circle
                        className="text-muted"
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    <circle
                        className={cn(currentValue >= nextGoalValue ? "text-green-500" : "text-primary")}
                        stroke="currentColor"
                        fill="transparent"
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset }}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                     <span className="text-2xl font-bold text-foreground">
                        {valueFormatter(currentValue)}
                    </span>
                    {currentTier > 0 && <p className="text-xs font-bold text-green-500 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded-full">{goals[currentTier-1].label}!</p>}
                </div>
            </div>
             <div className="mt-3 text-center text-xs text-muted-foreground h-4">
                <p>{nextGoalInfo()}</p>
            </div>
        </div>
    );
}

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

  const paGoals = [
    { value: goals.paGoal1, label: 'Nível 1' },
    { value: goals.paGoal2, label: 'Nível 2' },
    { value: goals.paGoal3, label: 'Nível 3' },
    { value: goals.paGoal4, label: 'Nível 4' },
  ];

  const ticketGoals = [
      { value: goals.ticketMedioGoal1, label: 'Nível 1' },
      { value: goals.ticketMedioGoal2, label: 'Nível 2' },
      { value: goals.ticketMedioGoal3, label: 'Nível 3' },
      { value: goals.ticketMedioGoal4, label: 'Nível 4' },
  ];


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
                     <CardTitle className="text-xl">Painel de Desempenho</CardTitle>
                    <CardDescription>Acompanhe seu progresso em relação às metas e o que falta para o próximo nível.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                    <SalesProgressBar vendas={Number(vendas)} goals={goals} />
                    <Separator/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <CircularGauge 
                            label="Produtos por Atendimento (PA)"
                            currentValue={Number(pa)}
                            goals={paGoals}
                            unit="PA"
                            valueFormatter={(val) => formatNumber(val)}
                        />
                         <CircularGauge 
                            label="Ticket Médio"
                            currentValue={Number(ticketMedio)}
                            goals={ticketGoals}
                            unit="R$"
                            valueFormatter={(val) => formatCurrency(val)}
                        />
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
                        <TargetGoalItem label="Nível 1" value={`${formatNumber(goals.paGoal1)} PA`} />
                        <TargetGoalItem label="Nível 2" value={`${formatNumber(goals.paGoal2)} PA`} />
                        <TargetGoalItem label="Nível 3" value={`${formatNumber(goals.paGoal3)} PA`} />
                        <TargetGoalItem label="Nível 4" value={`${formatNumber(goals.paGoal4)} PA`} />
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
