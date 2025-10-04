
"use client";

import { Seller, Goals } from "@/lib/storage";
import { ProgressDisplay } from "./progress-display";
import { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";
import { RankingMetric } from "./goal-getter-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { DollarSign, Package, Ticket, Rocket, Clock, BarChart, Trophy, Target, Lightbulb, User, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TipsTab } from "./TipsTab";
import { PrizeWheel } from "./prize-wheel";

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

const GoalItem = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
    </div>
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
    <TooltipProvider>
      <Tabs defaultValue="desempenho" className="w-full">
        <TabsList className="h-auto p-0 bg-transparent grid grid-cols-2 sm:grid-cols-5 w-full sm:w-max gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="desempenho">
                <Trophy className="mr-2 h-4 w-4" />
                Meu Desempenho
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver desempenho e progresso das metas</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="lancamentos">
                <BarChart className="mr-2 h-4 w-4" />
                Meus Lançamentos
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver dados lançados pelo administrador</p>
            </TooltipContent>
          </Tooltip>
           <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="metas">
                <Target className="mr-2 h-4 w-4" />
                Metas
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Consultar os valores de todas as metas</p>
            </TooltipContent>
          </Tooltip>
           <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="roleta">
                <Gift className="mr-2 h-4 w-4" />
                Roleta de Prêmios
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Gire a roleta para ganhar prêmios!</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="dicas">
                <Lightbulb className="mr-2 h-4 w-4" />
                Dicas
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Dicas e artigos para melhorar suas vendas</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>

        <div className="my-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <User className="h-6 w-6 text-primary" />
                Painel de {seller.name}
            </h2>
            <p className="text-muted-foreground">Aqui está um resumo do seu progresso e ganhos projetados.</p>
        </div>
        
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

         <TabsContent value="metas" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Quadro de Metas</CardTitle>
                    <CardDescription>
                        Consulte aqui todos os objetivos e prêmios do período.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Metas de Vendas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <GoalItem label="Meta 1" value={`${formatCurrency(goals.metaMinha)} (Prêmio: ${formatCurrency(goals.metaMinhaPrize)})`} />
                            <GoalItem label="Meta 2" value={`${formatCurrency(goals.meta)} (Prêmio: ${formatCurrency(goals.metaPrize)})`} />
                            <GoalItem label="Meta 3" value={`${formatCurrency(goals.metona)} (Prêmio: ${formatCurrency(goals.metonaPrize)})`} />
                            {goals.performanceBonusEnabled && (
                                <GoalItem label="Bônus Performance" value={`Acima de ${formatCurrency(goals.metaLendaria)}`} />
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Metas de PA</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <GoalItem label="Nível 1" value={`${(goals.paGoal1 || 0).toFixed(2)} (Prêmio: ${formatCurrency(goals.paPrize1)})`} />
                           <GoalItem label="Nível 2" value={`${(goals.paGoal2 || 0).toFixed(2)} (Prêmio: ${formatCurrency(goals.paPrize2)})`} />
                           <GoalItem label="Nível 3" value={`${(goals.paGoal3 || 0).toFixed(2)} (Prêmio: ${formatCurrency(goals.paPrize3)})`} />
                           <GoalItem label="Nível 4" value={`${(goals.paGoal4 || 0).toFixed(2)} (Prêmio: ${formatCurrency(goals.paPrize4)})`} />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Metas de Ticket Médio</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <GoalItem label="Nível 1" value={`${formatCurrency(goals.ticketMedioGoal1)} (Prêmio: ${formatCurrency(goals.ticketMedioPrize1)})`} />
                            <GoalItem label="Nível 2" value={`${formatCurrency(goals.ticketMedioGoal2)} (Prêmio: ${formatCurrency(goals.ticketMedioPrize2)})`} />
                            <GoalItem label="Nível 3" value={`${formatCurrency(goals.ticketMedioGoal3)} (Prêmio: ${formatCurrency(goals.ticketMedioPrize3)})`} />
                            <GoalItem label="Nível 4" value={`${formatCurrency(goals.ticketMedioGoal4)} (Prêmio: ${formatCurrency(goals.ticketMedioPrize4)})`} />
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="roleta" className="mt-6">
            <PrizeWheel storeId={seller.store_id} />
        </TabsContent>

        <TabsContent value="dicas" className="mt-6">
          <TipsTab />
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}

    