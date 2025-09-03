import { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";

const LOCAL_STORAGE_KEY = "goalGetterState_v2";
const ADMIN_PASSWORD_KEY = "goalGetterAdminPassword";
const DEFAULT_ADMIN_PASSWORD = "supermoda";


export interface Seller {
  id: string;
  name: string;
  avatarId: string;
  vendas: number;
  pa: number;
  ticketMedio: number;
  corridinhaDiaria: number;
  password?: string;
}

export interface Goals {
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
    themeColor: string;
}

export interface AppState {
    stores: Store[];
    sellers: Record<string, Seller[]>;
    goals: Record<string, Goals>;
    incentives: Record<string, Incentives>;
}

const defaultGoals: Goals = {
  metaMinha: 8000,
  meta: 9000,
  metona: 10000,
  metaLendaria: 12000,
  legendariaBonusValorVenda: 2000,
  legendariaBonusValorPremio: 50,
  metaMinhaPrize: 50,
  metaPrize: 100,
  metonaPrize: 120,
  paGoal1: 1.5,
  paGoal2: 1.6,
  paGoal3: 1.9,
  paGoal4: 2.0,
  paPrize1: 5,
  paPrize2: 10,
  paPrize3: 15,
  paPrize4: 20,
  ticketMedioGoal1: 180,
  ticketMedioGoal2: 185,
  ticketMedioGoal3: 190,
  ticketMedioGoal4: 200,
  ticketMedioPrize1: 5,
  ticketMedioPrize2: 10,
  ticketMedioPrize3: 15,
  ticketMedioPrize4: 20,
};


export function getInitialState(): AppState {
    const store1Id = 'minha-primeira-loja';
    return {
        stores: [
            { id: store1Id, name: 'Minha Loja', themeColor: '217.2 32.6% 17.5%' },
        ],
        sellers: {
            [store1Id]: [],
        },
        goals: {
            'default': defaultGoals,
            [store1Id]: defaultGoals,
        },
        incentives: {
            [store1Id]: {},
        },
    }
}

function mergeWithInitialState(savedState: AppState): AppState {
    const initialState = getInitialState();
    
    if (!savedState.stores || savedState.stores.length === 0) {
        return initialState;
    }
    
    savedState.stores.forEach(store => {
      if (!store.themeColor) {
        store.themeColor = '217.2 32.6% 17.5%'; 
      }
      if (!savedState.sellers[store.id]) {
        savedState.sellers[store.id] = [];
      }
      if (!savedState.goals[store.id]) {
        savedState.goals[store.id] = defaultGoals;
      }
      if (!savedState.incentives[store.id]) {
        savedState.incentives[store.id] = {};
      }
    });

    Object.keys(savedState.sellers).forEach(storeId => {
      savedState.sellers[storeId].forEach(seller => {
        if (!seller.password) {
          seller.password = seller.name.toLowerCase();
        }
         if (!seller.avatarId) {
          seller.avatarId = `avatar${(Math.floor(Math.random() * 10) + 1)}`;
        }
      });
    });

    return savedState;
}


export function loadState(): AppState {
    if (typeof window === 'undefined') {
        return getInitialState();
    }
    try {
        const v2StateRaw = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (v2StateRaw) {
            const parsed = JSON.parse(v2StateRaw) as AppState;
            if (parsed && parsed.stores && parsed.sellers) {
                return mergeWithInitialState(parsed);
            }
        }
        
        const initialState = getInitialState();
        saveState(initialState);
        return initialState;

    } catch (error) {
        console.error("Could not load state from localStorage", error);
        return getInitialState();
    }
}

export function saveState(state: AppState) {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
        window.dispatchEvent(new CustomEvent('storage_updated'));
    } catch (error) {
        console.error("Could not save state to localStorage", error);
    }
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

    