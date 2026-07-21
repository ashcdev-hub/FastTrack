import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MyMeal, MyMealItem } from "@/lib/types";
import { useConnectivity } from "@/hooks/useConnectivity";
import { withOfflineFallback } from "@/lib/offline-mutation";

function toMealWithItems(meal: any, items: any[]): MyMeal {
  return {
    ...meal,
    calories: undefined,
    protein_g: undefined,
    carbs_g: undefined,
    fat_g: undefined,
    items: (items ?? [])
      .filter((i: any) => i.meal_id === meal.id)
      .map((i: any) => ({
        ...i,
        calories: Number(i.calories),
        protein_g: i.protein_g != null ? Number(i.protein_g) : null,
        carbs_g: i.carbs_g != null ? Number(i.carbs_g) : null,
        fat_g: i.fat_g != null ? Number(i.fat_g) : null,
      })),
  };
}

export function useMyMeals(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { isOffline } = useConnectivity();

  const { data: meals = [], isLoading: loading } = useQuery({
    queryKey: ["my_meals", userId],
    queryFn: async (): Promise<MyMeal[]> => {
      if (!userId) return [];

      const { data: mealData, error: mealError } = await supabase
        .from("my_meals")
        .select("*")
        .eq("user_id", userId)
        .order("last_used_at", { ascending: false, nullsFirst: false })
        .order("use_count", { ascending: false })
        .order("name", { ascending: true });

      if (mealError) {
        console.error("Error fetching my meals:", mealError);
        return [];
      }

      const mealIds = (mealData ?? []).map((m: any) => m.id);
      if (mealIds.length === 0) return [];

      const { data: itemsData, error: itemsError } = await supabase
        .from("my_meal_items")
        .select("*")
        .in("meal_id", mealIds)
        .order("sort_order", { ascending: true });

      if (itemsError) {
        console.error("Error fetching my meal items:", itemsError);
        return (mealData ?? []).map((m: any) => toMealWithItems(m, []));
      }

      return (mealData ?? []).map((m: any) => toMealWithItems(m, itemsData ?? []));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const addMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string | null;
      items: Omit<MyMealItem, "id" | "meal_id" | "sort_order">[];
    }) => {
      if (!userId) throw new Error("No user");
      return withOfflineFallback(
        async () => {
          const { data: meal, error: mealError } = await supabase
            .from("my_meals")
            .insert({
              user_id: userId,
              name: payload.name,
              description: payload.description ?? null,
            })
            .select()
            .single();
          if (mealError) throw mealError;

          if (payload.items.length > 0) {
            const { error: itemsError } = await supabase
              .from("my_meal_items")
              .insert(
                payload.items.map((item, idx) => ({
                  meal_id: meal.id,
                  name: item.name,
                  brand: item.brand ?? null,
                  serving_size: item.serving_size ?? null,
                  calories: item.calories,
                  protein_g: item.protein_g,
                  carbs_g: item.carbs_g,
                  fat_g: item.fat_g,
                  sort_order: idx,
                }))
              );
            if (itemsError) throw itemsError;
          }

          return meal as MyMeal;
        },
        "my_meals",
        "insert",
        payload,
        isOffline,
      );
    },
    onSuccess: (data, variables) => {
      if (!data) return;
      queryClient.setQueryData<MyMeal[]>(["my_meals", userId], (old) => [
        {
          ...data,
          items: variables.items.map((item, idx) => ({
            id: "",
            meal_id: data.id,
            name: item.name,
            brand: item.brand ?? null,
            serving_size: item.serving_size ?? null,
            calories: item.calories,
            protein_g: item.protein_g,
            carbs_g: item.carbs_g,
            fat_g: item.fat_g,
            sort_order: idx,
          })),
        },
        ...(old ?? []),
      ]);
    },
    onError: (e) => console.error("[Mutation] addMyMeal failed:", e),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, description, items, use_count, last_used_at }: {
      id: string;
      name?: string;
      description?: string | null;
      items?: Omit<MyMealItem, "id" | "meal_id" | "sort_order">[];
      use_count?: number;
      last_used_at?: string | null;
    }) => {
      return withOfflineFallback(
        async () => {
          const updates: Record<string, any> = {};
          if (name !== undefined) updates.name = name;
          if (description !== undefined) updates.description = description;
          if (use_count !== undefined) updates.use_count = use_count;
          if (last_used_at !== undefined) updates.last_used_at = last_used_at;
          if (Object.keys(updates).length > 0) {
            const { error } = await supabase.from("my_meals").update(updates).eq("id", id);
            if (error) throw error;
          }

          if (items !== undefined) {
            const { error: delError } = await supabase.from("my_meal_items").delete().eq("meal_id", id);
            if (delError) throw delError;

            if (items.length > 0) {
              const { error: insError } = await supabase.from("my_meal_items").insert(
                items.map((item, idx) => ({
                  meal_id: id,
                  name: item.name,
                  brand: item.brand ?? null,
                  serving_size: item.serving_size ?? null,
                  calories: item.calories,
                  protein_g: item.protein_g,
                  carbs_g: item.carbs_g,
                  fat_g: item.fat_g,
                  sort_order: idx,
                }))
              );
              if (insError) throw insError;
            }
          }

          return { id, name, description, items, use_count, last_used_at };
        },
        "my_meals",
        "update",
        { id, name, description, items },
        isOffline,
      );
    },
    onSuccess: (_data, { id, name, description, items, use_count, last_used_at }) => {
      queryClient.setQueryData<MyMeal[]>(["my_meals", userId], (old) =>
        (old ?? []).map((m) =>
          m.id === id
            ? {
                ...m,
                ...(name !== undefined ? { name } : {}),
                ...(description !== undefined ? { description } : {}),
                ...(use_count !== undefined ? { use_count } : {}),
                ...(last_used_at !== undefined ? { last_used_at } : {}),
                ...(items !== undefined
                  ? {
                      items: items.map((item, idx) => ({
                        ...item,
                        id: "",
                        meal_id: id,
                        sort_order: idx,
                      })),
                    }
                  : {}),
              }
            : m
        )
      );
    },
    onError: (e) => console.error("[Mutation] updateMyMeal failed:", e),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return withOfflineFallback(
        async () => {
          const { error } = await supabase.from("my_meals").delete().eq("id", id);
          if (error) throw error;
          return id;
        },
        "my_meals",
        "delete",
        { id },
        isOffline,
      );
    },
    onSuccess: (id) => {
      if (!id) return;
      queryClient.setQueryData<MyMeal[]>(["my_meals", userId], (old) =>
        (old ?? []).filter((m) => m.id !== id)
      );
    },
    onError: (e) => console.error("[Mutation] deleteMyMeal failed:", e),
  });

  const addMyMeal = async (
    name: string,
    items: Omit<MyMealItem, "id" | "meal_id" | "sort_order">[],
    description?: string | null,
  ) => {
    try {
      const data = await addMutation.mutateAsync({ name, description, items });
      return { error: null, data };
    } catch (error) {
      return { error };
    }
  };

  const updateMyMeal = async (id: string, updates: { name?: string; description?: string | null; items?: Omit<MyMealItem, "id" | "meal_id" | "sort_order">[] }) => {
    try {
      await updateMutation.mutateAsync({ id, ...updates });
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const deleteMyMeal = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const bumpUsage = async (id: string) => {
    const meal = meals.find((m) => m.id === id);
    if (!meal) return;
    await updateMutation.mutateAsync({
      id,
      use_count: (meal.use_count ?? 0) + 1,
      last_used_at: new Date().toISOString(),
    });
  };

  return {
    meals,
    loading,
    addMyMeal,
    updateMyMeal,
    deleteMyMeal,
    bumpUsage,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["my_meals", userId] }),
  };
}
