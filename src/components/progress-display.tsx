
"use client";

import type { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";
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
  Award,
  Target,
  Rocket,
  Trophy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Goals, Seller } from "@/lib/storage";


type ProgressDisplaySalesData = Partial<Seller> & {
    goals: Goals;
};

interface ProgressDisplayProps {
  salesData: ProgressDisplaySalesData;
  incentives: IncentiveProjectionOutput | null;
  rankings: Record<string, number> | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

const ProgressItem = ({
  icon,
  title,
  currentValue,
  goalValue,
  formatValue = (v) => v.toString(),
}: {
  icon?: React.ReactNode;
  title: string;
  currentValue: number;
  goalValue: number;
  formatValue?: (value: number) => string;
}) => {
  const percentage = goalValue > 0 ? Math.min((Number(currentValue) / goalValue) * 100, 100) : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{title}</span>
        </div>
        <div className="font-semibold flex items-center gap-1 text-sm">
          <span>
            {formatValue(Number(currentValue))} / {formatValue(goalValue)}
          </span>
        </div>
      </div>
       <Progress value={percentage} />
    </div>
  );
};

const MetricCard = ({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const GoalDetail = ({ label, prize, achieved }: { label: string, prize: number, achieved: boolean }) => (
     <div className={cn("flex justify-between items-center p-3 rounded-lg", achieved ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" : "bg-muted/50")}>
        <p className="font-medium">{label}</p>
        <p className={cn("font-bold text-lg", achieved ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>{formatCurrency(prize)}</p>
    </div>
)

const TargetGoalItem = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground">{value}</p>
    </div>
);

const GoldMedal = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 13.5L6 18H18L15 13.5" fill="#FFC700"/>
        <path d="M9 13.5L6 18H18L15 13.5" stroke="#E6B300" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="9" r="5" fill="#FFD700" stroke="#E6B300" strokeWidth="1.5"/>
        <path d="M12 9L11 8L12 11L13 8L12 9Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 12L6 6" fill="#D20000"/>
        <path d="M16 12L18 6" fill="#D20000"/>
        <path d="M8 12L6 6" stroke="#C00" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M16 12L18 6" stroke="#C00" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
)

const SilverMedal = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 13.5L6 18H18L15 13.5" fill="#C0C0C0" stroke="#A9A9A9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="9" r="5" fill="#D3D3D3" stroke="#A9A9A9" strokeWidth="1.5"/>
        <path d="M12 9L11 8L12 11L13 8L12 9Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 12L6 6" fill="#005B96"/>
        <path d="M16 12L18 6" fill="#005B96"/>
        <path d="M8 12L6 6" stroke="#004080" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M16 12L18 6" stroke="#004080" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
)

const BronzeMedal = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 13.5L6 18H18L15 13.5" fill="#CD7F32" stroke="#B8732E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="9" r="5" fill="#D28C3A" stroke="#B8732E" strokeWidth="1.5"/>
        <path d="M12 9L11 8L12 11L13 8L12 9Z" fill="white" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8 12L6 6" fill="#A52A2A"/>
        <path d="M16 12L18 6" fill="#A52A2A"/>
        <path d="M8 12L6 6" stroke="#8B0000" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M16 12L18 6" stroke="#8B0000" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
)
const RankingBadge = ({ rank }: { rank: number | undefined }) => {
    if (!rank || rank <= 0) return null;

    let Medal = null;
    if (rank === 1) Medal = GoldMedal;
    if (rank === 2) Medal = SilverMedal;
    if (rank === 3) Medal = BronzeMedal;

    return (
        <div className={cn("flex items-center justify-center gap-4 rounded-lg px-4 py-2 bg-primary/90 text-primary-foreground shadow-md")}>
            <Trophy className="h-8 w-8" />
            <div className="text-center">
                <p className="font-bold text-lg">{rank}º Lugar em Vendas</p>
                {Medal && <div className="flex justify-center"><Medal/></div>}
            </div>
        </div>
    );
};


export function ProgressDisplay({ salesData, incentives, rankings }: ProgressDisplayProps) {
  const {
    name = "Vendedor",
    vendas = 0,
    pa = 0,
    ticketMedio = 0,
    corridinhaDiaria = 0,
    goals,
  } = salesData;
  
  if (!goals) {
    return <div className="p-4">Carregando metas...</div>;
  }

  const totalIncentives = incentives
    ? Object.values(incentives).reduce((sum, val) => sum + (val || 0), 0)
    : 0;

  const salesRank = rankings?.vendas;
  
  let rankMedal = "";
  let rankMessage = "";

  if (salesRank && salesRank > 0) {
      if (salesRank === 1) {
          rankMedal = "🥇";
          rankMessage = `Parabéns, ${name}! Você está em 1º lugar, liderando com excelência!`;
      } else if (salesRank === 2) {
          rankMedal = "🥈";
          rankMessage = `Mandou bem, ${name}! Você está no 2º lugar, continue assim!`;
      } else if (salesRank === 3) {
          rankMedal = "🥉";
          rankMessage = `Muito bom, ${name}! Você conquistou o 3º lugar, bora buscar o topo!`;
      } else {
          rankMessage = `Bora subir, ${name}! Continue se esforçando, o pódio te espera!`;
      }
  }


  return (
    <div className="space-y-6">
       <Card className="col-span-1 md:col-span-2 lg:col-span-4 bg-primary text-primary-foreground">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <p className="text-sm font-semibold text-primary-foreground/80">Ganho Total Projetado</p>
                        <p className="text-3xl font-bold">{formatCurrency(totalIncentives)}</p>
                    </div>
                </div>
                {salesRank && salesRank > 0 && (
                     <div className="text-right">
                        <div className="flex items-center justify-end gap-2 font-bold">
                            <Trophy className="h-5 w-5" />
                            <span>{salesRank}º Lugar em Vendas</span>
                        </div>
                        {rankMessage && <p className="text-sm text-primary-foreground/80 mt-1">{rankMedal} {rankMessage}</p>}
                    </div>
                )}
            </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard 
                title="Vendas Realizadas" 
                value={formatCurrency(vendas)} 
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                description="Total vendido no período"
            />
             <MetricCard 
                title="Produtos por Atendimento (PA)"
                value={String(Number(pa || 0).toFixed(2))}
                icon={<Package className="h-4 w-4 text-muted-foreground" />}
                 description="Média de itens por venda"
            />
            <MetricCard 
                title="Ticket Médio" 
                value={formatCurrency(ticketMedio)} 
                icon={<Ticket className="h-4 w-4 text-muted-foreground" />}
                description="Valor médio por venda"
            />
            <MetricCard 
                title="Bônus Corridinha" 
                value={formatCurrency(corridinhaDiaria)} 
                icon={<Rocket className="h-4 w-4 text-muted-foreground" />}
                description="Bônus diário direto"
            />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
                <CardHeader>
                     <CardTitle className="text-xl">Progresso das Metas</CardTitle>
                    <CardDescription>Veja o quão perto você está de bater suas metas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <ProgressItem title="Meta de Vendas" currentValue={vendas} goalValue={goals.metona} formatValue={formatCurrency}/>
                    </div>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                         <ProgressItem title="Meta PA" currentValue={pa || 0} goalValue={goals.paGoal4} formatValue={(v) => Number(v || 0).toFixed(2)}/>
                         <ProgressItem title="Meta Ticket Médio" currentValue={ticketMedio || 0} goalValue={goals.ticketMedioGoal4} formatValue={formatCurrency}/>
                    </div>
                </CardContent>
            </Card>
             <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Target /> Suas Metas
                    </CardTitle>
                    <CardDescription>Valores a serem alcançados para os prêmios.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <h4 className="font-semibold mb-2 text-sm">Metas de Vendas</h4>
                        <div className="space-y-2 text-sm">
                            <TargetGoalItem label="Metinha" value={formatCurrency(goals.metaMinha)} />
                            <TargetGoalItem label="Meta" value={formatCurrency(goals.meta)} />
                            <TargetGoalItem label="Metona" value={formatCurrency(goals.metona)} />
                            <TargetGoalItem label="Lendária" value={formatCurrency(goals.metaLendaria)} />
                        </div>
                    </div>
                    <Separator />
                     <div>
                        <h4 className="font-semibold mb-2 text-sm">Metas de PA</h4>
                         <div className="space-y-2 text-sm">
                            <TargetGoalItem label="Nível 1" value={Number(goals.paGoal1).toFixed(2)} />
                            <TargetGoalItem label="Nível 2" value={Number(goals.paGoal2).toFixed(2)} />
                            <TargetGoalItem label="Nível 3" value={Number(goals.paGoal3).toFixed(2)} />
                            <TargetGoalItem label="Nível 4" value={Number(goals.paGoal4).toFixed(2)} />
                        </div>
                    </div>
                     <Separator />
                     <div>
                        <h4 className="font-semibold mb-2 text-sm">Metas de Ticket Médio</h4>
                         <div className="space-y-2 text-sm">
                            <TargetGoalItem label="Nível 1" value={formatCurrency(goals.ticketMedioGoal1)} />
                            <TargetGoalItem label="Nível 2" value={formatCurrency(goals.ticketMedioGoal2)} />
                            <TargetGoalItem label="Nível 3" value={formatCurrency(goals.ticketMedioGoal3)} />
                            <TargetGoalItem label="Nível 4" value={formatCurrency(goals.ticketMedioGoal4)} />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="lg:col-span-1">
                <CardHeader>
                     <CardTitle className="text-xl">Resumo de Ganhos</CardTitle>
                    <CardDescription>Seus prêmios e bônus detalhados.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <GoalDetail label="Prêmio Metinha" prize={incentives?.metinhaPremio || 0} achieved={(incentives?.metinhaPremio || 0) > 0} />
                    <GoalDetail label="Prêmio Meta" prize={incentives?.metaPremio || 0} achieved={(incentives?.metaPremio || 0) > 0} />
                    <GoalDetail label="Prêmio Metona" prize={incentives?.metonaPremio || 0} achieved={(incentives?.metonaPremio || 0) > 0} />
                    <GoalDetail label="Bônus Lendária" prize={incentives?.legendariaBonus || 0} achieved={(incentives?.legendariaBonus || 0) > 0} />
                    <Separator/>
                    <GoalDetail label="Bônus PA" prize={incentives?.paBonus || 0} achieved={(incentives?.paBonus || 0) > 0} />
                    <GoalDetail label="Bônus Ticket Médio" prize={incentives?.ticketMedioBonus || 0} achieved={(incentives?.ticketMedioBonus || 0) > 0} />
                    <GoalDetail label="Bônus Corridinha" prize={incentives?.corridinhaDiariaBonus || 0} achieved={(incentives?.corridinhaDiariaBonus || 0) > 0} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

