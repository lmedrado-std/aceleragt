
import { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";

const ADMIN_PASSWORD_KEY = "goalGetterAdminPassword";
const DEFAULT_ADMIN_PASSWORD = "supermoda";


export interface Seller {
  id: string;
  name: string;
  avatar_id: string;
  vendas: number;
  pa: number;
  ticket_medio: number; 
  corridinha_diaria: number; 
  password?: string;
  store_id: string;
}

export interface Goals {
  id?: string;
  store_id: string;
  metaMinha: number;
  meta: number;
  metona: number;
  metaLendaria: number;
  legendariaBonusValorVenda: number;
  legendariaBonusValorPremio: number;
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
    theme_color: string;
}

export function getAdminPassword(): string {
    if (typeof window === 'undefined') {
        return DEFAULT_ADMIN_PASSWORD;
    }
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
}

export function setAdminPassword(password: string) {
     if (typeof window === 'undefined') {
        return;
    }
    localStorage.setItem(ADMIN_PASSWORD_KEY, password);
}
