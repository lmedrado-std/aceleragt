
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
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Goals, Seller } from "@/lib/storage";
import { RankingMetric } from "./goal-getter-dashboard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";


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

const SalesProgressBar = ({ vendas, goals }: { vendas: number, goals: Goals }) => {
    const metas = [
        { label: "Meta mínima", value: goals.metaMinha || 0, prize: goals.metaMinhaPrize || 0 },
        { label: "Meta cheia", value: goals.meta || 0, prize: goals.metaPrize || 0 },
        { label: "Meta turbo", value: goals.metona || 0, prize: goals.metonaPrize || 0 },
    ];
    const totalMeta = goals.metona || 0;
    const progressPercentage = totalMeta > 0 ? Math.min((vendas / totalMeta) * 100, 100) : 0;

    const findNextGoal = () => {
        if (vendas < (goals.metaMinha || 0)) return { label: "Meta mínima", value: goals.metaMinha || 0, prize: goals.metaMinhaPrize || 0 };
        if (vendas < (goals.meta || 0)) return { label: "Meta cheia", value: goals.meta || 0, prize: goals.metaPrize || 0 };
        if (vendas < (goals.metona || 0)) return { label: "Meta turbo", value: goals.metona || 0, prize: goals.metonaPrize || 0 };
        if (goals.performanceBonusEnabled && vendas < (goals.metaLendaria || 0)) return { label: "Bônus Performance", value: goals.metaLendaria || 0, prize: goals.legendariaBonusValorPremio || 0 };
        return null;
    };
    const nextGoal = findNextGoal();
    
    const getCongratsMessage = () => {
        if (goals.performanceBonusEnabled && vendas >= (goals.metaLendaria || 0)) {
            return "Você está na zona de Bônus Performance! Parabéns!";
        }
        if (vendas >= (goals.metona || 0)) {
            return "Todas as metas principais foram atingidas! Parabéns!";
        }
        return null;
    }
    const congratsMessage = getCongratsMessage();

    return (
        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6">
            <CardHeader className="p-0">
                <CardTitle className="text-white">Progresso de Vendas</CardTitle>
                <CardDescription className="text-white/80">Olhe sempre aqui primeiro para saber o que falta para ganhar o próximo prêmio.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-8">
                <div className="relative h-4 w-full rounded-full bg-black/20">
                    <div className="absolute top-0 left-0 h-full rounded-full bg-white" style={{ width: `${progressPercentage}%` }}></div>

                    {metas.map((meta, index) => {
                        const left = totalMeta > 0 ? (meta.value / totalMeta) * 100 : 0;
                        if (left === 0 || left > 100) return null;

                        const achieved = vendas >= meta.value;

                        return (
                             <TooltipProvider key={index}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="absolute top-1/2 h-8 w-1 -translate-y-1/2" style={{ left: `${left}%`, transform: 'translateX(-50%)' }}>
                                            <div className={cn("h-full w-full", achieved ? "bg-green-300" : "bg-white/40")} />
                                             {achieved && <Trophy className="h-5 w-5 text-yellow-300 absolute -bottom-6 left-1/2 -translate-x-1/2" />}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-sm font-semibold">{meta.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Quando vender {formatCurrency(meta.value)}, você garante {formatCurrency(meta.prize)}.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
                 <div className="mt-8 text-center text-sm">
                    {nextGoal ? (
                        <p className="text-white/90">
                           Faltam <span className="font-bold text-white">{formatCurrency(nextGoal.value - vendas)}</span> para liberar <span className="font-bold text-white">{formatCurrency(nextGoal.prize)}</span> ({nextGoal.label}).
                        </p>
                    ) : (
                        <p className="font-bold text-white flex items-center justify-center gap-2"><Trophy/> Todas as metas batidas! Agora é só aumentar o bônus.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const CircularGauge = ({ label, currentValue, goals, valueFormatter, cardClassName }: { label: string; currentValue: number; goals: {value: number, label: string}[]; valueFormatter: (value: number) => string; cardClassName?: string }) => {
    
    let currentTier = -1;
    for (let i = goals.length - 1; i >= 0; i--) {
        if (currentValue >= goals[i].value && goals[i].value > 0) {
            currentTier = i;
            break;
        }
    }

    const nextGoalIndex = currentTier + 1;
    const nextGoal = goals[nextGoalIndex] && goals[nextGoalIndex].value > 0 ? goals[nextGoalIndex] : null;
    
    const startValueForProgress = currentTier !== -1 ? goals[currentTier].value : 0;
    const endValueForProgress = nextGoal ? nextGoal.value : (currentTier !== -1 ? goals[currentTier].value : (goals[0]?.value || 0));

    let progressPercentage = 0;
    if (endValueForProgress > startValueForProgress) {
        progressPercentage = Math.min(((currentValue - startValueForProgress) / (endValueForProgress - startValueForProgress)) * 100, 100);
    } else if (currentValue >= startValueForProgress && startValueForProgress > 0) {
        progressPercentage = 100;
    }

    const strokeWidth = 12;
    const radius = 60;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

    const nextGoalInfo = () => {
        if (nextGoal) {
            const diff = nextGoal.value - currentValue;
            return `Se chegar em ${nextGoal.label}, você aumenta seu bônus de ${label.includes("PA") ? "PA" : "Ticket Médio"}.`;
        }
        if (currentTier !== -1) {
             return `${goals[currentTier].label} atingido! Continue assim para manter o resultado!`;
        }
        return `Aumente seu ${label.includes("PA") ? "PA" : "Ticket Médio"} para liberar mais bônus.`;
    };

    return (
        <Card className={cn("p-6 flex flex-col items-center justify-between h-full", cardClassName)}>
            <CardTitle className="text-white text-base text-center">{label}</CardTitle>
            <CardDescription className="text-center text-white/80 text-xs">Esses dois círculos mostram se você está vendendo bem (ticket) e certo (PA).</CardDescription>
            <div className="relative my-4" style={{width: radius*2, height: radius*2}}>
                <svg height={radius * 2} width={radius * 2} className="-rotate-90">
                    <circle
                        className="text-black/20"
                        stroke="currentColor"
                        fill="transparent"
                        strokeWidth={strokeWidth}
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    <circle
                        className="text-white"
                        stroke="currentColor"
                        fill="transparent"
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
                     <span className="text-3xl font-bold">
                        {label.includes("Ticket") ? formatCurrency(currentValue) : formatNumber(currentValue)}
                    </span>
                    <p className="text-[11px] uppercase tracking-[0.18em] mt-1">
                      {label.includes("Ticket") ? "Ticket médio atual" : "PA atual"}
                    </p>
                </div>
            </div>
             <div className="mt-2 text-center text-xs text-white/90 min-h-[36px]">
                <p>{nextGoalInfo()}</p>
            </div>
        </Card>
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
    
  const totalPotentialPrizes = 
    (goals.metaMinhaPrize || 0) +
    (goals.metaPrize || 0) +
    (goals.metonaPrize || 0) +
    (goals.legendariaBonusValorPremio || 0) + 
    (goals.paPrize1 || 0) + (goals.paPrize2 || 0) + (goals.paPrize3 || 0) + (goals.paPrize4 || 0) +
    (goals.ticketMedioPrize1 || 0) + (goals.ticketMedioPrize2 || 0) + (goals.ticketMedioPrize3 || 0) + (goals.ticketMedioPrize4 || 0) +
    (incentives?.corridinhaDiariaBonus || 0);


  const salesRank = vendas > 0 ? rankings?.vendas : undefined;
  
  let rankMedal = "";
  if (salesRank && salesRank > 0) {
      if (salesRank === 1) rankMedal = "🥇";
      else if (salesRank === 2) rankMedal = "🥈";
      else if (salesRank === 3) rankMedal = "🥉";
  }

  const paGoals = [
    { value: goals.paGoal1 || 0, label: 'Nível 1' },
    { value: goals.paGoal2 || 0, label: 'Nível 2' },
    { value: goals.paGoal3 || 0, label: 'Nível 3' },
    { value: goals.paGoal4 || 0, label: 'Nível 4' },
  ];

  const ticketGoals = [
      { value: goals.ticketMedioGoal1 || 0, label: 'Nível 1' },
      { value: goals.ticketMedioGoal2 || 0, label: 'Nível 2' },
      { value: goals.ticketMedioGoal3 || 0, label: 'Nível 3' },
      { value: goals.ticketMedioGoal4 || 0, label: 'Nível 4' },
  ];


  return (
    <div className="space-y-6">
        <Card className="col-span-full bg-slate-900 text-white">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-white/70">Missão de hoje</p>
              <p className="text-lg font-bold">
                Vender {formatCurrency(goals.metaHoje || 0)} ou {formatNumber(goals.paMetaHoje || 0)} PA
              </p>
              <p className="text-xs text-white/60">
                Se bater, você garante pelo menos {formatCurrency(incentives?.meta1Premio || goals.metaMinhaPrize || 0)}.
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold text-white/70">Ganhos projetados no mês</p>
              <p className="text-2xl font-bold">{formatCurrency(totalIncentives)}</p>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                 <SalesProgressBar vendas={Number(vendas)} goals={goals} />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CircularGauge 
                        label="Produtos por Atendimento (PA)"
                        currentValue={Number(pa)}
                        goals={paGoals}
                        valueFormatter={(val) => formatNumber(val)}
                        cardClassName="bg-gradient-to-br from-purple-500 to-purple-700"
                    />
                    <CircularGauge 
                        label="Ticket Médio"
                        currentValue={Number(ticketMedio)}
                        goals={ticketGoals}
                        valueFormatter={(val) => formatCurrency(val)}
                        cardClassName="bg-gradient-to-br from-orange-500 to-orange-700"
                    />
                </div>
            </div>

            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Resumo de Ganhos</CardTitle>
                        <CardDescription>Seus prêmios e bônus por performance detalhados.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Por vendas</p>
                            <GoalDetail label="Prêmio Meta Mínima" prize={incentives?.meta1Premio || 0} achieved={(incentives?.meta1Premio || 0) > 0} />
                            <GoalDetail label="Prêmio Meta Cheia" prize={incentives?.meta2Premio || 0} achieved={(incentives?.meta2Premio || 0) > 0} />
                            <GoalDetail label="Prêmio Meta Turbo" prize={incentives?.meta3Premio || 0} achieved={(incentives?.meta3Premio || 0) > 0} />
                            {goals.performanceBonusEnabled && <GoalDetail label="Bônus Performance" prize={incentives?.legendariaBonus || 0} achieved={(incentives?.legendariaBonus || 0) > 0} />}
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Por PA e Ticket</p>
                            <GoalDetail label="Bônus PA" prize={incentives?.paBonus || 0} achieved={(incentives?.paBonus || 0) > 0} />
                            <GoalDetail label="Bônus Ticket Médio" prize={incentives?.ticketMedioBonus || 0} achieved={(incentives?.ticketMedioBonus || 0) > 0} />
                        </div>
                         <Separator />
                         <div>
                             <p className="text-xs font-semibold text-muted-foreground uppercase">Outros Bônus</p>
                            <GoalDetail label="Bônus Corridinha" prize={incentives?.corridinhaDiariaBonus || 0} achieved={(incentives?.corridinhaDiariaBonus || 0) > 0} />
                        </div>
                        <Separator />
                         <div className="flex justify-between items-center pt-2">
                            <span className="text-sm font-semibold text-muted-foreground">
                              Se bater todas as metas:
                            </span>
                            <span className="font-bold text-lg text-primary">
                              {formatCurrency(totalPotentialPrizes)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
