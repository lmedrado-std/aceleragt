
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

const store1Id = 'supermoda-catu';
const store2Id = 'supermoda-premium';

const initialSellersStore1: Seller[] = [
  { id: 'seller-1-uuid', name: 'Val', avatarId: 'avatar1', vendas: 9250, pa: 1.65, ticketMedio: 188, corridinhaDiaria: 50, password: 'val' },
  { id: 'seller-2-uuid', name: 'Rose', avatarId: 'avatar2', vendas: 8100, pa: 1.55, ticketMedio: 182, corridinhaDiaria: 0, password: 'rose' },
  { id: 'seller-3-uuid', name: 'Thays', avatarId: 'avatar3', vendas: 12500, pa: 2.1, ticketMedio: 205, corridinhaDiaria: 100, password: 'thays' },
  { id: 'seller-4-uuid', name: 'Mercia', avatarId: 'avatar4', vendas: 7500, pa: 1.4, ticketMedio: 170, corridinhaDiaria: 20, password: 'mercia' },
  { id: 'seller-5-uuid', name: 'Joisse', avatarId: 'avatar5', vendas: 10100, pa: 1.95, ticketMedio: 191, corridinhaDiaria: 0, password: 'joisse' },
  { id: 'seller-6-uuid', name: 'Dajila', avatarId: 'avatar6', vendas: 0, pa: 0, ticketMedio: 0, corridinhaDiaria: 0, password: 'dajila' },
];

const initialSellersStore2: Seller[] = [
    { id: 'seller-7-uuid', name: 'Carlos', avatarId: 'avatar7', vendas: 15000, pa: 2.5, ticketMedio: 220, corridinhaDiaria: 150, password: 'carlos' },
    { id: 'seller-8-uuid', name: 'Beatriz', avatarId: 'avatar8', vendas: 9800, pa: 1.8, ticketMedio: 195, corridinhaDiaria: 0, password: 'beatriz' },
];


export function getInitialState(): AppState {
    return {
        stores: [
            { id: store1Id, name: 'SUPERMODA CATU' },
            { id: store2Id, name: 'SUPERMODA PREMIUM' },
        ],
        sellers: {
            [store1Id]: initialSellersStore1,
            [store2Id]: initialSellersStore2,
        },
        goals: {
            'default': defaultGoals,
            [store1Id]: defaultGoals,
            [store2Id]: { ...defaultGoals, metaMinha: 10000, meta: 12000, metona: 15000, metaLendaria: 20000 },
        },
        incentives: {
            [store1Id]: {},
            [store2Id]: {},
        },
    }
}

function mergeWithInitialState(savedState: AppState): AppState {
    const initialState = getInitialState();
    
    // Merge stores
    const savedStoreIds = new Set(savedState.stores.map(s => s.id));
    const storesToMerge = initialState.stores.filter(s => !savedStoreIds.has(s.id));
    if (storesToMerge.length > 0) {
        savedState.stores = [...savedState.stores, ...storesToMerge];
        
        // Add corresponding data for new stores
        for (const store of storesToMerge) {
            if (!savedState.sellers[store.id]) {
                savedState.sellers[store.id] = initialState.sellers[store.id] || [];
            }
            if (!savedState.goals[store.id]) {
                savedState.goals[store.id] = initialState.goals[store.id] || defaultGoals;
            }
            if (!savedState.incentives[store.id]) {
                savedState.incentives[store.id] = initialState.incentives[store.id] || {};
            }
        }
    }
    
    // Ensure all sellers have a password
    Object.keys(savedState.sellers).forEach(storeId => {
      savedState.sellers[storeId].forEach(seller => {
        if (!seller.password) {
          seller.password = seller.name.toLowerCase();
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
            // Basic validation
            if (parsed && parsed.stores && parsed.sellers) {
                // Ensure default stores are present
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
        // Dispatch a custom event to notify other parts of the app
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
