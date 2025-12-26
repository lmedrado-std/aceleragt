
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

const CleanProgressBar = ({
  current,
  goals,
  formatter,
}: {
  current: number;
  goals: { value: number; label: string; prize?: number }[];
  formatter: (v: number) => string;
}) => {
  const max = Math.max(...goals.map(g => g.value), 1);
  const progress = Math.min((current / max) * 100, 100);

  return (
    <div className="relative w-full mt-4">
      <div className="h-3 w-full bg-white/40 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative mt-4 flex justify-between w-full px-2">
        {goals.map((g, i) => {
          if (!g) return null;
          const left = (g.value / max) * 100;
          const achieved = current >= g.value;

          return (
            <div
              key={i}
              className="absolute -bottom-6 flex flex-col items-center"
              style={{ left: `${left}%`, transform: "translateX(-50%)" }}
            >
              <div
                className={
                  achieved
                    ? "h-3 w-3 rounded-full bg-emerald-400 border-2 border-white shadow-md"
                    : "h-3 w-3 rounded-full bg-white/70 border border-white"
                }
              />
              <p className="text-[10px] mt-1 font-semibold text-white whitespace-nowrap">
                {g.label}: {formatter(g.value)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
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
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6">
            <CardHeader className="p-0">
                <CardTitle className="text-white">Progresso de Vendas</CardTitle>
                <CardDescription className="text-white/80">Acompanhe seu progresso para as metas de vendas.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 mt-8">
                 <div className="text-center mb-4">
                    <p className="text-4xl font-extrabold tracking-tight">{formatCurrency(vendas)}</p>
                    <p className="text-xs uppercase tracking-wide opacity-80 -mt-1">Vendido até agora</p>
                </div>
                <CleanProgressBar
                  current={Number(vendas)}
                  goals={[
                    { value: goals.metaMinha, label: "Prêmio 1" },
                    { value: goals.meta, label: "Prêmio 2" },
                    { value: goals.metona, label: "Turbo" },
                    goals.performanceBonusEnabled
                      ? { value: goals.metaLendaria, label: "Lendário" }
                      : null,
                  ].filter((g): g is { value: number; label: string } => g !== null)}
                  formatter={(v) => formatCurrency(v)}
                />
            </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className={cn("p-6 flex flex-col justify-between text-white", "bg-gradient-to-br from-violet-500 to-violet-700")}>
              <CardHeader className="p-0">
                <CardTitle className="text-white text-lg text-center">Produtos por Atendimento (PA)</CardTitle>
                 <CardDescription className="text-center text-white/80 text-sm">
                    Quantas peças você vende em média por atendimento.
                  </CardDescription>
              </CardHeader>

              <CardContent className="p-0 mt-6">
                <div className="text-center mb-4">
                  <p className="text-4xl font-extrabold tracking-tight">
                    {formatNumber(Number(pa))}
                  </p>
                </div>
                 <CleanProgressBar
                  current={Number(pa)}
                  goals={paGoals}
                  formatter={(v) => formatNumber(v)}
                />
              </CardContent>
            </Card>
            <Card className={cn("p-6 flex flex-col justify-between text-white", "bg-gradient-to-br from-amber-500 to-amber-700")}>
              <CardHeader className="p-0">
                <CardTitle className="text-white text-lg text-center">Ticket Médio</CardTitle>
                 <CardDescription className="text-center text-white/80 text-sm">
                    Quanto seu cliente gasta em média por compra.
                  </CardDescription>
              </CardHeader>

              <CardContent className="p-0 mt-6">
                 <div className="text-center mb-4">
                  <p className="text-4xl font-extrabold tracking-tight">
                    {formatCurrency(Number(ticketMedio))}
                  </p>
                </div>
                <CleanProgressBar
                  current={Number(ticketMedio)}
                  goals={ticketGoals}
                  formatter={(v) => formatCurrency(v)}
                />
              </CardContent>
            </Card>
        </div>
    </div>
  );
}
