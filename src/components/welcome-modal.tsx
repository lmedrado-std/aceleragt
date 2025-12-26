
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Seller, Goals, Incentives } from '@/lib/storage';
import { Trophy, ArrowRight, Lightbulb, Info } from 'lucide-react';
import { IncentiveProjectionOutput } from '@/ai/flows/incentive-projection';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: Seller;
  goals: Goals;
  incentives: IncentiveProjectionOutput | null;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);

const findNextGoal = (vendas: number, goals: Goals) => {
  if (vendas < (goals.metaMinha || 0))
    return { label: 'Meta 1', value: goals.metaMinha || 0 };
  if (vendas < (goals.meta || 0))
    return { label: 'Meta 2', value: goals.meta || 0 };
  if (vendas < (goals.metona || 0))
    return { label: 'Meta 3', value: goals.metona || 0 };
  if (goals.performanceBonusEnabled && vendas < (goals.metaLendaria || 0))
    return { label: 'Bônus Performance', value: goals.metaLendaria || 0 };
  return null;
};

const getAchievements = (incentives: Incentives | null) => {
  const achievements = [];
  if (!incentives) return achievements;

  if (incentives.meta3Premio > 0)
    achievements.push('Parabéns por atingir a Meta 3!');
  else if (incentives.meta2Premio > 0)
    achievements.push('Você alcançou a Meta 2, excelente!');
  else if (incentives.meta1Premio > 0)
    achievements.push('Meta 1 batida! Continue assim!');

  if (incentives.paBonus > 0)
    achievements.push('Seu P.A. rendeu um bônus. Ótimo trabalho!');
  if (incentives.ticketMedioBonus > 0)
    achievements.push('Bônus de Ticket Médio garantido!');
  if (incentives.legendariaBonus > 0)
    achievements.push('Você entrou na zona de Bônus Performance!');

  return achievements;
};

const getTips = (
  vendas: number,
  pa: number,
  ticketMedio: number,
  goals: Goals
) => {
  const tips = [];
  const nextSalesGoal = findNextGoal(vendas, goals);

  if (nextSalesGoal) {
    tips.push(
      `Faltam ${formatCurrency(
        nextSalesGoal.value - vendas
      )} para a ${nextSalesGoal.label}. Foque em contornar objeções!`
    );
  } else {
    tips.push(
      'Você bateu as metas principais! Explore o upsell para maximizar seus ganhos.'
    );
  }

  if (pa < goals.paGoal1) {
    tips.push(
      'Aumente seu P.A. oferecendo produtos complementares a cada cliente.'
    );
  }
  if (ticketMedio < goals.ticketMedioGoal1) {
    tips.push(
      'Eleve o Ticket Médio sugerindo itens de maior valor ou pacotes.'
    );
  }

  return tips.slice(0, 2); // Retorna no máximo 2 dicas
};

export function WelcomeModal({
  isOpen,
  onClose,
  seller,
  goals,
  incentives,
}: WelcomeModalProps) {
  const achievements = getAchievements(incentives);
  const nextGoal = findNextGoal(seller.vendas, goals);
  const tips = getTips(
    seller.vendas,
    seller.pa,
    seller.ticket_medio,
    goals
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Bem-vindo(a) de volta, {seller.name}!
          </DialogTitle>
          <DialogDescription className="text-center">
            Aqui está um resumo do seu progresso e dicas para acelerar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 my-4">
          {/* Conquistas */}
          {achievements.length > 0 && (
            <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-green-800 dark:text-green-300">
                <Trophy className="h-5 w-5" />
                Conquistas Atuais
              </h3>
              <ul className="list-disc list-inside mt-2 text-sm text-green-700 dark:text-green-200">
                {achievements.map((ach, i) => (
                  <li key={i}>{ach}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Próximo Objetivo */}
          {nextGoal && (
            <div className="p-4 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-blue-800 dark:text-blue-300">
                <ArrowRight className="h-5 w-5" />
                Próximo Objetivo de Vendas
              </h3>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-200">
                Faltam{' '}
                <span className="font-bold">
                  {formatCurrency(nextGoal.value - seller.vendas)}
                </span>{' '}
                para alcançar a{' '}
                <span className="font-bold">{nextGoal.label}</span>. Você consegue!
              </p>
            </div>
          )}

          {/* Dicas Rápidas */}
          {tips.length > 0 && (
            <div className="p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <Lightbulb className="h-5 w-5" />
                Dicas para Acelerar
              </h3>
              <ul className="list-disc list-inside mt-2 text-sm text-amber-700 dark:text-amber-200">
                {tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Continuar para o Painel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
