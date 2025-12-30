
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

const SellerSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarId: z.string(),
  vendas: z.coerce.number().default(0),
  pa: z.coerce.number().default(0),
  ticketMedio: z.coerce.number().default(0),
  corridinhaDiaria: z.coerce.number().default(0),
  password: z.string(),
});

const GoalsSchema = z.object({
  metaMinha: z.coerce.number().default(0),
  meta: z.coerce.number().default(0),
  metona: z.coerce.number().default(0),
  metaLendaria: z.coerce.number().default(0),
  legendariaBonusValorVenda: z.coerce.number().default(0),
  legendariaBonusValorPremio: z.coerce.number().default(0),
  performanceBonusEnabled: z.boolean().optional().default(false),
  metaMinhaPrize: z.coerce.number().default(0),
  metaPrize: z.coerce.number().default(0),
  metonaPrize: z.coerce.number().default(0),
  paGoal1: z.coerce.number().default(0),
  paGoal2: z.coerce.number().default(0),
  paGoal3: z.coerce.number().default(0),
  paGoal4: z.coerce.number().default(0),
  paPrize1: z.coerce.number().default(0),
  paPrize2: z.coerce.number().default(0),
  paPrize3: z.coerce.number().default(0),
  paPrize4: z.coerce.number().default(0),
  ticketMedioGoal1: z.coerce.number().default(0),
  ticketMedioGoal2: z.coerce.number().default(0),
  ticketMedioGoal3: z.coerce.number().default(0),
  ticketMedioGoal4: z.coerce.number().default(0),
  ticketMedioPrize1: z.coerce.number().default(0),
  ticketMedioPrize2: z.coerce.number().default(0),
  ticketMedioPrize3: z.coerce.number().default(0),
  ticketMedioPrize4: z.coerce.number().default(0),
});


const IncentiveProjectionInputSchema = z.object({
  seller: SellerSchema,
  goals: GoalsSchema
});
export type IncentiveProjectionInput = z.infer<typeof IncentiveProjectionInputSchema>;

const IncentiveProjectionOutputSchema = z.object({
  meta1Premio: z.number().describe('Potential reward for reaching Meta 1.'),
  meta2Premio: z.number().describe('Potential reward for reaching Meta 2.'),
  meta3Premio: z.number().describe('Potential reward for reaching Meta 3.'),
  legendariaBonus: z.number().describe('Potential bonus for reaching Bônus Performance.'),
  paBonus: z.number().describe('Potential bonus for products per customer.'),
  ticketMedioBonus: z.number().describe('Potential bonus for average ticket.'),
  corridinhaDiariaBonus: z.number().describe('Potential bonus for Corridinha Diaria.'),
});
export type IncentiveProjectionOutput = z.infer<typeof IncentiveProjectionOutputSchema>;

// Wrapper function to sanitize data before calling the flow
export async function incentiveProjection(input: IncentiveProjectionInput): Promise<IncentiveProjectionOutput> {
  // Sanitize goals to prevent runtime errors with null/undefined values
  const sanitizedGoals = GoalsSchema.parse(input.goals);
  const sanitizedSeller = SellerSchema.parse(input.seller);

  const safeInput = {
    ...input,
    goals: sanitizedGoals,
    seller: sanitizedSeller,
  };
  
  return incentiveProjectionFlow(safeInput);
}

const incentiveProjectionFlow = ai.defineFlow(
  {
    name: 'incentiveProjectionFlow',
    inputSchema: IncentiveProjectionInputSchema,
    outputSchema: IncentiveProjectionOutputSchema,
  },
  async ({ seller, goals }) => {
    let meta1Premio = 0;
    let meta2Premio = 0;
    let meta3Premio = 0;
    let legendariaBonus = 0;
    let paBonus = 0;
    let ticketMedioBonus = 0;

    // Data is now guaranteed to be clean by the wrapper function
    const { vendas, pa, ticketMedio, corridinhaDiaria } = seller;
    
    // Calculate sales prize based on highest achieved tier
    if (vendas >= goals.metona) {
      meta3Premio = goals.metonaPrize;
    } else if (vendas >= goals.meta) {
      meta2Premio = goals.metaPrize;
    } else if (vendas >= goals.metaMinha) {
      meta1Premio = goals.metaMinhaPrize;
    }
    
    // Calculate performance bonus
    if (goals.performanceBonusEnabled && vendas >= goals.metaLendaria && goals.legendariaBonusValorVenda > 0) {
      const bonusIntervals = Math.floor((vendas - goals.metaLendaria) / goals.legendariaBonusValorVenda);
      legendariaBonus = bonusIntervals * goals.legendariaBonusValorPremio;
    }

    // PA Bonus
    if (pa >= goals.paGoal4 && goals.paGoal4 > 0) paBonus = goals.paPrize4;
    else if (pa >= goals.paGoal3 && goals.paGoal3 > 0) paBonus = goals.paPrize3;
    else if (pa >= goals.paGoal2 && goals.paGoal2 > 0) paBonus = goals.paPrize2;
    else if (pa >= goals.paGoal1 && goals.paGoal1 > 0) paBonus = goals.paPrize1;

    // Ticket Médio Bonus
    if (ticketMedio >= goals.ticketMedioGoal4 && goals.ticketMedioGoal4 > 0) ticketMedioBonus = goals.ticketMedioPrize4;
    else if (ticketMedio >= goals.ticketMedioGoal3 && goals.ticketMedioGoal3 > 0) ticketMedioBonus = goals.ticketMedioPrize3;
    else if (ticketMedio >= goals.ticketMedioGoal2 && goals.ticketMedioGoal2 > 0) ticketMedioBonus = goals.ticketMedioPrize2;
    else if (ticketMedio >= goals.ticketMedioGoal1 && goals.ticketMedioGoal1 > 0) ticketMedioBonus = goals.ticketMedioPrize1;

    return {
      meta1Premio,
      meta2Premio,
      meta3Premio,
      legendariaBonus,
      paBonus,
      ticketMedioBonus,
      corridinhaDiariaBonus: corridinhaDiaria,
    };
  }
);
