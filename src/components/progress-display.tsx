
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
    const totalMeta = Math.max(...metas.map(m => m.value), 0) || 1;

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
            <CardContent className="p-0 mt-6">
                <div className="text-center mb-2">
                    <p className="text-3xl font-bold">{formatCurrency(vendas)}</p>
                    <p className="text-xs opacity-80 -mt-1">Vendido até agora</p>
                </div>
                <div className="relative h-4 w-full rounded-full bg-black/20">
                    {/* Segmented progress bar */}
                    <div className="absolute top-0 left-0 h-full bg-blue-400 rounded-full" style={{ width: `${Math.min((vendas / totalMeta) * 100, (metas[0].value / totalMeta) * 100)}%` }}></div>
                    {vendas > metas[0].value && (
                        <div className="absolute top-0 left-0 h-full bg-purple-400 rounded-full" style={{ width: `${Math.min((vendas / totalMeta) * 100, (metas[1].value / totalMeta) * 100)}%` }}></div>
                    )}
                    {vendas > metas[1].value && (
                        <div className="absolute top-0 left-0 h-full bg-green-400 rounded-full" style={{ width: `${Math.min((vendas / totalMeta) * 100, 100)}%` }}></div>
                    )}
                    
                    {/* Goal markers */}
                    {metas.map((meta, index) => {
                        const left = totalMeta > 0 ? (meta.value / totalMeta) * 100 : 0;
                        if (left <= 0 || left >= 100) return null;

                        const achieved = vendas >= meta.value;

                        return (
                             <TooltipProvider key={index}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${left}%`, transform: 'translateX(-50%)' }}>
                                            {achieved ? 
                                                <Trophy className="h-5 w-5 text-yellow-300 drop-shadow-lg" /> :
                                                <div className="h-4 w-1 bg-white/40" />
                                            }
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-sm font-semibold">{meta.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Atingir {formatCurrency(meta.value)} para garantir {formatCurrency(meta.prize)}.
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
                 <div className="mt-4 text-center text-sm min-h-[20px]">
                    {nextGoal ? (
                        <p className="text-white/90">
                           Faltam <span className="font-bold text-white">{formatCurrency(nextGoal.value - vendas)}</span> para liberar o <span className="font-semibold">{nextGoal.label}</span> ({formatCurrency(nextGoal.prize)}).
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
  valueSuffix = "",
}: {
  label: string;
  currentValue: number;
  goals: { value: number; prize: number; label: string }[];
  valueFormatter: (value: number) => string;
  cardClassName?: string;
  description?: string;
  valueSuffix?: string;
}) => {
  const highestGoal = Math.max(...goals.map(g => g.value), 0) || 1;

  let currentTier = -1;
  for (let i = goals.length - 1; i >= 0; i--) {
    if (goals[i].value > 0 && currentValue >= goals[i].value) {
      currentTier = i;
      break;
    }
  }

  const nextGoalIndex = currentTier + 1;
  const nextGoal = goals[nextGoalIndex] && goals[nextGoalIndex].value > 0 ? goals[nextGoalIndex] : null;

  const nextGoalInfo = () => {
    if (nextGoal) {
      const diff = nextGoal.value - currentValue;
      return `Faltam ${valueFormatter(diff)} para liberar ${formatCurrency(nextGoal.prize)} de bônus.`;
    }
    if (currentTier !== -1) {
      return `Você está no ${goals[currentTier].label}, mantendo seu bônus no máximo. Não deixe cair.`;
    }
    return `Aumente seu ${label.includes("PA") ? "PA" : "Ticket Médio"} para liberar mais bônus.`;
  };

  return (
    <Card className={cn("p-6 flex flex-col justify-between text-white", cardClassName)}>
        <CardHeader className="p-0">
          <CardTitle className="text-white text-lg text-center">{label}</CardTitle>
          {description && <CardDescription className="text-center text-white/80 text-sm">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="p-0 mt-6">
          <div className="text-center mb-2">
            <p className="text-3xl font-bold">{valueFormatter(currentValue)}</p>
            <p className="text-xs opacity-80 -mt-1">{valueSuffix}</p>
          </div>
          <div className="relative h-4 w-full rounded-full bg-black/20">
            {/* Base progress */}
            <div className="absolute top-0 left-0 h-full rounded-full bg-white/80" style={{ width: `${Math.min((currentValue / highestGoal) * 100, 100)}%`, transition: 'width 0.8s ease-in-out' }}></div>

            {/* Goal markers */}
            {goals.map((goal, index) => {
              const left = highestGoal > 0 ? (goal.value / highestGoal) * 100 : 0;
              if (left <= 0 || left > 100) return null;
              const achieved = currentValue >= goal.value;
              return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${left}%`, transform: 'translateX(-50%)' }}>
                          {achieved ? 
                              <Trophy className="h-5 w-5 text-yellow-300 drop-shadow-lg" /> :
                              <div className="h-4 w-1 bg-white/40" />
                          }
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
      <div className="mt-4 text-center text-sm text-white/90 min-h-[40px]">
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
    { value: goals.paGoal1 || 0, prize: goals.paPrize1 || 0, label: 'Nível 1' },
    { value: goals.paGoal2 || 0, prize: goals.paPrize2 || 0, label: 'Nível 2' },
    { value: goals.paGoal3 || 0, prize: goals.paPrize3 || 0, label: 'Nível 3' },
    { value: goals.paGoal4 || 0, prize: goals.paPrize4 || 0, label: 'Nível 4' },
  ];

  const ticketGoals = [
      { value: goals.ticketMedioGoal1 || 0, prize: goals.ticketMedioPrize1 || 0, label: 'Nível 1' },
      { value: goals.ticketMedioGoal2 || 0, prize: goals.ticketMedioPrize2 || 0, label: 'Nível 2' },
      { value: goals.ticketMedioGoal3 || 0, prize: goals.ticketMedioPrize3 || 0, label: 'Nível 3' },
      { value: goals.ticketMedioGoal4 || 0, prize: goals.ticketMedioPrize4 || 0, label: 'Nível 4' },
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
                valueSuffix="PA atual"
            />
            <MetricProgressBar
                label="Ticket Médio"
                description="Quanto seu cliente gasta em média por compra."
                currentValue={Number(ticketMedio)}
                goals={ticketGoals}
                valueFormatter={(val) => formatCurrency(val)}
                cardClassName="bg-gradient-to-br from-orange-500 to-orange-700"
                valueSuffix="Ticket médio atual"
            />
        </div>
    </div>
  );
}
