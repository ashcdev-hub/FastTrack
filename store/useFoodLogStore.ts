import { create } from "zustand";

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

type FoodLogState = {
  stagedItems: StagedItem[];
  selectedMealType: "breakfast" | "lunch" | "dinner" | "snack";
  stagedDate: Date;
  setSelectedMealType: (type: "breakfast" | "lunch" | "dinner" | "snack") => void;
  setStagedDate: (date: Date) => void;
  addItem: (item: Omit<StagedItem, "id">) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  clearStaged: () => void;
};

export const useFoodLogStore = create<FoodLogState>((set) => ({
  stagedItems: [],
  selectedMealType: "breakfast",
  stagedDate: new Date(),
  setSelectedMealType: (type) => set({ selectedMealType: type }),
  setStagedDate: (date) => set({ stagedDate: date }),
  addItem: (item) =>
    set((state) => ({
      stagedItems: [
        ...state.stagedItems,
        { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), ...item },
      ],
    })),
  removeItem: (id) =>
    set((state) => ({
      stagedItems: state.stagedItems.filter((i) => i.id !== id),
    })),
  updateItemQuantity: (id, quantity) =>
    set((state) => ({
      stagedItems: state.stagedItems.map((i) =>
        i.id === id ? { ...i, quantity } : i
      ),
    })),
  clearStaged: () => set({ stagedItems: [] }),
}));
