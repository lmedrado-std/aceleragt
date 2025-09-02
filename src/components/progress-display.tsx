
"use client";

import type { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  Package,
  Ticket,
  CheckCircle,
  Award,
  Gift,
  Zap,
  Trophy,
  Target,
  Rocket,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "./ui/skeleton";
import { Goals } from "@/lib/storage";


type RankingMetric = 'vendas' | 'pa' | 'ticketMedio' | 'corridinhaDiaria';

type ProgressDisplaySalesData = {
    vendas: number;
    pa: number;
    ticketMedio: number;
    corridinhaDiaria: number;
} & Goals;

interface ProgressDisplayProps {
  salesData: ProgressDisplaySalesData;
  incentives: IncentiveProjectionOutput | null;
  rankings: Record<RankingMetric, number> | null;
  loading: boolean;
  themeColor?: string | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const ProgressItem = ({
  icon,
  title,
  currentValue,
  goalValue,
  prizeValue,
  formatValue = (v) => v.toString(),
  themeColor
}: {
  icon: React.ReactNode;
  title: string;
  currentValue: number;
  goalValue: number;
  prizeValue: number;
  formatValue?: (value: number) => string;
  themeColor?: string | null;
}) => {
  const percentage = goalValue > 0 ? Math.min(((currentValue || 0) / goalValue) * 100, 100) : 0;
  const achieved = currentValue >= goalValue;
  
  const progressStyle = themeColor ? {
      background: `linear-gradient(to right, ${themeColor} , ${themeColor}dd)`
  } : {};


  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{title}</span>
        </div>
         <div className={cn("font-semibold text-lg", achieved ? "text-green-600" : "text-foreground")}>
            {formatCurrency(prizeValue)}
        </div>
      </div>
       <Progress value={percentage} indicatorStyle={progressStyle} />
       <div className="text-right text-sm text-muted-foreground font-medium">
          {formatValue(currentValue)} / {formatValue(goalValue)}
        </div>
    </div>
  );
};


const IncentiveItem = ({
  icon,
  label,
  value,
  achieved,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  achieved: boolean;
}) => (
  <div
    className={cn(
      "flex items-center justify-between p-3 rounded-lg transition-all",
      achieved ? "bg-green-100 dark:bg-green-900/30" : "bg-muted/50"
    )}
  >
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "p-1.5 rounded-full bg-opacity-10",
          achieved
            ? "bg-green-500 text-green-600"
            : "bg-primary text-primary"
        )}
      >
        {icon}
      </div>
      <span
        className={cn(
          "font-medium",
          achieved ? "text-green-800 dark:text-green-300" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
    <div className="flex items-center gap-2">
      {achieved && <CheckCircle className="w-5 h-5 text-green-500" />}
      <span
        className={cn(
          "font-semibold text-lg",
          achieved ? "text-green-600 dark:text-green-400" : "text-foreground"
        )}
      >
        {formatCurrency(value)}
      </span>
    </div>
  </div>
);

const RankingItem = ({ title, rank }: { title: string; rank?: number }) => {
  const getRankColor = (r?: number) => {
    if (r === 1) return "text-amber-500";
    if (r === 2) return "text-slate-500";
    if (r === 3) return "text-amber-700";
    return "text-muted-foreground";
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
        <span className="font-medium text-muted-foreground">{title}</span>
        <div className="flex items-center gap-2">
            <Trophy className={cn("w-5 h-5", getRankColor(rank))} />
            <span className={cn("font-bold text-xl", getRankColor(rank))}>
                {rank ? `${rank}º` : "-"}
            </span>
        </div>
    </div>
  )
};

const SalesGoalDetail = ({ label, goal, current, prize, achieved, isActive, isPulsing }: {label: string; goal: number; current: number; prize: number; achieved: boolean; isActive: boolean; isPulsing: boolean;}) => {
    return (
        <div className={cn(
            "flex justify-between items-center p-2 rounded-md transition-all",
            achieved && isActive ? "bg-green-100/80 dark:bg-green-900/30 ring-2 ring-green-500" :
            achieved ? "bg-green-100/50 dark:bg-green-900/20" : 
            "bg-muted/30",
            isPulsing && "animate-pulse ring-green-500"
        )}>
            <div className="flex items-center gap-2">
                {achieved ? <CheckCircle className="w-5 h-5 text-green-500"/> : <Target className="w-5 h-5 text-muted-foreground"/>}
                <div>
                    <p className={cn(
                      "font-semibold", 
                      achieved && "text-green-700 dark:text-green-300",
                      !achieved && "text-muted-foreground"
                    )}>{label}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(current)} / {formatCurrency(goal)}</p>
                </div>
            </div>
            <p className={cn(
                "font-bold text-lg", 
                achieved && isActive ? "text-green-600 dark:text-green-400" :
                achieved ? "text-green-500/70 dark:text-green-400/70" : 
                "text-muted-foreground"
              )}>{formatCurrency(prize)}</p>
        </div>
    )
}

