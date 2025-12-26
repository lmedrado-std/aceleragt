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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
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

const TrophyIconFilled = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12.13 2.00016C12.0569 1.99849 11.9431 1.99849 11.87 2.00016C10.7495 2.04234 9.94319 2.92983 10 4.05016V4.90016H14V4.05016C14.0568 2.92983 13.2505 2.04234 12.13 2.00016Z" fill="#fbbf24"/>
        <path d="M19.5 5.00016C20.3284 5.00016 21 5.67173 21 6.50016C21 7.2133 20.4831 7.82023 19.8091 7.96265C19.932 8.6653 20 9.40016 20 10.1702V13.0002C20 14.1047 19.1046 15.0002 18 15.0002H16.5C16.5 15.8286 15.8284 16.5002 15 16.5002H9C8.17157 16.5002 7.5 15.8286 7.5 15.0002H6C4.89543 15.0002 4 14.1047 4 13.0002V10.1702C4 9.40016 4.06795 8.6653 4.19088 7.96265C3.51689 7.82023 3 7.2133 3 6.50016C3 5.67173 3.67157 5.00016 4.5 5.00016H19.5Z" fill="#fbbf24"/>
        <path d="M12 16.5H13V20.5C13 21.3284 12.3284 22 11.5 22H10.5C9.67157 22 9 21.3284 9 20.5V16.5H12Z" fill="#fbbf24"/>
    </svg>
);

const SalesProgressBar = ({ vendas, goals }: { vendas: number; goals: Goals }) => {
    const metas = [
        { value: goals.metaMinha, label: 'Meta 1', prize: goals.metaMinhaPrize },
        { value: goals.meta, label: 'Meta 2', prize: goals.metaPrize },
        { value: goals.metona, label: 'Meta 3', prize: goals.metonaPrize },
        goals.performanceBonusEnabled ? { value: goals.metaLendaria, label: 'Lendário', prize: goals.legendariaBonusValorPremio } : null,
    ].filter(Boolean) as { value: number; label: string; prize: number }[];

    const totalMeta = Math.max(...metas.map(m => m.value), 0) || 1;
    const progress = Math.min((vendas / totalMeta) * 100, 100);
    
    const nextGoal = metas.find(m => vendas < m.value);

    return (
        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-6">
            <CardHeader className="p-0">
                <CardTitle className="text-white">Progresso de Vendas</CardTitle>
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
                    {metas.map((meta, index) => {
                        const left = totalMeta > 0 ? (meta.value / totalMeta) * 100 : 0;
                        if (left <= 0 || left >= 100) return null;

                        const achieved = vendas >= meta.value;
                        const isNext = nextGoal && nextGoal.label === meta.label && !achieved;

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
                                                        isNext ? "bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.9)] animate-pulse" : "bg-white/60"
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
    )
}

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
  goals: { value: number; prize: number; label: string }[];
  valueFormatter: (value: number) => string;
  cardClassName?: string;
  description?: string;
}) => {
  const maxGoal = Math.max(...goals.map(g => g.value), 1);
  const progress = Math.min((currentValue / maxGoal) * 100, 100);

  const tierIndex = goals.findIndex((g, i) => currentValue < g.value && i === goals.indexOf(g));
  const currentTier = tierIndex <= 0 ? 0 : tierIndex - 1;
  const nextTier = goals[tierIndex];
  const currentTierData = goals[currentTier];

  return (
    <Card className={cn("p-6 text-white flex flex-col", cardClassName)}>
      <CardHeader className="p-0">
        <CardTitle className="text-lg text-center">{label}</CardTitle>
        {description && (
          <CardDescription className="text-center text-white/80 text-sm">{description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="p-0 mt-6">
        <div className="text-center mb-3">
          <p className="text-4xl font-extrabold">{valueFormatter(currentValue)}</p>
          {currentTierData?.label && (
            <p className="text-[11px] opacity-80 tracking-widest mt-1">{currentTierData.label} atual</p>
          )}
        </div>

        <div className="relative w-full h-4 rounded-full bg-white/25 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-emerald-400 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />

          {goals.map((g, i) => {
            const pos = (g.value / maxGoal) * 100;
            if (pos >= 100 || pos <= 0) return null;

            const isNext = nextTier?.label === g.label;
            const isCurrent = currentTierData?.label === g.label;

            return (
              <div
                key={i}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-[2px] h-3 rounded-full",
                  isCurrent ? "bg-white shadow-[0_0_6px_white]" :
                  isNext ? "bg-yellow-300 shadow-[0_0_8px_gold] animate-pulse" :
                  "bg-white/40"
                )}
                style={{ left: `${pos}%` }}
              />
            );
          })}
        </div>

        <div className="mt-3 text-center min-h-[40px] flex items-center justify-center">
          {nextTier ? (
            <div className="bg-white/15 px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-300" />
              Falta <strong>{valueFormatter(nextTier.value - currentValue)}</strong> para o{" "}
              <strong>{nextTier.label}</strong>
            </div>
          ) : (
            <div className="bg-white/15 px-4 py-2 rounded-full text-sm">
              Bônus máximo atingido
            </div>
          )}
        </div>
      </CardContent>
    </Card>
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
      <SalesProgressBar vendas={vendas} goals={goals} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MetricProgressBar
          label="Produtos por Atendimento (PA)"
          currentValue={pa}
          goals={paGoals}
          valueFormatter={formatNumber}
          cardClassName="bg-gradient-to-br from-violet-500 to-violet-700"
          description="Quantas peças você vende em média por atendimento."
        />
        <MetricProgressBar
          label="Ticket Médio"
          currentValue={ticketMedio}
          goals={ticketGoals}
          valueFormatter={formatCurrency}
          cardClassName="bg-gradient-to-br from-amber-500 to-amber-700"
          description="Quanto seu cliente gasta em média por compra."
        />
      </div>
    </div>
  );
}
