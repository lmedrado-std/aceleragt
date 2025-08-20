'use server';

/**
 * @fileOverview This file defines a Genkit flow for projecting potential incentives
 * a salesperson can earn based on their current sales performance. It calculates
 * potential rewards for reaching different sales goals (Metinha, Meta, Metona, Legendaria, Corridinha Diaria).
 *
 * - incentiveProjection - A function that triggers the incentive projection flow.
 * - IncentiveProjectionInput - The input type for the incentiveProjection function.
 * - IncentiveProjectionOutput - The return type for the incentiveProjection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IncentiveProjectionInputSchema = z.object({
  vendas: z.number().describe('The current sales amount of the salesperson.'),
  metaMinha: z.number().describe('The Metinha sales goal.'),
  meta: z.number().describe('The Meta sales goal.'),
  metona: z.number().describe('The Metona sales goal.'),
  metaLendaria: z.number().describe('The Legendaria sales goal.'),
  pa: z.number().describe('Products per customer.'),
  paGoal1: z.number().describe('PA Goal 1.'),
  paGoal2: z.number().describe('PA Goal 2.'),
  paGoal3: z.number().describe('PA Goal 3.'),
  paGoal4: z.number().describe('PA Goal 4.'),
  ticketMedio: z.number().describe('Average ticket.'),
  ticketMedioGoal1: z.number().describe('Ticket Medio Goal 1.'),
  ticketMedioGoal2: z.number().describe('Ticket Medio Goal 2.'),
  ticketMedioGoal3: z.number().describe('Ticket Medio Goal 3.'),
  ticketMedioGoal4: z.number().describe('Ticket Medio Goal 4.'),
  corridinhaDiaria: z.number().describe('Daily sales target for Corridinha Diaria.'),
  corridinhaGoal1: z.number().describe('Corridinha Goal 1.'),
  corridinhaGoal2: z.number().describe('Corridinha Goal 2.'),
  corridinhaGoal3: z.number().describe('Corridinha Goal 3.'),
  corridinhaGoal4: z.number().describe('Corridinha Goal 4.'),
});
export type IncentiveProjectionInput = z.infer<typeof IncentiveProjectionInputSchema>;

const IncentiveProjectionOutputSchema = z.object({
  metinhaPremio: z.number().describe('Potential reward for reaching Metinha.'),
  metaPremio: z.number().describe('Potential reward for reaching Meta.'),
  metonaPremio: z.number().describe('Potential reward for reaching Metona.'),
  legendariaBonus: z.number().describe('Potential bonus for reaching Legendaria.'),
  paBonus: z.number().describe('Potential bonus for products per customer.'),
  ticketMedioBonus: z.number().describe('Potential bonus for average ticket.'),
  corridinhaDiariaBonus: z.number().describe('Potential bonus for Corridinha Diaria.'),
});
export type IncentiveProjectionOutput = z.infer<typeof IncentiveProjectionOutputSchema>;

export async function incentiveProjection(input: IncentiveProjectionInput): Promise<IncentiveProjectionOutput> {
  return incentiveProjectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'incentiveProjectionPrompt',
  input: {schema: IncentiveProjectionInputSchema},
  output: {schema: IncentiveProjectionOutputSchema},
  prompt: `You are an expert sales incentive calculator.

  Given the following sales data and goal parameters, calculate the potential incentives for a salesperson.

  Sales Data:
  Current Sales: R$ {{vendas}}

  Sales Goals:
  Metinha: R$ {{metaMinha}} -> Prêmio de R$ 50,00
  Meta: R$ {{meta}} -> Prêmio de R$ 100,00
  Metona: R$ {{metona}} -> Prêmio de R$ 120,00
  Lendaria: R$ {{metaLendaria}} -> Bônus de R$ 50,00 a cada R$ 2.000,00 vendidos acima da Metona (se a meta Lendaria for atingida)

  PA (Produtos por Atendimentos) Goals:
  {{paGoal1}} -> R$ 5,00
  {{paGoal2}} -> R$ 10,00
  {{paGoal3}} -> R$ 15,00
  {{paGoal4}} -> R$ 20,00
  Current PA: {{pa}}

  Ticket Medio Goals:
  R$ {{ticketMedioGoal1}} -> R$ 5,00
  R$ {{ticketMedioGoal2}} -> R$ 10,00
  R$ {{ticketMedioGoal3}} -> R$ 15,00
  R$ {{ticketMedioGoal4}} -> R$ 20,00
  Current Ticket Medio: R$ {{ticketMedio}}

  Corridinha Diaria Goals:
  R$ {{corridinhaGoal1}} -> R$ 5,00
  R$ {{corridinhaGoal2}} -> R$ 10,00
  R$ {{corridinhaGoal3}} -> R$ 15,00
  R$ {{corridinhaGoal4}} -> R$ 20,00
  Current Corridinha Diaria: R$ {{corridinhaDiaria}}

  Calculate the potential incentives based on the current sales data and goal parameters. Return the results in JSON format.
  `,
});

const incentiveProjectionFlow = ai.defineFlow(
  {
    name: 'incentiveProjectionFlow',
    inputSchema: IncentiveProjectionInputSchema,
    outputSchema: IncentiveProjectionOutputSchema,
  },
  async input => {
    let metinhaPremio = 0;
    let metaPremio = 0;
    let metonaPremio = 0;
    let legendariaBonus = 0;
    let paBonus = 0;
    let ticketMedioBonus = 0;
    let corridinhaDiariaBonus = 0;

    if (input.vendas >= input.metaMinha) {
      metinhaPremio = 50;
    }
    if (input.vendas >= input.meta) {
      metaPremio = 100;
    }
    if (input.vendas >= input.metona) {
      metonaPremio = 120;
    }
    if (input.vendas >= input.metaLendaria) {
      legendariaBonus = Math.floor((input.vendas - input.metona) / 2000) * 50;
    }

    if (input.pa >= input.paGoal1) {
      paBonus = 5;
    }
    if (input.pa >= input.paGoal2) {
      paBonus = 10;
    }
     if (input.pa >= input.paGoal3) {
      paBonus = 15;
    }
     if (input.pa >= input.paGoal4) {
      paBonus = 20;
    }

    if (input.ticketMedio >= input.ticketMedioGoal1) {
      ticketMedioBonus = 5;
    }
    if (input.ticketMedio >= input.ticketMedioGoal2) {
      ticketMedioBonus = 10;
    }
    if (input.ticketMedio >= input.ticketMedioGoal3) {
      ticketMedioBonus = 15;
    }
     if (input.ticketMedio >= input.ticketMedioGoal4) {
      ticketMedioBonus = 20;
    }

    if (input.corridinhaDiaria >= input.corridinhaGoal1) {
      corridinhaDiariaBonus = 5;
    }
    if (input.corridinhaDiaria >= input.corridinhaGoal2) {
      corridinhaDiariaBonus = 10;
    }
    if (input.corridinhaDiaria >= input.corridinhaGoal3) {
      corridinhaDiariaBonus = 15;
    }
     if (input.corridinhaDiaria >= input.corridinhaGoal4) {
      corridinhaDiariaBonus = 20;
    }


    return {
      metinhaPremio: metinhaPremio,
      metaPremio: metaPremio,
      metonaPremio: metonaPremio,
      legendariaBonus: legendariaBonus,
      paBonus: paBonus,
      ticketMedioBonus: ticketMedioBonus,
      corridinhaDiariaBonus: corridinhaDiariaBonus,
    };

  }
);
