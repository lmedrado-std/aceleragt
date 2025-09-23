
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Goals, Incentives, Seller } from "@/lib/storage";
import { DollarSign, Goal, Users, Trophy, TrendingUp, CheckCircle, Ticket, Gift, PartyPopper } from "lucide-react";
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

const InfoCard = ({ title, value, icon, description, className }: { title: string; value: string; icon: React.ReactNode; description?: string, className?: string }) => (
    <Card className={cn(className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs opacity-80">{description}</p>}
        </CardContent>
    </Card>
);

const GoalAchievementItem = ({ label, goalValue, sellers, sellersReached }: { label: string; goalValue: number; sellers: Seller[]; sellersReached: number }) => {
    const isAchieved = sellersReached > 0;
    return (
        <div className={cn("flex items-center justify-between p-3 rounded-lg", isAchieved ? "bg-green-100 dark:bg-green-900/30" : "bg-muted/50")}>
            <div>
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground">Meta: {goalValue > 0 ? formatCurrency(goalValue) : '-'}</p>
            </div>
            <div className="text-right">
                 <p className={cn("font-bold text-lg", isAchieved ? "text-green-600 dark:text-green-400" : "text-primary")}>{sellersReached} / {sellers.length}</p>
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

  const sortedSellers = [...sellers]
    .filter(s => (s.vendas || 0) > 0)
    .sort((a, b) => (b.vendas || 0) - (a.vendas || 0));
  const topSellers = sortedSellers.slice(0, 3);


  // Contagem de vendedores em cada faixa de meta
  const sellersInLendaria = sellers.filter(s => (s.vendas || 0) >= goals.metaLendaria).length;
  const sellersInMetona = sellers.filter(s => (s.vendas || 0) >= goals.metona && (s.vendas || 0) < goals.metaLendaria).length;
  const sellersInMeta = sellers.filter(s => (s.vendas || 0) >= goals.meta && (s.vendas || 0) < goals.metona).length;
  const sellersInMetinha = sellers.filter(s => (s.vendas || 0) >= goals.metaMinha && (s.vendas || 0) < goals.meta).length;

  const sellersReachedAnyGoal = sellersInLendaria > 0 || sellersInMetona > 0 || sellersInMeta > 0 || sellersInMetinha > 0;

  // Cálculo do detalhamento de prêmios
  const prizeBreakdown = Object.values(incentives).reduce((acc, incentive) => {
    if (!incentive) return acc;
    acc.meta1 += incentive.meta1Premio || 0;
    acc.meta2 += incentive.meta2Premio || 0;
    acc.meta3 += incentive.meta3Premio || 0;
    acc.lendaria += incentive.legendariaBonus || 0;
    acc.pa += incentive.paBonus || 0;
    acc.ticketMedio += incentive.ticketMedioBonus || 0;
    acc.corridinha += incentive.corridinhaDiariaBonus || 0;
    return acc;
  }, { meta1: 0, meta2: 0, meta3: 0, lendaria: 0, pa: 0, ticketMedio: 0, corridinha: 0 });

  const totalPrizes = Object.values(prizeBreakdown).reduce((sum, value) => sum + value, 0);

  const highestGoalAchieved = () => {
    if (sellersInLendaria > 0) return { name: "Lendária", message: `Pelo menos um membro da equipe já alcançou a Meta Lendária!` };
    if (sellersInMetona > 0) return { name: "Meta 3", message: `Pelo menos um membro da equipe já alcançou a Meta 3!` };
    if (sellersInMeta > 0) return { name: "Meta 2", message: `Pelo menos um membro da equipe já alcançou a Meta 2!` };
    if (sellersInMetinha > 0) return { name: "Meta 1", message: `Pelo menos um membro da equipe já alcançou a Meta 1!` };
    return null;
  }
  const celebration = highestGoalAchieved();

  const medals = ["🥇", "🥈", "🥉"];


  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard da Loja</CardTitle>
        <CardDescription>Resumo de desempenho da equipe e progresso das metas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* === KPIs === */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <InfoCard 
                title="Vendas Totais" 
                value={formatCurrency(totalSales)} 
                icon={<DollarSign className="h-4 w-4" />} 
                description="Soma de todas as vendas"
                className="bg-gradient-to-br from-blue-500 to-blue-700 text-white"
            />
            <InfoCard 
                title="Prêmios Totais" 
                value={formatCurrency(totalPrizes)} 
                icon={<Trophy className="h-4 w-4" />} 
                description="Soma de todos os prêmios"
                className="bg-gradient-to-br from-green-500 to-green-700 text-white"
            />
            <InfoCard 
                title="PA Médio da Equipe" 
                value={averagePA.toFixed(2)} 
                icon={<TrendingUp className="h-4 w-4" />} 
                description="Média de produtos por atendimento"
                className="bg-gradient-to-br from-purple-500 to-purple-700 text-white"
            />
            <InfoCard 
                title="Ticket Médio da Equipe" 
                value={formatCurrency(averageTicketMedio)} 
                icon={<Ticket className="h-4 w-4" />} 
                description="Valor médio por venda"
                className="bg-gradient-to-br from-orange-500 to-orange-700 text-white"
            />
        </div>

        {celebration && (
            <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                <CardContent className="p-4 flex items-center gap-4">
                    <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div>
                        <h3 className="font-bold text-lg text-green-800 dark:text-green-300">Parabéns, Equipe!</h3>
                        <p className="text-green-700 dark:text-green-300/90">{celebration.message}</p>
                    </div>
                </CardContent>
            </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* === Goal Achievement by Sellers === */}
            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Metas atingidas pela equipe.
                    </CardTitle>
                     <CardDescription>Quantos vendedores alcançaram cada nível.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                   <GoalAchievementItem label="Meta 1" goalValue={goals.metaMinha} sellers={sellers} sellersReached={sellersInMetinha} />
                   <GoalAchievementItem label="Meta 2" goalValue={goals.meta} sellers={sellers} sellersReached={sellersInMeta} />
                   <GoalAchievementItem label="Meta 3" goalValue={goals.metona} sellers={sellers} sellersReached={sellersInMetona} />
                   <GoalAchievementItem label="Lendária" goalValue={goals.metaLendaria} sellers={sellers} sellersReached={sellersInLendaria} />
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
                    <PrizeBreakdownItem label="Prêmio Meta 1" value={prizeBreakdown.meta1} />
                    <PrizeBreakdownItem label="Prêmio Meta 2" value={prizeBreakdown.meta2} />
                    <PrizeBreakdownItem label="Prêmio Meta 3" value={prizeBreakdown.meta3} />
                    <PrizeBreakdownItem label="Bônus Lendária" value={prizeBreakdown.lendaria} />
                    <PrizeBreakdownItem label="Bônus PA" value={prizeBreakdown.pa} />
                    <PrizeBreakdownItem label="Bônus Ticket Médio" value={prizeBreakdown.ticketMedio} />
                    <PrizeBreakdownItem label="Bônus Corridinha" value={prizeBreakdown.corridinha} />
                </CardContent>
            </Card>


            {/* === Summary & Top Performer === */}
             <Card className="bg-secondary/50 lg:col-span-1">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Pódio de Vendas
                    </CardTitle>
                    <CardDescription>{sellers.length} vendedores na competição</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {topSellers.length > 0 ? (
                        topSellers.map((seller, index) => (
                           <div key={seller.id} className="flex items-center gap-4 p-3 rounded-lg bg-background">
                               <span className="text-2xl w-6 text-center">{medals[index]}</span>
                               <div className="flex-grow">
                                   <p className="font-bold text-base truncate">{seller.name}</p>
                                   <p className="text-sm font-semibold text-primary">{formatCurrency(seller.vendas)}</p>
                               </div>
                           </div>
                        ))
                    ) : (
                        <div className="text-center p-6 rounded-lg bg-background flex items-center justify-center h-full">
                             <p className="text-muted-foreground">Sem dados de vendas para formar o pódio.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </CardContent>
    </Card>
  );
}
