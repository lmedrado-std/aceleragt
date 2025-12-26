
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

const TrophyIconFilled = (props: React.SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" stroke="#fbbf24" fill="none" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" stroke="#fbbf24" fill="none" />
        <path
        d="M9 12v4.5A2.5 2.5 0 0 0 11.5 19h1A2.5 2.5 0 0 0 15 16.5V12"
        stroke="#f59e0b"
        fill="none"
        />
        <path d="M12 19v-5" stroke="#f59e0b" fill="none" />
        <path
        d="M8 21h8"
        stroke="#f59e0b"
        fill="none"
        strokeWidth="2"
        />
        <path
        d="M15 9.5a2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 5 0z"
        fill="#fcd34d"
        stroke="#fbbf24"
        />
  </svg>
);


const SalesProgressBar = ({ vendas, goals }: { vendas: number, goals: Goals }) => {
    const metas = [
        { label: "Prêmio 1", value: goals.metaMinha || 0, prize: goals.metaMinhaPrize || 0 },
        { label: "Prêmio 2", value: goals.meta || 0, prize: goals.metaPrize || 0 },
        { label: "Prêmio Turbo", value: goals.metona || 0, prize: goals.metonaPrize || 0 },
    ];
    if (goals.performanceBonusEnabled) {
        metas.push({ label: "Bônus Performance", value: goals.metaLendaria || 0, prize: goals.legendariaBonusValorPremio || 0 });
    }
    const totalMeta = Math.max(...metas.map(m => m.value), 0) || 1;
    const progress = Math.min((vendas / totalMeta) * 100, 100);

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
                <CardDescription className="text-white/80">Acompanhe seu progresso para as metas de vendas.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-8">
                 <div className="text-center mb-2">
                    <p className="text-4xl font-extrabold tracking-tight">{formatCurrency(vendas)}</p>
                    <p className="text-xs uppercase tracking-wide opacity-80 -mt-1">Vendido até agora</p>
                </div>
                <div className="relative h-6 w-full rounded-full bg-white/30 overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                        style={{ width: `${progress}%` }}
                    />
                    
                    <div
                      className="absolute top-0 h-full w-[3px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                      style={{ left: `calc(${progress}% - 1.5px)` }}
                    />

                    {metas.map((meta, index) => {
                        const left = totalMeta > 0 ? (meta.value / totalMeta) * 100 : 0;
                        if (left <= 0 || left >= 100) return null;

                        const achieved = vendas >= meta.value;
                        const isNext =
                            nextGoal && nextGoal.label === meta.label && !achieved;

                        return (
                            <TooltipProvider key={index}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className="absolute inset-y-0 flex items-center justify-center"
                                    style={{ left: `${left}%`, transform: "translateX(-50%)", zIndex: 30 }}
                                  >
                                    {achieved ? (
                                      <TrophyIconFilled className="h-6 w-6 drop-shadow-[0_0_6px_rgba(253,224,71,0.9)]" />
                                    ) : (
                                      <div
                                        className={cn(
                                          "h-4 w-[3px] rounded-full",
                                          isNext ? "bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.9)]" : "bg-white/60"
                                        )}
                                      />
                                    )}
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
                 <div className="mt-4 text-center text-sm min-h-[40px] flex items-center justify-center">
                  {nextGoal ? (
                    <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full">
                      <Trophy className="h-4 w-4 text-yellow-300" />
                      <span>
                        Faltam <strong>{formatCurrency(nextGoal.value - vendas)}</strong> para liberar{" "}
                        <strong>{formatCurrency(nextGoal.prize)}</strong> ({nextGoal.label}).
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full">
                      <Trophy className="h-4 w-4 text-yellow-300" />
                      <p className="font-bold">Todos os prêmios liberados. Agora é só aumentar o bônus!</p>
                    </div>
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
  const progress = Math.min((currentValue / highestGoal) * 100, 100);

  let currentTier = -1;
  for (let i = goals.length - 1; i >= 0; i--) {
    if (goals[i].value > 0 && currentValue >= goals[i].value) {
      currentTier = i;
      break;
    }
  }
  const currentTierGoal = currentTier !== -1 ? goals[currentTier] : null;

  const nextGoalIndex = currentTier + 1;
  const nextGoal = goals[nextGoalIndex] && goals[nextGoalIndex].value > 0 ? goals[nextGoalIndex] : null;

  const nextGoalInfo = () => {
    if (nextGoal) {
      const diff = nextGoal.value - currentValue;
      return (
        <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full">
          <Trophy className="h-4 w-4 text-yellow-300" />
          <span>Faltam <strong>{valueFormatter(diff)}</strong> para liberar <strong>{formatCurrency(nextGoal.prize)}</strong></span>
        </div>
      );
    }
    if (currentTier !== -1) {
      return <div className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full"><p>Você está no <strong>{goals[currentTier].label}</strong>, mantendo seu bônus no máximo!</p></div>;
    }
    return <p>Aumente para liberar mais bônus.</p>;
  };

  return (
    <Card className={cn("p-6 flex flex-col justify-between text-white", cardClassName)}>
        <CardHeader className="p-0">
          <CardTitle className="text-white text-lg text-center">{label}</CardTitle>
          {description && <CardDescription className="text-center text-white/80 text-sm">{description}</CardDescription>}
        </CardHeader>
        <CardContent className="p-0 mt-6">
          <div className="text-center mb-2">
            <p className="text-4xl font-extrabold tracking-tight">{valueFormatter(currentValue)}</p>
            {currentTierGoal && (
              <p className="text-[11px] uppercase tracking-[0.18em] mt-1">
                {currentTierGoal.label} atual
              </p>
            )}
          </div>
          <div className="relative h-6 w-full rounded-full bg-white/30 overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
              style={{ width: `${progress}%` }}
            />
            
            <div
              className="absolute top-0 h-full w-[3px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
              style={{ left: `calc(${progress}% - 1.5px)` }}
            />

            {goals.map((goal, index) => {
              const left = highestGoal > 0 ? (goal.value / highestGoal) * 100 : 0;
              if (left <= 0 || left >= 100) return null;
              
               return (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <div
                        className="absolute top-0 h-full w-[1px] bg-white/30"
                        style={{ left: `${left}%` }}
                      />
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
      <div className="mt-4 text-center text-sm text-white/90 min-h-[40px] flex items-center justify-center">
        {nextGoalInfo()}
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
