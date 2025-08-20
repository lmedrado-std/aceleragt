"use client";

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
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressDisplayProps {
  salesData: {
    vendas: number;
    pa: number;
    ticketMedio: number;
    corridinhaDiaria: number;
    metaMinha: number;
    meta: number;
    metona: number;
    metaLendaria: number;
    paGoal4: number;
    ticketMedioGoal4: number;
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const ProgressItem = ({
  icon,
  title,
  currentValue,
  goalValue,
  formatValue = (v) => v.toString(),
  isCurrency = false,
}: {
  icon: React.ReactNode;
  title: string;
  currentValue: number;
  goalValue: number;
  formatValue?: (value: number) => string;
  isCurrency?: boolean;
}) => {
  const percentage = goalValue > 0 ? (currentValue / goalValue) * 100 : 0;
  const achieved = currentValue >= goalValue;

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{title}</span>
        </div>
        <div
          className={cn(
            "font-semibold flex items-center gap-1",
            achieved && "text-green-600 dark:text-green-400"
          )}
        >
          {achieved && <CheckCircle className="w-4 h-4" />}
          <span>
            {formatValue(currentValue)} / {formatValue(goalValue)}
          </span>
        </div>
      </div>
      <Progress value={percentage} className={achieved ? "[&>div]:bg-green-500" : ""} />
    </div>
  );
};

export function ProgressDisplay({ salesData }: ProgressDisplayProps) {
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
    ticketMedioGoal4,
  } = salesData;

  const salesPercentage = metaLendaria > 0 ? (vendas / metaLendaria) * 100 : 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Dashboard de Progresso</CardTitle>
        <CardDescription>
          Sua jornada para o sucesso em tempo real.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold">Progresso de Vendas</h3>
          </div>
          <div className="relative">
            <Progress value={salesPercentage} className="h-4" />
            <div
              className="absolute top-0 h-full border-r-2 border-dashed border-white/50"
              style={{ left: `${(metaMinha / metaLendaria) * 100}%` }}
              title={`Metinha: ${formatCurrency(metaMinha)}`}
            >
              <span className="absolute -top-6 -translate-x-1/2 text-xs font-bold">MIN</span>
            </div>
            <div
              className="absolute top-0 h-full border-r-2 border-dashed border-white/50"
              style={{ left: `${(meta / metaLendaria) * 100}%` }}
              title={`Meta: ${formatCurrency(meta)}`}
            >
              <span className="absolute -top-6 -translate-x-1/2 text-xs font-bold">META</span>
            </div>
             <div
              className="absolute top-0 h-full border-r-2 border-dashed border-white/50"
              style={{ left: `${(metona / metaLendaria) * 100}%` }}
              title={`Metona: ${formatCurrency(metona)}`}
            >
              <span className="absolute -top-6 -translate-x-1/2 text-xs font-bold">METONA</span>
            </div>
            <div
              className="absolute top-0 h-full"
              style={{ left: `100%` }}
              title={`Lendária: ${formatCurrency(metaLendaria)}`}
            >
              <span className="absolute -top-6 -translate-x-1/2 text-xs font-bold">MAX</span>
            </div>
          </div>
          <div className="text-right mt-2 font-bold text-lg text-primary">
            {formatCurrency(vendas)} / {formatCurrency(metaLendaria)}
          </div>
        </div>

        <div className="grid sm:grid-cols-1 gap-6 pt-4">
          <ProgressItem
            icon={<Package className="w-5 h-5" />}
            title="Produtos por Atendimento (PA)"
            currentValue={pa}
            goalValue={paGoal4}
            formatValue={(v) => (typeof v === 'number' ? v.toFixed(2) : Number(v || 0).toFixed(2))}
          />
          <ProgressItem
            icon={<Ticket className="w-5 h-5" />}
            title="Ticket Médio"
            currentValue={ticketMedio}
            goalValue={ticketMedioGoal4}
            formatValue={formatCurrency}
            isCurrency
          />
          <ProgressItem
            icon={<TrendingUp className="w-5 h-5" />}
            title="Corridinha Diária"
            currentValue={corridinhaDiaria}
            goalValue={200}
            formatValue={formatCurrency}
            isCurrency
          />
        </div>
      </CardContent>
    </Card>
  );
}
