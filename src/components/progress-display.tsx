
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

const SalesProgressBar = ({ vendas, goals }: { vendas: number, goals: Goals }) => {
    const metas = [
        { label: "Prêmio 1", value: goals.metaMinha || 0, prize: goals.metaMinhaPrize || 0, color: "bg-blue-400" },
        { label: "Prêmio 2", value: goals.meta || 0, prize: goals.metaPrize || 0, color: "bg-purple-400" },
        { label: "Prêmio Turbo", value: goals.metona || 0, prize: goals.metonaPrize || 0, color: "bg-green-400" },
    ];
    const totalMeta = goals.metona || 1; // Avoid division by zero

    const findNextGoal = () => {
        if (vendas < (goals.metaMinha || 0)) return { label: "Prêmio 1", value: goals.metaMinha || 0, prize: goals.metaMinhaPrize || 0 };
        if (vendas < (goals.meta || 0)) return { label: "Prêmio 2", value: goals.meta || 0, prize: goals.metaPrize || 0 };
        if (vendas < (goals.metona || 0)) return { label: "Prêmio Turbo", value: goals.metona || 0, prize: goals.metonaPrize || 0 };
        if (goals.performanceBonusEnabled && vendas < (goals.metaLendaria || 0)) return { label: "Bônus Performance", value: goals.metaLendaria || 0, prize: goals.legendariaBonusValorPremio || 0 };
        return null;
    };
    const nextGoal = findNextGoal();
    
    return (
        <Card className="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6">
            <CardHeader className="p-0">
                <CardTitle className="text-white">Quanto falta para o próximo prêmio</CardTitle>
                <CardDescription className="text-white/80">Olhe sempre aqui primeiro para saber o que falta para ganhar o próximo prêmio.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-8">
                 <div className="text-center mb-2">
                    <span className="text-2xl font-bold">{formatCurrency(vendas)}</span>
                    <p className="text-xs opacity-80">Vendido até agora</p>
                </div>
                <div className="relative h-4 w-full rounded-full bg-black/20 pt-8 mb-8">
                    {/* Segmented progress bar */}
                    <div className="absolute top-8 left-0 h-4 bg-blue-400" style={{ width: `${Math.min((vendas / totalMeta) * 100, (goals.metaMinha / totalMeta) * 100)}%` }}></div>
                    {vendas > (goals.metaMinha || 0) && (
                        <div className="absolute top-8 left-0 h-4 bg-purple-400" style={{ width: `${Math.min((vendas / totalMeta) * 100, (goals.meta / totalMeta) * 100)}%` }}></div>
                    )}
                    {vendas > (goals.meta || 0) && (
                        <div className="absolute top-8 left-0 h-4 bg-green-400" style={{ width: `${Math.min((vendas / totalMeta) * 100, (goals.metona / totalMeta) * 100)}%` }}></div>
                    )}
                    
                    
                    {/* Goal markers */}
                    {metas.map((meta, index) => {
                        const left = totalMeta > 0 ? (meta.value / totalMeta) * 100 : 0;
                        if (left === 0 || left > 100) return null;

                        const achieved = vendas >= meta.value;

                        return (
                             <TooltipProvider key={index}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="absolute top-1/2 h-8 w-1 -translate-y-1/2" style={{ left: `${left}%`, transform: 'translateX(-50%)' }}>
                                            <div className={cn("h-full w-full", achieved ? meta.color : "bg-white/40")} />
                                            <span className="absolute -top-5 text-xs text-white/80 whitespace-nowrap">{meta.label}</span>
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
                           Faltam <span className="font-bold text-white">{formatCurrency(nextGoal.value - vendas)}</span> para liberar o {nextGoal.label} ({formatCurrency(nextGoal.prize)}).
                        </p>
                    ) : (
                        <p className="font-bold text-white flex items-center justify-center gap-2"><Trophy/> Todos os prêmios liberados. Agora cada venda aumenta seu bônus!</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const MetricProgressBar = ({
  label,
  currentValue,
  goals,
  valueFormatter,
  cardClassName,
  description,
}: {
  label: string;
  currentValue: number;
  goals: { value: number; prize: number; label: string; color: string }[];
  valueFormatter: (value: number) => string;
  cardClassName?: string;
  description?: string;
}) => {
  const highestGoal = Math.max(...goals.map(g => g.value), 0) || 1;

  let currentTier = -1;
  for (let i = goals.length - 1; i >= 0; i--) {
    if (currentValue >= goals[i].value && goals[i].value > 0) {
      currentTier = i;
      break;
    }
  }

  const nextGoalIndex = currentTier + 1;
  const nextGoal = goals[nextGoalIndex] && goals[nextGoalIndex].value > 0 ? goals[nextGoalIndex] : null;

  const nextGoalInfo = () => {
    if (nextGoal) {
      const diff = nextGoal.value - currentValue;
      return `Faltam ${label.includes("PA") ? diff.toFixed(2) : formatCurrency(diff)} para liberar ${formatCurrency(nextGoal.prize)} de bônus.`;
    }
    if (currentTier !== -1) {
      return `Você está no ${goals[currentTier].label}, mantendo seu bônus no máximo. Não deixe cair.`;
    }
    return `Aumente seu ${label.includes("PA") ? "PA" : "Ticket Médio"} para liberar mais bônus.`;
  };

  return (
    <Card className={cn("p-4 flex flex-col justify-between text-white", cardClassName)}>
      <div>
        <CardHeader className="p-0">
          <CardTitle className="text-white text-base text-center">{label}</CardTitle>
          <CardDescription className="text-center text-white/80 text-xs">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-6">
          <div className="text-center mb-2">
            <span className="text-xl font-bold">{valueFormatter(currentValue)}</span>
            <p className="text-xs opacity-80">{label.includes("PA") ? "PA atual" : "Ticket médio atual"}</p>
          </div>
          <div className="relative h-3 w-full rounded-full bg-black/20 pt-8 mb-8">
            {/* Base progress */}
            <div className="absolute top-8 left-0 h-3 rounded-full bg-white/80" style={{ width: `${Math.min((currentValue / highestGoal) * 100, 100)}%` }}></div>

            {/* Goal markers */}
            {goals.map((goal, index) => {
              const left = highestGoal > 0 ? (goal.value / highestGoal) * 100 : 0;
              if (left === 0 || left > 100) return null;
              const achieved = currentValue >= goal.value;
              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute top-1/2 h-6 w-1 -translate-y-1/2" style={{ left: `${left}%`, transform: 'translateX(-50%)' }}>
                        <div className={cn("h-full w-full", achieved ? goal.color : "bg-white/40")} />
                        <span className="absolute -top-4 text-xs text-white/80 whitespace-nowrap">{goal.label}</span>
                        {achieved && <Trophy className="h-4 w-4 text-yellow-300 absolute -bottom-5 left-1/2 -translate-x-1/2" />}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm font-semibold">{goal.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Atingir {valueFormatter(goal.value)} para garantir {formatCurrency(goal.prize)}.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </CardContent>
      </div>
      <div className="mt-6 text-center text-xs text-white/90 min-h-[24px]">
        <p>{nextGoalInfo()}</p>
      </div>
    </Card>
  );
};



export function ProgressDisplay({ salesData, incentives, rankings }: ProgressDisplayProps) {
  const {
    vendas = 0,
    pa = 0,
    ticket_medio: ticketMedio = 0,
    goals,
  } = salesData;
  
  if (!goals) {
    return <div className="p-4">Carregando metas...</div>;
  }
  
  const paGoals = [
    { value: goals.paGoal1 || 0, prize: goals.paPrize1 || 0, label: 'Nível 1', color: 'bg-teal-400' },
    { value: goals.paGoal2 || 0, prize: goals.paPrize2 || 0, label: 'Nível 2', color: 'bg-cyan-400' },
    { value: goals.paGoal3 || 0, prize: goals.paPrize3 || 0, label: 'Nível 3', color: 'bg-sky-400' },
    { value: goals.paGoal4 || 0, prize: goals.paPrize4 || 0, label: 'Nível 4', color: 'bg-indigo-400' },
  ];

  const ticketGoals = [
      { value: goals.ticketMedioGoal1 || 0, prize: goals.ticketMedioPrize1 || 0, label: 'Nível 1', color: 'bg-amber-400' },
      { value: goals.ticketMedioGoal2 || 0, prize: goals.ticketMedioPrize2 || 0, label: 'Nível 2', color: 'bg-orange-400' },
      { value: goals.ticketMedioGoal3 || 0, prize: goals.ticketMedioPrize3 || 0, label: 'Nível 3', color: 'bg-red-400' },
      { value: goals.ticketMedioGoal4 || 0, prize: goals.ticketMedioPrize4 || 0, label: 'Nível 4', color: 'bg-rose-400' },
  ];


  return (
    <div className="space-y-4">
        <SalesProgressBar vendas={Number(vendas)} goals={goals} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MetricProgressBar
                label="Produtos por Atendimento (PA)"
                description="Quantas peças você vende em média por atendimento."
                currentValue={Number(pa)}
                goals={paGoals}
                valueFormatter={(val) => formatNumber(val)}
                cardClassName="bg-gradient-to-br from-purple-500 to-purple-700"
            />
            <MetricProgressBar
                label="Ticket Médio"
                description="Quanto seu cliente gasta em média por compra."
                currentValue={Number(ticketMedio)}
                goals={ticketGoals}
                valueFormatter={(val) => formatCurrency(val)}
                cardClassName="bg-gradient-to-br from-orange-500 to-orange-700"
            />
        </div>
    </div>
  );
}
