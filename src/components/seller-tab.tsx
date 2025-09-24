"use client";

import { Seller, Goals } from "@/lib/storage";
import { ProgressDisplay } from "./progress-display";
import { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";
import { RankingMetric } from "./goal-getter-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { DollarSign, Package, Ticket, Rocket, Clock, BarChart, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface SellerTabProps {
  seller: Seller;
  goals: Goals;
  incentives: IncentiveProjectionOutput | null;
  rankings: Record<RankingMetric, number> | null;
  lastUpdated: string | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const MetricCard = ({
  title,
  value,
  icon,
  description,
  className,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
  className?: string;
}) => (
  <Card className={cn("text-card-foreground", className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs opacity-80">{description}</p>
    </CardContent>
  </Card>
);

export function SellerTab({
  seller,
  goals,
  incentives,
  rankings,
  lastUpdated,
}: SellerTabProps) {
  const salesData = {
    ...seller,
    goals,
  };

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  return (
    <Tabs defaultValue="desempenho" className="w-full">
      <TabsList className="h-auto p-0 bg-transparent border-b">
        <TabsTrigger
          value="desempenho"
          className={
            "px-4 py-2 rounded-t-md border-b-2 border-transparent transition-all flex items-center hover:bg-blue-50 " +
            "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-b-blue-700"
          }
        >
          <Trophy className="mr-2 h-4 w-4" />
          Meu Desempenho
        </TabsTrigger>
        <TabsTrigger
          value="lancamentos"
          className={
            "px-4 py-2 rounded-t-md border-b-2 border-transparent transition-all flex items-center hover:bg-blue-50 " +
            "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:border-b-blue-700"
          }
        >
          <BarChart className="mr-2 h-4 w-4" />
          Meus Lançamentos
        </TabsTrigger>
      </TabsList>
      <TabsContent value="desempenho" className="mt-6">
        <ProgressDisplay salesData={salesData} incentives={incentives} rankings={rankings} />
      </TabsContent>
      <TabsContent value="lancamentos" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Meus Lançamentos</CardTitle>
            <CardDescription>
              Estes foram os dados de desempenho que o administrador lançou para você.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Vendas Realizadas"
                value={formatCurrency(seller.vendas)}
                icon={<DollarSign className="h-4 w-4" />}
                description="Total vendido no período"
                className="bg-gradient-to-br from-blue-500 to-blue-700 text-white"
              />
              <MetricCard
                title="Produtos por Atendimento (PA)"
                value={String(Number(seller.pa || 0).toFixed(2))}
                icon={<Package className="h-4 w-4" />}
                description="Média de itens por venda"
                className="bg-gradient-to-br from-purple-500 to-purple-700 text-white"
              />
              <MetricCard
                title="Ticket Médio"
                value={formatCurrency(seller.ticket_medio)}
                icon={<Ticket className="h-4 w-4" />}
                description="Valor médio por venda"
                className="bg-gradient-to-br from-orange-500 to-orange-700 text-white"
              />
              <MetricCard
                title="Bônus Corridinha"
                value={formatCurrency(seller.corridinha_diaria)}
                icon={<Rocket className="h-4 w-4" />}
                description="Bônus diário direto"
                className="bg-gradient-to-br from-green-500 to-green-700 text-white"
              />
            </div>
            {lastUpdated && (
              <div className="mt-6 p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-center flex items-center justify-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4" />
                <span>Última atualização de dados: {formattedLastUpdated}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}