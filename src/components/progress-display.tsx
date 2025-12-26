"use client";

import type { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Goals, Seller } from "@/lib/storage";
import { RankingMetric } from "./goal-getter-dashboard";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Trophy } from "lucide-react";

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

const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const CleanProgressBar = ({
  current,
  goals,
  formatter,
}: {
  current: number;
  goals: { value: number; label: string; prize?: number }[];
  formatter: (v: number) => string;
}) => {
  const max = Math.max(...goals.map((g) => g.value), 1);
  const progress = Math.min((current / max) * 100, 100);

  return (
    <div className="relative w-full mt-8 mb-4">
      <div className="h-2 w-full bg-white/30 rounded-full">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative mt-2 flex justify-between w-full px-1">
        {goals.map((g, i) => {
          if (g.value <= 0) return null;
          const left = (g.value / max) * 100;
          const achieved = current >= g.value;

          return (
            <TooltipProvider key={i}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="absolute flex flex-col items-center"
                    style={{
                      left: `${left}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div
                      className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center transition-all duration-300",
                        achieved
                          ? "bg-emerald-400 border-2 border-white shadow-lg"
                          : "bg-white/50 border border-white"
                      )}
                    >
                      {achieved && <Trophy className="h-3 w-3 text-white" />}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{g.label}: {formatter(g.value)}</p>
                  {g.prize && <p className="text-xs text-muted-foreground">Prêmio: {formatCurrency(g.prize)}</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};


export function ProgressDisplay({
  salesData,
  incentives,
  rankings,
}: ProgressDisplayProps) {
  const { vendas = 0, pa = 0, ticket_medio: ticketMedio = 0, goals } =
    salesData;

  if (!goals) return <div className="p-4">Carregando metas...</div>;

  const paGoals = [
    { value: goals.paGoal1, prize: goals.paPrize1, label: "Nível 1" },
    { value: goals.paGoal2, prize: goals.paPrize2, label: "Nível 2" },
    { value: goals.paGoal3, prize: goals.paPrize3, label: "Nível 3" },
    { value: goals.paGoal4, prize: goals.paPrize4, label: "Nível 4" },
  ].filter(g => g.value > 0);

  const ticketGoals = [
    { value: goals.ticketMedioGoal1, prize: goals.ticketMedioPrize1, label: "Nível 1" },
    { value: goals.ticketMedioGoal2, prize: goals.ticketMedioPrize2, label: "Nível 2" },
    { value: goals.ticketMedioGoal3, prize: goals.ticketMedioPrize3, label: "Nível 3" },
    { value: goals.ticketMedioGoal4, prize: goals.ticketMedioPrize4, label: "Nível 4" },
  ].filter(g => g.value > 0);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6">
        <CardHeader className="p-0">
          <CardTitle className="text-white">Progresso de Vendas</CardTitle>
          <CardDescription className="text-white/80">
            Acompanhe seu progresso para as metas de vendas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 mt-8">
          <div className="text-center mb-4">
            <p className="text-4xl font-extrabold tracking-tight">
              {formatCurrency(vendas)}
            </p>
            <p className="text-xs uppercase tracking-wide opacity-80 -mt-1">
              Vendido até agora
            </p>
          </div>

          <CleanProgressBar
            current={vendas}
            goals={[
              { value: goals.metaMinha, label: "Meta 1", prize: goals.metaMinhaPrize },
              { value: goals.meta, label: "Meta 2", prize: goals.metaPrize },
              { value: goals.metona, label: "Turbo", prize: goals.metonaPrize },
              goals.performanceBonusEnabled
                ? { value: goals.metaLendaria, label: "Lendário" }
                : null,
            ].filter(Boolean) as { value: number; label: string; prize: number }[]}
            formatter={formatCurrency}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className={cn(
          "p-6 flex flex-col justify-between text-white",
          "bg-gradient-to-br from-violet-500 to-violet-700"
        )}>
          <CardHeader className="p-0">
            <CardTitle className="text-white text-lg text-center">
              Produtos por Atendimento (PA)
            </CardTitle>
            <CardDescription className="text-center text-white/80 text-sm">
              Quantas peças você vende em média por atendimento.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 mt-6">
            <div className="text-center mb-4">
              <p className="text-4xl font-extrabold tracking-tight">
                {formatNumber(pa)}
              </p>
            </div>

            <CleanProgressBar
              current={pa}
              goals={paGoals}
              formatter={formatNumber}
            />
          </CardContent>
        </Card>

        <Card className={cn(
          "p-6 flex flex-col justify-between text-white",
          "bg-gradient-to-br from-amber-500 to-amber-700"
        )}>
          <CardHeader className="p-0">
            <CardTitle className="text-white text-lg text-center">
              Ticket Médio
            </CardTitle>
            <CardDescription className="text-center text-white/80 text-sm">
              Quanto seu cliente gasta em média por compra.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 mt-6">
            <div className="text-center mb-4">
              <p className="text-4xl font-extrabold tracking-tight">
                {formatCurrency(ticketMedio)}
              </p>
            </div>

            <CleanProgressBar
              current={ticketMedio}
              goals={ticketGoals}
              formatter={formatCurrency}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
