"use client";

import type { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";
import { Award, CheckCircle, Gift, Star, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface IncentivesDisplayProps {
  incentives: IncentiveProjectionOutput | null;
  loading: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

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
          "p-1.5 rounded-full",
          achieved
            ? "bg-green-500 text-white"
            : "bg-primary/10 text-primary"
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

export function IncentivesDisplay({
  incentives,
  loading,
}: IncentivesDisplayProps) {
  const totalIncentives = incentives
    ? Object.values(incentives).reduce((sum, val) => sum + val, 0)
    : 0;

  const renderSkeletons = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-12 w-1/4" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );

  return (
    <Card className="shadow-lg border-2 border-transparent has-[[data-achieved=true]]:border-green-500 transition-all">
      <CardHeader>
        <CardTitle>Painel de Incentivos</CardTitle>
        <CardDescription>
          Veja seus ganhos potenciais baseados no seu desempenho atual.
        </CardDescription>
      </CardHeader>
      <CardContent data-achieved={totalIncentives > 0}>
        {loading ? (
          renderSkeletons()
        ) : incentives ? (
          <div className="space-y-4">
            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg flex justify-between items-center">
              <span className="font-bold text-primary text-lg">
                Ganho Total
              </span>
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(totalIncentives)}
              </span>
            </div>
            <div className="space-y-2 pt-2">
              <IncentiveItem
                icon={<Award className="w-5 h-5" />}
                label="Prêmio Metinha"
                value={incentives.metinhaPremio}
                achieved={incentives.metinhaPremio > 0}
              />
              <IncentiveItem
                icon={<Award className="w-5 h-5" />}
                label="Prêmio Meta"
                value={incentives.metaPremio}
                achieved={incentives.metaPremio > 0}
              />
              <IncentiveItem
                icon={<Award className="w-5 h-5" />}
                label="Prêmio Metona"
                value={incentives.metonaPremio}
                achieved={incentives.metonaPremio > 0}
              />
              <IncentiveItem
                icon={<Star className="w-5 h-5" />}
                label="Bônus Lendária"
                value={incentives.legendariaBonus}
                achieved={incentives.legendariaBonus > 0}
              />
              <IncentiveItem
                icon={<Gift className="w-5 h-5" />}
                label="Bônus PA"
                value={incentives.paBonus}
                achieved={incentives.paBonus > 0}
              />
              <IncentiveItem
                icon={<Gift className="w-5 h-5" />}
                label="Bônus Ticket Médio"
                value={incentives.ticketMedioBonus}
                achieved={incentives.ticketMedioBonus > 0}
              />
              <IncentiveItem
                icon={<Zap className="w-5 h-5" />}
                label="Bônus Corridinha Diária"
                value={incentives.corridinhaDiariaBonus}
                achieved={incentives.corridinhaDiariaBonus > 0}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <Award className="mx-auto h-12 w-12" />
            <p className="mt-4">
              Preencha os dados e clique em calcular para ver seus incentivos.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