const NextGoalCard = ({ nextGoalName, amountLeft }: { nextGoalName: string | null; amountLeft: number | null }) => {
    if (!nextGoalName || amountLeft === null || amountLeft <= 0) return null;

    return (
        <Card className="bg-gradient-to-r from-blue-100 to-indigo-50 border-blue-200 shadow-md hover:shadow-lg transition-all rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold text-blue-800">
                    Próxima Meta
                </CardTitle>
                <Rocket className="h-6 w-6 text-blue-600" />
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold text-blue-700">
                    {nextGoalName}
                </p>
                <p className="text-sm text-muted-foreground">
                    Faltam apenas {formatCurrency(amountLeft)}!
                </p>
            </CardContent>
        </Card>
    );
};

export function ProgressDisplay({ salesData, incentives, rankings, loading, themeColor }: ProgressDisplayProps) {
  const {
    vendas,
    pa,
    ticketMedio,
    corridinhaDiaria,
    metaMinha,
    meta,
    metona,
    metaLendaria,
    paGoal4,
    paPrize4,
    ticketMedioGoal4,
    ticketMedioPrize4
  } = salesData;

  const salesPercentage = metaLendaria > 0 ? (vendas / metaLendaria) * 100 : 0;
  
  const totalIncentives = incentives
    ? (incentives.metinhaPremio || 0) +
      (incentives.metaPremio || 0) +
      (incentives.metonaPremio || 0) +
      (incentives.legendariaBonus || 0) +
      (incentives.paBonus || 0) +
      (incentives.ticketMedioBonus || 0) +
      (incentives.corridinhaDiariaBonus || 0)
    : 0;

  const renderSkeletons = () => (
     <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-12 w-1/4" />
      </div>
       <Separator/>
      <div className="space-y-2 pt-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
  
  const metinhaAchieved = vendas >= metaMinha;
  const metaAchieved = vendas >= meta;
  const metonaAchieved = vendas >= metona;
  const lendariaAchieved = vendas >= metaLendaria;
  
  let nextGoalName: string | null = null;
  let amountLeft: number | null = null;

  if (!lendariaAchieved) {
    if (!metonaAchieved) {
        if (!metaAchieved) {
            if (!metinhaAchieved) {
                nextGoalName = "Metinha";
                amountLeft = metaMinha - vendas;
            } else {
                nextGoalName = "Meta";
                amountLeft = meta - vendas;
            }
        } else {
            nextGoalName = "Metona";
            amountLeft = metona - vendas;
        }
    } else {
        nextGoalName = "Lendária";
        amountLeft = metaLendaria - vendas;
    }
  }


  const headerStyle = themeColor ? { color: themeColor } : {};
  
  return (
    <Card className="shadow-lg border-2 border-transparent transition-all overflow-hidden">
      <CardContent className="space-y-8 pt-6" data-achieved={totalIncentives > 0}>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="bg-gradient-to-r from-emerald-100 to-green-50 border-emerald-200 shadow-md hover:shadow-lg transition-all rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold text-emerald-800">
                    Seu Ganho Total
                    </CardTitle>
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold text-emerald-700">
                    {formatCurrency(totalIncentives)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                    Valor acumulado das metas
                    </p>
                </CardContent>
            </Card>
            <NextGoalCard nextGoalName={nextGoalName} amountLeft={amountLeft} />
        </div>


        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-6 h-6 text-primary" style={headerStyle} />
            <h3 className="text-xl font-semibold">Progresso de Vendas</h3>
          </div>
          <div className="relative pt-6">
            <Progress value={salesPercentage} className="h-4" style={{background: 'hsl(var(--secondary))'}} indicatorStyle={{ background: `linear-gradient(to right, ${themeColor || 'hsl(var(--primary))'} , #34d399)`}}/>
            {metaLendaria > 0 && (
              <>
                <div
                  className="absolute top-0 h-full border-r-2 border-dashed border-foreground/20"
                  style={{ left: `${(metaMinha / metaLendaria) * 100}%` }}
                  title={`Metinha: ${formatCurrency(metaMinha)}`}
                >
                  <span className="absolute -top-6 -translate-x-1/2 text-xs font-bold text-muted-foreground">Metinha</span>
                </div>
                <div
                  className="absolute top-0 h-full border-r-2 border-dashed border-foreground/20"
                  style={{ left: `${(meta / metaLendaria) * 100}%` }}
                  title={`Meta: ${formatCurrency(meta)}`}
                >
                  <span className="absolute -top-6 -translate-x-1/2 text-xs font-bold text-muted-foreground">Meta</span>
                </div>
                <div
                  className="absolute top-0 h-full border-r-2 border-dashed border-foreground/20"
                  style={{ left: `${(metona / metaLendaria) * 100}%` }}
                  title={`Metona: ${formatCurrency(metona)}`}
                >
                  <span className="absolute -top-6 -translate-x-1/2 text-xs font-bold text-muted-foreground">Metona</span>
                </div>
                <div
                  className="absolute top-0 h-full"
                  style={{ left: `100%` }}
                  title={`Lendária: ${formatCurrency(metaLendaria)}`}
                >
                  <span className="absolute -top-6 -translate-x-1/2 text-xs font-bold text-muted-foreground">Lendária</span>
                </div>
              </>
            )}
          </div>
          <div className="text-right mt-2 font-bold text-lg text-primary" style={headerStyle}>
            {formatCurrency(vendas)} / {formatCurrency(metaLendaria)}
          </div>
        </div>
        
       {loading ? (
            <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
        ) : incentives && totalIncentives > 0 ? (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Award /> Ganhos Confirmados</CardTitle>
                    <CardDescription>Parabéns! Aqui está o resumo dos seus prêmios e bônus.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    { (incentives.metinhaPremio > 0 || incentives.metaPremio > 0 || incentives.metonaPremio > 0 || incentives.legendariaBonus > 0) &&
                        <IncentiveItem
                        icon={<DollarSign className="w-5 h-5" />}
                        label="Prêmio de Vendas"
                        value={(incentives.metinhaPremio || 0) + (incentives.metaPremio || 0) + (incentives.metonaPremio || 0) + (incentives.legendariaBonus || 0)}
                        achieved={true}
                        />
                    }
                    { incentives.paBonus > 0 && 
                        <IncentiveItem
                            icon={<Package className="w-5 h-5" />}
                            label="Bônus PA"
                            value={incentives.paBonus}
                            achieved={true}
                        />
                    }
                    { incentives.ticketMedioBonus > 0 &&
                        <IncentiveItem
                            icon={<Ticket className="w-5 h-5" />}
                            label="Bônus Ticket Médio"
                            value={incentives.ticketMedioBonus}
                            achieved={true}
                        />
                    }
                    { incentives.corridinhaDiariaBonus > 0 &&
                        <IncentiveItem
                            icon={<Zap className="w-5 h-5" />}
                            label="Bônus Corridinha"
                            value={incentives.corridinhaDiariaBonus}
                            achieved={true}
                        />
                    }
                </CardContent>
            </Card>
        ) : null}


        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><Package/> Desempenho Adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProgressItem
                icon={<Package className="w-5 h-5" />}
                title="Produtos por Atendimento (PA)"
                currentValue={pa}
                goalValue={paGoal4}
                prizeValue={incentives?.paBonus || paPrize4}
                formatValue={(v) => (typeof v === 'number' ? v.toFixed(2) : Number(v || 0).toFixed(2))}
                themeColor={themeColor}
              />
              <ProgressItem
                icon={<Ticket className="w-5 h-5" />}
                title="Ticket Médio"
                currentValue={ticketMedio}
                goalValue={ticketMedioGoal4}
                prizeValue={incentives?.ticketMedioBonus || ticketMedioPrize4}
                formatValue={formatCurrency}
                themeColor={themeColor}
              />
               <ProgressItem
                icon={<TrendingUp className="w-5 h-5" />}
                title="Corridinha Diária"
                currentValue={corridinhaDiaria}
                goalValue={corridinhaDiaria > 0 ? corridinhaDiaria : 1}
                prizeValue={incentives?.corridinhaDiariaBonus || 0}
                formatValue={formatCurrency}
                themeColor={themeColor}
              />
            </CardContent>
          </Card>

          {rankings && (
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2"><Trophy/> Ranking Geral</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <RankingItem title="Vendas" rank={rankings.vendas} />
                    <RankingItem title="PA" rank={rankings.pa} />
                    <RankingItem title="Ticket Médio" rank={rankings.ticketMedio} />
                    <RankingItem title="Corridinha" rank={rankings.corridinhaDiaria} />
                </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
