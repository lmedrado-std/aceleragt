
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Goals, Incentives, Seller } from "@/lib/storage";
import { DollarSign, Goal, Users, Trophy, TrendingUp, CheckCircle, Ticket, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

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

const InfoCard = ({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const GoalAchievementItem = ({ label, goalValue, sellers, sellersReached }: { label: string; goalValue: number; sellers: Seller[]; sellersReached: number }) => {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-background">
            <div>
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground">Meta: {goalValue > 0 ? formatCurrency(goalValue) : '-'}</p>
            </div>
            <div className="text-right">
                 <p className="font-bold text-lg text-primary">{sellersReached} / {sellers.length}</p>
                 <p className="text-xs text-muted-foreground">Vendedores</p>
            </div>
        </div>
    );
};

const PrizeBreakdownItem = ({ label, value, colorClass }: { label: string; value: number, colorClass?: string }) => (
    <div className="flex justify-between items-center text-sm py-1.5 border-b border-border/50 last:border-0">
        <p className="text-muted-foreground">{label}</p>
        <p className={cn("font-semibold text-foreground", colorClass)}>{formatCurrency(value)}</p>
    </div>
);


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
  
  const totalPA = sellers.reduce((acc, seller) => acc + (Number(seller.pa) || 0), 0);
  const sellersWithPA = sellers.filter(s => (s.pa || 0) > 0);
  const averagePA = sellersWithPA.length > 0 ? totalPA / sellersWithPA.length : 0;

  const totalTicketMedio = sellers.reduce((acc, seller) => acc + (Number(seller.ticket_medio) || 0), 0);
  const sellersWithTicketMedio = sellers.filter(s => (s.ticket_medio || 0) > 0);
  const averageTicketMedio = sellersWithTicketMedio.length > 0 ? totalTicketMedio / sellersWithTicketMedio.length : 0;

  const bestSeller = sellers.length > 0 
    ? sellers.reduce((prev, current) => ((prev.vendas || 0) > (current.vendas || 0)) ? prev : current, sellers[0]) 
    : null;

  // Contagem de vendedores que atingiram cada meta
  const sellersReachedMetinha = sellers.filter(s => (s.vendas || 0) >= goals.metaMinha).length;
  const sellersReachedMeta = sellers.filter(s => (s.vendas || 0) >= goals.meta).length;
  const sellersReachedMetona = sellers.filter(s => (s.vendas || 0) >= goals.metona).length;
  const sellersReachedLendaria = sellers.filter(s => (s.vendas || 0) >= goals.metaLendaria).length;

  // Cálculo do detalhamento de prêmios
  const prizeBreakdown = Object.values(incentives).reduce((acc, incentive) => {
    if (!incentive) return acc;
    acc.metinha += incentive.metinhaPremio || 0;
    acc.meta += incentive.metaPremio || 0;
    acc.metona += incentive.metonaPremio || 0;
    acc.lendaria += incentive.legendariaBonus || 0;
    acc.pa += incentive.paBonus || 0;
    acc.ticketMedio += incentive.ticketMedioBonus || 0;
    acc.corridinha += incentive.corridinhaDiariaBonus || 0;
    return acc;
  }, { metinha: 0, meta: 0, metona: 0, lendaria: 0, pa: 0, ticketMedio: 0, corridinha: 0 });

  const totalPrizes = Object.values(prizeBreakdown).reduce((sum, value) => sum + value, 0);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard da Loja</CardTitle>
        <CardDescription>Resumo de desempenho da equipe e progresso das metas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* === KPIs === */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard title="Vendas Totais" value={formatCurrency(totalSales)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} description="Soma de todas as vendas" />
            <InfoCard title="Prêmios Totais" value={formatCurrency(totalPrizes)} icon={<Trophy className="h-4 w-4 text-muted-foreground" />} description="Soma de todos os prêmios" />
            <InfoCard title="PA Médio da Equipe" value={averagePA.toFixed(2)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} description="Média de produtos por atendimento"/>
            <InfoCard title="Ticket Médio da Equipe" value={formatCurrency(averageTicketMedio)} icon={<Ticket className="h-4 w-4 text-muted-foreground" />} description="Valor médio por venda"/>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* === Goal Achievement by Sellers === */}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Atingimento de Metas de Vendas
                    </CardTitle>
                     <CardDescription>Quantos vendedores alcançaram cada nível.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                   <GoalAchievementItem label="Metinha" goalValue={goals.metaMinha} sellers={sellers} sellersReached={sellersReachedMetinha} />
                   <GoalAchievementItem label="Meta" goalValue={goals.meta} sellers={sellers} sellersReached={sellersReachedMeta} />
                   <GoalAchievementItem label="Metona" goalValue={goals.metona} sellers={sellers} sellersReached={sellersReachedMetona} />
                   <GoalAchievementItem label="Lendária" goalValue={goals.metaLendaria} sellers={sellers} sellersReached={sellersReachedLendaria} />
                </CardContent>
            </Card>

             {/* === Prize Breakdown === */}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5" />
                        Detalhamento dos Prêmios
                    </CardTitle>
                    <CardDescription>Valores pagos por categoria de incentivo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PrizeBreakdownItem label="Prêmio Metinha" value={prizeBreakdown.metinha} />
                    <PrizeBreakdownItem label="Prêmio Meta" value={prizeBreakdown.meta} />
                    <PrizeBreakdownItem label="Prêmio Metona" value={prizeBreakdown.metona} />
                    <PrizeBreakdownItem label="Bônus Lendária" value={prizeBreakdown.lendaria} />
                    <PrizeBreakdownItem label="Bônus PA" value={prizeBreakdown.pa} />
                    <PrizeBreakdownItem label="Bônus Ticket Médio" value={prizeBreakdown.ticketMedio} />
                    <PrizeBreakdownItem label="Bônus Corridinha" value={prizeBreakdown.corridinha} />
                </CardContent>
            </Card>


            {/* === Summary & Top Performer === */}
             <Card className="bg-secondary/50 lg:col-span-1">
                <CardHeader>
                    <CardTitle>Destaques da Equipe</CardTitle>
                    <CardDescription>{sellers.length} vendedores ativos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {bestSeller && bestSeller.name && bestSeller.vendas > 0 ? (
                         <div className="text-center p-6 rounded-lg bg-background">
                            <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2"/>
                            <p className="text-muted-foreground text-sm">Destaque em Vendas</p>
                            <p className="text-xl font-bold">{bestSeller.name}</p>
                            <p className="text-lg font-semibold text-primary">{formatCurrency(bestSeller.vendas)}</p>
                        </div>
                    ) : (
                        <div className="text-center p-6 rounded-lg bg-background flex items-center justify-center h-full">
                             <p className="text-muted-foreground">Sem dados de vendas para definir um destaque.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </CardContent>
    </Card>
  );
}
