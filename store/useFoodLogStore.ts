import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type StagedItem = {
  id: string;
  name: string;
  brand: string;
  serving_size?: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  quantity: number;
};

const STORE_KEY = "@fasttrack_food_log_staging";

type FoodLogState = {
  stagedItems: StagedItem[];
  selectedMealType: "breakfast" | "lunch" | "dinner" | "snack";
  stagedDate: string;
  loaded: boolean;
  setSelectedMealType: (type: "breakfast" | "lunch" | "dinner" | "snack") => void;
  setStagedDate: (date: Date) => void;
  addItem: (item: Omit<StagedItem, "id">) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItem: (id: string, updates: Partial<Omit<StagedItem, "id">>) => void;
  clearStaged: () => void;
  loadFromStorage: () => Promise<void>;
};

const persist = (state: Partial<FoodLogState>) => {
  try {
    AsyncStorage.setItem(STORE_KEY, JSON.stringify({
      stagedItems: state.stagedItems ?? [],
      selectedMealType: state.selectedMealType ?? "breakfast",
      stagedDate: state.stagedDate ?? new Date().toISOString(),
    }));
  } catch {}
};

export const useFoodLogStore = create<FoodLogState>((set, get) => ({
  stagedItems: [],
  selectedMealType: "breakfast",
  stagedDate: new Date().toISOString(),
  loaded: false,

  loadFromStorage: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          stagedItems: parsed.stagedItems ?? [],
          selectedMealType: parsed.selectedMealType ?? "breakfast",
          stagedDate: parsed.stagedDate ?? new Date().toISOString(),
          loaded: true,
        });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  setSelectedMealType: (type) => {
    set({ selectedMealType: type });
    persist(get());
  },
  setStagedDate: (date) => {
    set({ stagedDate: date.toISOString() });
    persist(get());
  },
  addItem: (item) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    set((state) => ({
      stagedItems: [...state.stagedItems, { id, ...item }],
    }));
    persist(get());
  },
  removeItem: (id) => {
    set((state) => ({
      stagedItems: state.stagedItems.filter((i) => i.id !== id),
    }));
    persist(get());
  },
  updateItemQuantity: (id, quantity) => {
    set((state) => ({
      stagedItems: state.stagedItems.map((i) =>
        i.id === id ? { ...i, quantity } : i
      ),
    }));
    persist(get());
  },
  updateItem: (id: string, updates: Partial<Omit<StagedItem, "id">>) => {
    set((state) => ({
      stagedItems: state.stagedItems.map((i) =>
        i.id === id ? { ...i, ...updates } : i
      ),
    }));
    persist(get());
  },
  clearStaged: () => {
    set({ stagedItems: [], selectedMealType: "breakfast", stagedDate: new Date().toISOString() });
    AsyncStorage.removeItem(STORE_KEY);
  },
}));
