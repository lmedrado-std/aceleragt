
import { IncentiveProjectionOutput } from "@/ai/flows/incentive-projection";

const LOCAL_STORAGE_KEY = "goalGetterState_v2";

export interface Seller {
  id: string;
  name: string;
  avatarId: string;
  vendas: number;
  pa: number;
  ticketMedio: number;
  corridinhaDiaria: number;
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

const initialSellers: Seller[] = [
  { id: '1', name: 'Val', avatarId: 'avatar1', vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0 },
  { id: '2', name: 'Rose', avatarId: 'avatar2', vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0 },
  { id: '3', name: 'Thays', avatarId: 'avatar3', vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0 },
  { id: '4', name: 'Mercia', avatarId: 'avatar4', vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0 },
  { id: '5', name: 'Joisse', avatarId: 'avatar5', vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0 },
  { id: '6', name: 'Dajila', avatarId: 'avatar6', vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0 },
];

const initialStore: Store = { id: 'supermoda-catu', name: 'SUPERMODA CATU'};

export function getInitialState(): AppState {
    return {
        stores: [initialStore],
        sellers: {
            [initialStore.id]: initialSellers
        },
        goals: {
            'default': defaultGoals,
            [initialStore.id]: defaultGoals
        },
        incentives: {
            [initialStore.id]: {}
        },
    }
}

function migrateV1State(v1State: any): AppState {
    const initialState = getInitialState();
    const storeId = initialState.stores[0].id;

    if (v1State && v1State.sellers) {
        initialState.sellers[storeId] = v1State.sellers;
    }
    
    const goals: Partial<Goals> = {};
    for (const key in defaultGoals) {
        if (v1State && typeof v1State[key] === 'number') {
            (goals as any)[key] = v1State[key];
        } else {
            (goals as any)[key] = (defaultGoals as any)[key];
        }
    }
    initialState.goals[storeId] = goals as Goals;

    // v1 did not store incentives, so it starts empty.
    initialState.incentives[storeId] = {};
    
    return initialState;
}


export function loadState(): AppState {
    if (typeof window === 'undefined') {
        return getInitialState();
    }
    try {
        const v1StateRaw = localStorage.getItem("goalGetterState");
        const v2StateRaw = localStorage.getItem(LOCAL_STORAGE_KEY);

        if (v2StateRaw) {
            const parsed = JSON.parse(v2StateRaw);
            // Basic validation
            if (parsed && parsed.stores && parsed.sellers) {
                return parsed;
            }
        }
        
        if (v1StateRaw) {
            const parsedV1 = JSON.parse(v1StateRaw);
            const migratedState = migrateV1State(parsedV1);
            saveState(migratedState); // Save migrated state to v2 key
            localStorage.removeItem("goalGetterState"); // Remove old state
            return migratedState;
        }

        return getInitialState();
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
    } catch (error) {
        console.error("Could not save state to localStorage", error);
    }
}
