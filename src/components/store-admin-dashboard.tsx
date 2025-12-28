
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Goals, Incentives, Seller } from "@/lib/storage";
import { DollarSign, Goal, Users, Trophy, TrendingUp, CheckCircle, Ticket, Gift, PartyPopper, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

const GoalAchievementItem = ({
  label,
  goalValue,
  sellers,
  achievingSellers,
}: {
  label: string;
  goalValue: number;
  sellers: Seller[];
  achievingSellers: { name: string; prize: number }[];
}) => {
  const sellersReached = achievingSellers.length;
  const isAchieved = sellersReached > 0;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center justify-between p-3 rounded-lg cursor-help",
            isAchieved ? "bg-green-100 dark:bg-green-900/30" : "bg-muted/50"
          )}
        >
          <div>
            <p className="font-semibold text-foreground">{label}</p>
            <p className="text-sm text-muted-foreground">
              Meta: {goalValue > 0 ? formatCurrency(goalValue) : "-"}
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "font-bold text-lg",
                isAchieved
                  ? "text-green-600 dark:text-green-400"
                  : "text-primary"
              )}
            >
              {sellersReached} / {sellers.length}
            </p>
            <p className="text-xs text-muted-foreground">Vendedores</p>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {achievingSellers.length > 0 ? (
          <div>
            <p className="font-bold mb-1">Vendedores que atingiram:</p>
            <ul className="space-y-1">
              {achievingSellers.map((s) => (
                <li key={s.name} className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="font-semibold ml-4">
                    {formatCurrency(s.prize)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Nenhum vendedor atingiu esta meta ainda.</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

const PrizeBreakdownItem = ({ label, value, colorClass, tooltipContent }: { label: string; value: number, colorClass?: string, tooltipContent: React.ReactNode }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className="flex justify-between items-center text-sm py-1.5 border-b border-border/50 last:border-0 cursor-help">
                <p className="text-muted-foreground">{label}</p>
                <p className={cn("font-semibold text-foreground", colorClass)}>{formatCurrency(value)}</p>
            </div>
        </TooltipTrigger>
        <TooltipContent>
            {tooltipContent}
        </TooltipContent>
    </Tooltip>
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


  // Vendedores em cada faixa
  const getSellersInTier = (min: number, max: number, prize: number) =>
    sellers
      .filter((s) => (s.vendas || 0) >= min && (s.vendas || 0) < max)
      .map((s) => ({ name: s.name, prize }));

  const sellersInLendaria = sellers
    .filter((s) => (s.vendas || 0) >= goals.metaLendaria)
    .map((s) => ({
      name: s.name,
      prize: incentives[s.id]?.legendariaBonus || 0,
    }));
  const sellersInMetona = getSellersInTier(
    goals.metona,
    goals.metaLendaria,
    goals.metonaPrize
  );
  const sellersInMeta = getSellersInTier(
    goals.meta,
    goals.metona,
    goals.metaPrize
  );
  const sellersInMetinha = getSellersInTier(
    goals.metaMinha,
    goals.meta,
    goals.metaMinhaPrize
  );


  const sellersReachedAnyGoal = sellersInLendaria.length > 0 || sellersInMetona.length > 0 || sellersInMeta.length > 0 || sellersInMetinha.length > 0;

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
    if (sellersInLendaria.length > 0) return { name: "Bônus Performance", message: `Pelo menos um membro da equipe já alcançou o Bônus Performance!` };
    if (sellersInMetona.length > 0) return { name: "Meta 3", message: `Pelo menos um membro da equipe já alcançou a Meta 3!` };
    if (sellersInMeta.length > 0) return { name: "Meta 2", message: `Pelo menos um membro da equipe já alcançou a Meta 2!` };
    if (sellersInMetinha.length > 0) return { name: "Meta 1", message: `Pelo menos um membro da equipe já alcançou a Meta 1!` };
    return null;
  }
  const celebration = highestGoalAchieved();

  const medals = ["🥇", "🥈", "🥉"];

  const getSellersForPrize = (prizeKey: keyof typeof prizeBreakdown) => {
    const incentiveKeyMap = {
        meta1: 'meta1Premio',
        meta2: 'meta2Premio',
        meta3: 'meta3Premio',
        lendaria: 'legendariaBonus',
        pa: 'paBonus',
        ticketMedio: 'ticketMedioBonus',
        corridinha: 'corridinhaDiariaBonus',
    };
    const incentiveKey = incentiveKeyMap[prizeKey] as keyof (typeof incentives[string]);

    const contributingSellers = sellers
        .map(seller => {
            const incentive = incentives[seller.id];
            const prizeValue = incentive ? (incentive[incentiveKey] || 0) : 0;
            return {
                id: seller.id,
                name: seller.name,
                prize: prizeValue,
            };
        })
        .filter(seller => seller.prize > 0)
        .sort((a, b) => b.prize - a.prize);


    if (contributingSellers.length === 0) {
        return <p>Nenhum vendedor atingiu este prêmio.</p>;
    }

    return (
        <div>
            <p className="font-bold mb-1">Vendedores Premiados:</p>
            <ul className="space-y-1">
                {contributingSellers.map(s => (
                    <li key={s.id} className="flex justify-between">
                        <span>{s.name}</span>
                        <span className="font-semibold ml-4">{formatCurrency(s.prize)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};


  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard da Loja</CardTitle>
        <CardDescription>Resumo de desempenho da equipe e progresso das metas.</CardDescription>
        <div className="!mt-4 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800/50">
            <CardDescription className="text-yellow-800 dark:text-yellow-300 text-xs flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Mantenha os lançamentos de vendas sempre atualizados para motivar a equipe. Atualizações diárias, seja no início ou no final do dia, garantem que todos vejam seu progresso em tempo real.
            </CardDescription>
        </div>
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
                description="Média de valor por venda"
                className="bg-gradient-to-br from-orange-500 to-orange-700 text-white"
            />
        </div>

        {/* === Main Grid === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* === Left Column: Ranking & Goals === */}
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Trophy className="text-yellow-500"/> Pódio de Vendas</CardTitle>
                        <CardDescription>Os 3 melhores vendedores por total de vendas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topSellers.length > 0 ? (
                           <div className="space-y-4">
                            {topSellers.map((seller, index) => (
                                <div key={seller.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                                    <div className="flex items-center gap-4">
                                        <span className="text-xl font-bold w-6">{medals[index]}</span>
                                        <p className="font-semibold text-foreground">{seller.name}</p>
                                    </div>
                                    <p className="font-bold text-lg text-primary">{formatCurrency(seller.vendas || 0)}</p>
                                </div>
                            ))}
                           </div>
                        ) : (
                            <p className="text-center text-sm text-muted-foreground py-4">Nenhuma venda registrada ainda para formar o pódio.</p>
                        )}
                    </CardContent>
                </Card>

                {celebration && (
                    <Alert className="border-green-600 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300">
                        <PartyPopper className="h-4 w-4 !text-green-600" />
                        <AlertTitle className="font-bold">Parabéns, Equipe! - {celebration.name} Atingida!</AlertTitle>
                        <AlertDescription>{celebration.message}</AlertDescription>
                    </Alert>
                )}
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Goal /> Progresso das Metas da Equipe</CardTitle>
                        <CardDescription>Passe o mouse sobre cada meta para ver quem atingiu e o prêmio.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sellersReachedAnyGoal ? (
                            <TooltipProvider>
                                <div className="space-y-2">
                                    <GoalAchievementItem label="Meta 1" goalValue={goals.metaMinha || 0} sellers={sellers} achievingSellers={sellersInMetinha} />
                                    <GoalAchievementItem label="Meta 2" goalValue={goals.meta || 0} sellers={sellers} achievingSellers={sellersInMeta} />
                                    <GoalAchievementItem label="Meta 3" goalValue={goals.metona || 0} sellers={sellers} achievingSellers={sellersInMetona} />
                                    {goals.performanceBonusEnabled && <GoalAchievementItem label="Bônus Performance" goalValue={goals.metaLendaria || 0} sellers={sellers} achievingSellers={sellersInLendaria} />}
                                </div>
                            </TooltipProvider>
                        ) : (
                            <p className="text-center text-sm text-muted-foreground py-4">Nenhum vendedor atingiu as metas de vendas ainda. Vamos lá, equipe!</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* === Right Column: Prize Breakdown === */}
            <div className="lg:col-span-1">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Gift /> Detalhamento de Prêmios</CardTitle>
                        <CardDescription>Passe o mouse sobre cada item para ver os detalhes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TooltipProvider>
                            <div className="space-y-1">
                                <PrizeBreakdownItem label="Prêmios Meta 1" value={prizeBreakdown.meta1} colorClass="text-green-600 dark:text-green-400" tooltipContent={getSellersForPrize('meta1')} />
                                <PrizeBreakdownItem label="Prêmios Meta 2" value={prizeBreakdown.meta2} colorClass="text-green-600 dark:text-green-400" tooltipContent={getSellersForPrize('meta2')} />
                                <PrizeBreakdownItem label="Prêmios Meta 3" value={prizeBreakdown.meta3} colorClass="text-green-600 dark:text-green-400" tooltipContent={getSellersForPrize('meta3')} />
                                {goals.performanceBonusEnabled && <PrizeBreakdownItem label="Bônus Performance" value={prizeBreakdown.lendaria} colorClass="text-green-600 dark:text-green-400" tooltipContent={getSellersForPrize('lendaria')} />}
                                <PrizeBreakdownItem label="Bônus PA" value={prizeBreakdown.pa} colorClass="text-purple-600 dark:text-purple-400" tooltipContent={getSellersForPrize('pa')} />
                                <PrizeBreakdownItem label="Bônus Ticket Médio" value={prizeBreakdown.ticketMedio} colorClass="text-orange-600 dark:text-orange-400" tooltipContent={getSellersForPrize('ticketMedio')} />
                                <PrizeBreakdownItem label="Bônus Corridinha" value={prizeBreakdown.corridinha} colorClass="text-blue-600 dark:text-blue-400" tooltipContent={getSellersForPrize('corridinha')} />
                            </div>
                        </TooltipProvider>
                    </CardContent>
                </Card>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
