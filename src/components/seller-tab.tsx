
"use client";

import { Seller, Goals } from "@/lib/storage";
import { ProgressDisplay } from "./progress-display";
import { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";
import { RankingMetric } from "./goal-getter-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { DollarSign, Package, Ticket, Rocket, Clock, BarChart, Trophy, Target, Lightbulb, User, Gift, ArrowRight, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TipsTab } from "./TipsTab";
import { useEffect, useState } from "react";
import { trackSellerView } from "@/lib/tracking";
import { format } from "date-fns";
import confetti from 'canvas-confetti';
import dynamic from "next/dynamic";
import { Separator } from "./ui/separator";
import { WelcomeModal } from "./welcome-modal";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";


const PrizeWheel = dynamic(() => import("@/components/prize-wheel").then(mod => mod.PrizeWheel), { ssr: false });

interface SellerTabProps {
  seller: Seller;
  goals: Goals;
  incentives: IncentiveProjectionOutput | null;
  rankings: Record<RankingMetric, number> | null;
  lastUpdated: string | null;
  storeId: string;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const findNextGoal = (currentValue: number, goalTiers: { goal: number; prize: number }[]) => {
  // Find the first goal that is greater than the current value
  return goalTiers.find(tier => currentValue < tier.goal) || null;
}


const MetricCard = ({ title, value, icon, description, className, children, isRevealed, onReveal }: { title: string; value: string; icon: React.ReactNode; description: string; className?: string, children: React.ReactNode, isRevealed: boolean, onReveal: () => void }) => (
    <Dialog onOpenChange={(open) => { if(open) onReveal()}}>
        <DialogTrigger asChild>
            <Card className={cn("text-card-foreground cursor-pointer hover:scale-105 hover:shadow-lg transition-transform", className)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
                </CardHeader>
                <CardContent>
                 {isRevealed ? (
                    <div className="text-2xl font-bold">{value}</div>
                ) : (
                    <div className="text-lg font-semibold flex items-center gap-2 opacity-80">
                        <Eye className="h-4 w-4"/> Clique para ver
                    </div>
                )}
                <p className="text-xs opacity-80">{description}</p>
                </CardContent>
            </Card>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                    {icon} {title}
                </DialogTitle>
                <DialogDescription>
                    Seu desempenho atual e uma dica para você ir além.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                {children}
            </div>
        </DialogContent>
    </Dialog>
);


const GoalDetail = ({ label, prize, achieved }: { label: string, prize: number, achieved: boolean }) => (
     <div className={cn("flex justify-between items-center p-3 rounded-lg", achieved ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" : "bg-muted/50")}>
        <p className="font-medium">{label}</p>
        <p className={cn("font-bold text-lg", achieved ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>{formatCurrency(prize)}</p>
    </div>
)

const GoalItem = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
    </div>
);

type RevealedCardType = "vendas" | "corridinha" | "pa" | "ticket";

export function SellerTab({ seller, goals, incentives, rankings, lastUpdated, storeId }: SellerTabProps) {
  const salesData = { ...seller, goals };
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [revealedCards, setRevealedCards] = useState(new Set<RevealedCardType>());

  const handleReveal = (card: RevealedCardType) => {
    setRevealedCards(prev => new Set(prev).add(card));
  };
  const allCardsRevealed = revealedCards.size === 4;

  useEffect(() => {
    if (seller.id) {
      trackSellerView(seller.id);
      const welcomeShownKey = `welcomeModalShown-${seller.id}`;
      const hasBeenShown = sessionStorage.getItem(welcomeShownKey);

      if (!hasBeenShown) {
        setShowWelcomeModal(true);
        sessionStorage.setItem(welcomeShownKey, 'true');
      }
    }
  }, [seller.id]);

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "N/A";

  const isCorridinhaActive = goals.corridinhaStartDate && goals.corridinhaEndDate && new Date(goals.corridinhaStartDate) <= new Date() && new Date(goals.corridinhaEndDate) >= new Date();

  const handleSpinWin = (result: any) => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
    });
  };
  
  const totalIncentives = incentives
    ? Object.values(incentives).reduce((sum, val) => sum + (val || 0), 0)
    : 0;

  const totalPotentialPrizes =
    (incentives?.meta1Premio || 0) +
    (incentives?.meta2Premio || 0) +
    (incentives?.meta3Premio || 0) +
    (incentives?.legendariaBonus || 0) +
    (incentives?.paBonus || 0) +
    (incentives?.ticketMedioBonus || 0) +
    (incentives?.corridinhaDiariaBonus || 0);

  const salesGoalTiers = [
    { goal: goals.metaMinha || 0, prize: goals.metaMinhaPrize || 0 },
    { goal: goals.meta || 0, prize: goals.metaPrize || 0 },
    { goal: goals.metona || 0, prize: goals.metonaPrize || 0 },
    { goal: goals.metaLendaria || 0, prize: goals.legendariaBonusValorPremio || 0 },
  ];
  const nextSalesGoal = findNextGoal(seller.vendas, salesGoalTiers);

  const paGoalTiers = [
      { goal: goals.paGoal1 || 0, prize: goals.paPrize1 || 0 },
      { goal: goals.paGoal2 || 0, prize: goals.paPrize2 || 0 },
      { goal: goals.paGoal3 || 0, prize: goals.paPrize3 || 0 },
      { goal: goals.paGoal4 || 0, prize: goals.paPrize4 || 0 },
  ];
  const nextPaGoal = findNextGoal(seller.pa, paGoalTiers);

  const ticketMedioGoalTiers = [
      { goal: goals.ticketMedioGoal1 || 0, prize: goals.ticketMedioPrize1 || 0 },
      { goal: goals.ticketMedioGoal2 || 0, prize: goals.ticketMedioPrize2 || 0 },
      { goal: goals.ticketMedioGoal3 || 0, prize: goals.ticketMedioPrize3 || 0 },
      { goal: goals.ticketMedioGoal4 || 0, prize: goals.ticketMedioPrize4 || 0 },
  ];
  const nextTicketMedioGoal = findNextGoal(seller.ticket_medio, ticketMedioGoalTiers);


  return (
    <TooltipProvider>
      <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
          seller={seller}
          goals={goals}
          incentives={incentives}
      />
      <Tabs defaultValue="desempenho" className="w-full">
        <TabsList className="h-auto p-0 bg-transparent grid grid-cols-2 sm:grid-cols-5 w-full sm:w-max gap-2">
          <Tooltip><TooltipTrigger asChild><TabsTrigger value="desempenho"><Trophy className="mr-2 h-4 w-4" />Meu Desempenho</TabsTrigger></TooltipTrigger><TooltipContent><p>Ver desempenho e progresso das metas</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><TabsTrigger value="lancamentos"><BarChart className="mr-2 h-4 w-4" />Meus Lançamentos</TabsTrigger></TooltipTrigger><TooltipContent><p>Ver dados lançados pelo administrador</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><TabsTrigger value="metas"><Target className="mr-2 h-4 w-4" />Metas</TabsTrigger></TooltipTrigger><TooltipContent><p>Consultar os valores de todas as metas</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><TabsTrigger value="roleta"><Gift className="mr-2 h-4 w-4" />Roleta de Prêmios</TabsTrigger></TooltipTrigger><TooltipContent><p>Gire a roleta para ganhar prêmios!</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><TabsTrigger value="dicas"><Lightbulb className="mr-2 h-4 w-4" />Dicas</TabsTrigger></TooltipTrigger><TooltipContent><p>Dicas e artigos para melhorar suas vendas</p></TooltipContent></Tooltip>
        </TabsList>
        <Separator className="my-4" />

        <div className="my-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><User className="h-6 w-6 text-primary" />Painel de {seller.name}</h2>
            <p className="text-muted-foreground">Aqui está um resumo do seu progresso e ganhos projetados.</p>
        </div>
        
        <TabsContent value="desempenho" className="mt-6">
          <ProgressDisplay salesData={salesData} incentives={incentives} rankings={rankings} />
        </TabsContent>
        
        <TabsContent value="lancamentos" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                    <CardTitle>Meus Lançamentos</CardTitle>
                    <CardDescription>Clique em cada card para revelar seu desempenho e receber dicas para melhorar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    <MetricCard title="Vendas Realizadas" value={formatCurrency(seller.vendas)} icon={<DollarSign className="h-4 w-4" />} description="Total vendido no período" className="bg-gradient-to-br from-blue-500 to-blue-700 text-white" isRevealed={revealedCards.has('vendas')} onReveal={() => handleReveal('vendas')}>
                        <p className="text-4xl font-bold">{formatCurrency(seller.vendas)}</p>
                        {nextSalesGoal ? (
                            <p className="text-muted-foreground mt-2">Faltam <span className="font-bold text-foreground">{formatCurrency(nextSalesGoal.goal - seller.vendas)}</span> para o próximo prêmio de <span className="font-bold text-foreground">{formatCurrency(nextSalesGoal.prize)}</span>.</p>
                        ) : (
                            <p className="text-muted-foreground mt-2">Você atingiu a meta principal de vendas!</p>
                        )}
                        <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-sm space-y-2">
                            <p className="font-semibold text-amber-800 dark:text-amber-200">Dicas para Fechar Mais Vendas:</p>
                            <ul className="list-disc list-inside text-amber-700 dark:text-amber-300">
                                <li>Aborde rápido e com pergunta aberta: “O que você procura hoje pra te ajudar?”.</li>
                                <li>Mostre no mínimo duas opções antes de deixar o cliente decidir.</li>
                                <li>Facilite o “sim”: fale de parcelamento, troca fácil e vantagens da loja.</li>
                            </ul>
                        </div>
                    </MetricCard>

                    <MetricCard title="Bônus Corridinha" value={formatCurrency(seller.corridinha_diaria)} icon={<Rocket className="h-4 w-4" />} description="Bônus diário direto" className="bg-gradient-to-br from-green-500 to-green-700 text-white" isRevealed={revealedCards.has('corridinha')} onReveal={() => handleReveal('corridinha')}>
                        <p className="text-4xl font-bold">{formatCurrency(seller.corridinha_diaria)}</p>
                        <p className="text-muted-foreground mt-2">Este é um bônus direto concedido pelo seu gestor.</p>
                        <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-sm">
                             <p className="font-semibold text-amber-800 dark:text-amber-200">Dica Rápida:</p>
                            <p className="text-amber-700 dark:text-amber-300">Continue focado nas metas do dia para ganhar mais bônus como este!</p>
                        </div>
                    </MetricCard>

                    <MetricCard title="Produtos por Atendimento (PA)" value={String(Number(seller.pa || 0).toFixed(2))} icon={<Package className="h-4 w-4" />} description="Média de itens por venda" className="bg-gradient-to-br from-purple-500 to-purple-700 text-white" isRevealed={revealedCards.has('pa')} onReveal={() => handleReveal('pa')}>
                        <p className="text-4xl font-bold">{String(Number(seller.pa || 0).toFixed(2))}</p>
                        {nextPaGoal ? (
                            <p className="text-muted-foreground mt-2">Sua próxima meta de PA é <span className="font-bold text-foreground">{nextPaGoal.goal.toFixed(2)}</span> para um bônus de <span className="font-bold text-foreground">{formatCurrency(nextPaGoal.prize)}</span>.</p>
                        ) : (
                            <p className="text-muted-foreground mt-2">Você atingiu o nível máximo de bônus de PA!</p>
                        )}
                        <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-sm space-y-2">
                             <p className="font-semibold text-amber-800 dark:text-amber-200">Dicas para Aumentar seu PA:</p>
                             <ul className="list-disc list-inside text-amber-700 dark:text-amber-300">
                                <li>Nunca deixe o cliente sair com apenas 1 peça; mostre pelo menos mais 2 opções.</li>
                                <li>Monte combos inteligentes (2 blusas + 1 calça, 3 meias etc.).</li>
                                <li>Aproveite o provador para sugerir “mais uma peça que combine com esse look”.</li>
                             </ul>
                        </div>
                    </MetricCard>

                    <MetricCard title="Ticket Médio" value={formatCurrency(seller.ticket_medio)} icon={<Ticket className="h-4 w-4" />} description="Valor médio por venda" className="bg-gradient-to-br from-orange-500 to-orange-700 text-white" isRevealed={revealedCards.has('ticket')} onReveal={() => handleReveal('ticket')}>
                        <p className="text-4xl font-bold">{formatCurrency(seller.ticket_medio)}</p>
                        {nextTicketMedioGoal ? (
                            <p className="text-muted-foreground mt-2">Sua próxima meta de Ticket Médio é <span className="font-bold text-foreground">{formatCurrency(nextTicketMedioGoal.goal)}</span> para um bônus de <span className="font-bold text-foreground">{formatCurrency(nextTicketMedioGoal.prize)}</span>.</p>
                        ) : (
                            <p className="text-muted-foreground mt-2">Você atingiu o nível máximo de bônus de Ticket Médio!</p>
                        )}
                        <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-sm space-y-2">
                            <p className="font-semibold text-amber-800 dark:text-amber-200">Dicas para Aumentar seu Ticket Médio:</p>
                             <ul className="list-disc list-inside text-amber-700 dark:text-amber-300">
                                <li>Ofereça sempre uma opção mais completa (kit, look pronto, versão “premium”).</li>
                                <li>Sugira produto complementar na hora de fechar (cinto, meia, acessório).</li>
                                <li>Use a frase: “Com mais R$ X você leva este aqui que vale mais a pena.”</li>
                             </ul>
                        </div>
                    </MetricCard>
                  </div>
                  {lastUpdated && (
                    <div className="mt-6 p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-center flex items-center justify-center gap-2 text-sm font-medium"><Clock className="h-4 w-4" /><span>Última atualização de dados: {formattedLastUpdated}</span></div>
                  )}
                </CardContent>
              </Card>
            </div>
            {allCardsRevealed && (
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Resumo de Ganhos</CardTitle>
                            <CardDescription>Seus prêmios e bônus por performance detalhados.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Por vendas</p>
                                <GoalDetail label="Prêmio Meta Mínima" prize={incentives?.meta1Premio || 0} achieved={(incentives?.meta1Premio || 0) > 0} />
                                <GoalDetail label="Prêmio Meta Cheia" prize={incentives?.meta2Premio || 0} achieved={(incentives?.meta2Premio || 0) > 0} />
                                <GoalDetail label="Prêmio Meta Turbo" prize={incentives?.meta3Premio || 0} achieved={(incentives?.meta3Premio || 0) > 0} />
                                {goals.performanceBonusEnabled && <GoalDetail label="Bônus Performance" prize={incentives?.legendariaBonus || 0} achieved={(incentives?.legendariaBonus || 0) > 0} />}
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Por PA e Ticket</p>
                                <GoalDetail label="Bônus PA" prize={incentives?.paBonus || 0} achieved={(incentives?.paBonus || 0) > 0} />
                                <GoalDetail label="Bônus Ticket Médio" prize={incentives?.ticketMedioBonus || 0} achieved={(incentives?.ticketMedioBonus || 0) > 0} />
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Outros Bônus</p>
                                <GoalDetail label="Bônus Corridinha" prize={incentives?.corridinhaDiariaBonus || 0} achieved={(incentives?.corridinhaDiariaBonus || 0) > 0} />
                            </div>
                            <Separator />
                            <div className="text-right pt-2">
                            <p className="text-xs font-semibold text-muted-foreground">Ganhos projetados no mês</p>
                            <p className="text-2xl font-bold text-primary">{formatCurrency(totalIncentives)}</p>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-sm font-semibold text-muted-foreground">
                                Se bater todas as metas:
                                </span>
                                <span className="font-bold text-lg text-primary">
                                {formatCurrency(totalPotentialPrizes)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
          </div>
        </TabsContent>

         <TabsContent value="metas" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-3">
                    <CardHeader><CardTitle>Quadro de Metas</CardTitle><CardDescription>Consulte aqui todos os objetivos e prêmios do período.</CardDescription></CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-3">
                        <Card><CardHeader><CardTitle className="text-lg">Metas de Vendas</CardTitle></CardHeader><CardContent><GoalItem label="Meta Mínima" value={`${formatCurrency(goals.metaMinha)} (Prêmio: ${formatCurrency(goals.metaMinhaPrize)})`} /><GoalItem label="Meta Cheia" value={`${formatCurrency(goals.meta)} (Prêmio: ${formatCurrency(goals.metaPrize)})`} /><GoalItem label="Meta Turbo" value={`${formatCurrency(goals.metona)} (Prêmio: ${formatCurrency(goals.metonaPrize)})`} />{goals.performanceBonusEnabled && (<GoalItem label="Bônus Performance" value={`Acima de ${formatCurrency(goals.metaLendaria)}`} />)}</CardContent></Card>
                         <Card><CardHeader><CardTitle className="text-lg">Metas de PA</CardTitle></CardHeader><CardContent><GoalItem label="Nível 1" value={`${(goals.paGoal1 || 0).toFixed(2)} (Prêmio: ${formatCurrency(goals.paPrize1)})`} /><GoalItem label="Nível 2" value={`${(goals.paGoal2 || 0).toFixed(2)} (Prêmio: ${formatCurrency(goals.paPrize2)})`} /><GoalItem label="Nível 3" value={`${(goals.paGoal3 || 0).toFixed(2)} (Prêmio: ${formatCurrency(goals.paPrize3)})`} /><GoalItem label="Nível 4" value={`${(goals.paGoal4 || 0).toFixed(2)} (Prêmio: ${formatCurrency(goals.paPrize4)})`} /></CardContent></Card>
                         <Card><CardHeader><CardTitle className="text-lg">Metas de Ticket Médio</CardTitle></CardHeader><CardContent><GoalItem label="Nível 1" value={`${formatCurrency(goals.ticketMedioGoal1)} (Prêmio: ${formatCurrency(goals.ticketMedioPrize1)})`} /><GoalItem label="Nível 2" value={`${formatCurrency(goals.ticketMedioGoal2)} (Prêmio: ${formatCurrency(goals.ticketMedioPrize2)})`} /><GoalItem label="Nível 3" value={`${formatCurrency(goals.ticketMedioGoal3)} (Prêmio: ${formatCurrency(goals.ticketMedioPrize3)})`} /><GoalItem label="Nível 4" value={`${formatCurrency(goals.ticketMedioGoal4)} (Prêmio: ${formatCurrency(goals.ticketMedioPrize4)})`} /></CardContent></Card>
                    </CardContent>
                </Card>
                 {isCorridinhaActive && (
                  <Card className="lg:col-span-3"><CardHeader><CardTitle className="flex items-center gap-2 text-primary"><Rocket /> Corridinha Ativa!</CardTitle><CardDescription>Um incentivo especial está ativo no período de {goals.corridinhaStartDate ? format(new Date(goals.corridinhaStartDate), 'dd/MM/yyyy') : ''} até {goals.corridinhaEndDate ? format(new Date(goals.corridinhaEndDate), 'dd/MM/yyyy') : ''}.</CardDescription></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-2">{goals.corridinhaObjective1 && <GoalItem label={goals.corridinhaObjective1} value={formatCurrency(goals.corridinhaPrize1 || 0)} />}{goals.corridinhaObjective2 && <GoalItem label={goals.corridinhaObjective2} value={formatCurrency(goals.corridinhaPrize2 || 0)} />}{goals.corridinhaObjective3 && <GoalItem label={goals.corridinhaObjective3} value={formatCurrency(goals.corridinhaPrize3 || 0)} />}{goals.corridinhaObjective4 && <GoalItem label={goals.corridinhaObjective4} value={formatCurrency(goals.corridinhaPrize4 || 0)} />}</div></CardContent></Card>
                )}
            </div>
        </TabsContent>
        
        <TabsContent value="roleta" className="mt-6">
          <PrizeWheel storeId={storeId} sellerId={seller.id} onSpinResult={handleSpinWin} />
        </TabsContent>

        <TabsContent value="dicas" className="mt-6">
          <TipsTab />
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}
