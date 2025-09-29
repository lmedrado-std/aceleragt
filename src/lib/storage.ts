
import { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";

export interface Seller {
  id: string;
  name: string;
  avatar_id: string;
  store_id: string;
  vendas: number;
  pa: number;
  ticket_medio: number;
  corridinha_diaria: number;
  password?: string;
  last_viewed_at?: string | null;
  view_count?: number | null;
}

export interface Goals {
  metaMinha: number;
  meta: number;
  metona: number;
  metaLendaria: number;
  legendariaBonusValorVenda: number;
  legendariaBonusValorPremio: number;
  performanceBonusEnabled?: boolean;
  metaMinhaPrize: number;
  metaPrize: number;
  metonaPrize: number;
  paGoal1: number;
  paGoal2: number;
  paGoal3: number;
  paGoal4: number;
  paPrize1: number;
  paPrize2: number;
  paPrize3: number;
  paPrize4: number;
  ticketMedioGoal1: number;
  ticketMedioGoal2: number;
  ticketMedioGoal3: number;
  ticketMedioGoal4: number;
  ticketMedioPrize1: number;
  ticketMedioPrize2: number;
  ticketMedioPrize3: number;
  ticketMedioPrize4: number;
}

export type Incentives = Record<string, IncentiveProjectionOutput | null>;

export interface Store {
    id: string;
    name: string;
    password?: string | null;
    theme_color: string | null;
    last_incentive_calculation: string | null;
}

export interface AppState {
    stores: Store[];
    sellers: Record<string, Seller[]>;
    goals: Record<string, Goals>;
    incentives: Record<string, Incentives>;
}
