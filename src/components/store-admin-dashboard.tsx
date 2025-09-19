
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Goals, Incentives, Seller } from "@/lib/storage";
import { DollarSign, Goal, Users, Trophy, TrendingUp } from "lucide-react";

interface StoreAdminDashboardProps {
  sellers: Seller[];
  goals: Goals;
  incentives: Incentives;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const InfoCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const ProgressBar = ({ title, currentValue, goalValue, format }: { title: string, currentValue: number, goalValue: number, format: (value: number) => string }) => {
    const percentage = goalValue > 0 ? (currentValue / goalValue) * 100 : 0;
    const isCompleted = currentValue >= goalValue;

    return (
        <div>
            <div className="mb-1 flex justify-between items-end">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <span className="text-xs font-semibold">
                    {format(currentValue)} / {format(goalValue)}
                </span>
            </div>
            <Progress value={percentage} className={isCompleted ? "[&>div]:bg-green-500" : ""} />
             {isCompleted && (
                <p className="text-xs font-semibold text-green-600 mt-1">Meta Batida!</p>
            )}
        </div>
    );
};

export function StoreAdminDashboard({ sellers, goals, incentives }: StoreAdminDashboardProps) {
  if (!sellers || !goals) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Carregando dados do dashboard...
        </CardContent>
      </Card>
    );
  }

  const totalSales = sellers.reduce((acc, seller) => acc + (Number(seller.vendas) || 0), 0);
  const totalPrizes = Object.values(incentives).reduce((acc, incentive) => {
    if (!incentive) return acc;
    return acc + Object.values(incentive).reduce((sum, val) => sum + (val || 0), 0);
  }, 0);
  
  const averageTicket = sellers.length > 0 ? totalSales / sellers.length : 0; // This seems wrong. ticket_medio should be averaged.
  const totalPA = sellers.reduce((acc, seller) => acc + (Number(seller.pa) || 0), 0);
  const averagePA = sellers.length > 0 ? totalPA / sellers.filter(s => s.pa > 0).length || 0 : 0;

  const highestGoal = Math.max(goals.metaMinha, goals.meta, goals.metona, goals.metaLendaria);
  const nextGoalValue = [goals.metaMinha, goals.meta, goals.metona, goals.metaLendaria].find(g => totalSales < g) || highestGoal;
  const nextGoalName = 
      totalSales < goals.metaMinha ? "Metinha" :
      totalSales < goals.meta ? "Meta" :
      totalSales < goals.metona ? "Metona" :
      totalSales < goals.metaLendaria ? "Lendária" : "Todas as metas batidas!";
  const amountToNextGoal = nextGoalValue > totalSales ? nextGoalValue - totalSales : 0;
  
  const bestSeller = sellers.reduce((prev, current) => ((prev.vendas || 0) > (current.vendas || 0)) ? prev : current, {} as Seller);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard da Loja</CardTitle>
        <CardDescription>Resumo de desempenho da equipe e progresso das metas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* === KPIs === */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard title="Vendas Totais" value={formatCurrency(totalSales)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
            <InfoCard title="Prêmios Pagos" value={formatCurrency(totalPrizes)} icon={<Trophy className="h-4 w-4 text-muted-foreground" />} />
            <InfoCard title="PA Médio da Equipe" value={averagePA.toFixed(2)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
            <InfoCard title="Vendedores Ativos" value={String(sellers.length)} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            {/* === Goal Progress === */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Goal className="h-5 w-5" />
                        Progresso das Metas de Vendas
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ProgressBar title="Metinha" currentValue={totalSales} goalValue={goals.metaMinha} format={formatCurrency} />
                    <ProgressBar title="Meta" currentValue={totalSales} goalValue={goals.meta} format={formatCurrency} />
                    <ProgressBar title="Metona" currentValue={totalSales} goalValue={goals.metona} format={formatCurrency} />
                    <ProgressBar title="Lendária" currentValue={totalSales} goalValue={goals.metaLendaria} format={formatCurrency} />
                </CardContent>
            </Card>

            {/* === Summary & Next Steps === */}
             <Card className="bg-secondary/50">
                <CardHeader>
                    <CardTitle>Resumo e Próximos Passos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {amountToNextGoal > 0 ? (
                        <div className="text-center p-4 rounded-lg bg-background">
                            <p className="text-muted-foreground">Faltam</p>
                            <p className="text-3xl font-bold text-primary">{formatCurrency(amountToNextGoal)}</p>
                            <p className="text-muted-foreground">para bater a <span className="font-bold">{nextGoalName}</span>!</p>
                        </div>
                    ) : (
                         <div className="text-center p-4 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-300">Parabéns!</p>
                            <p className="text-muted-foreground text-green-700 dark:text-green-400">Todas as metas principais de vendas foram alcançadas!</p>
                        </div>
                    )}

                    {bestSeller && bestSeller.name && (
                         <div className="text-center p-4 rounded-lg bg-background">
                            <p className="text-muted-foreground">Destaque da Equipe</p>
                            <p className="text-xl font-bold">{bestSeller.name}</p>
                            <p className="text-muted-foreground">com <span className="font-bold">{formatCurrency(bestSeller.vendas)}</span> em vendas.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </CardContent>
    </Card>
  );
}

    