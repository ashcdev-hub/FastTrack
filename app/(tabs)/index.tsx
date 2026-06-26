import React, { useEffect, useState } from "react";
import { Pressable, View, Text, TextInput, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { useFastingSession } from "@/hooks/useFastingSession";
import { useFastingStore } from "@/store/useFastingStore";
import { useWorkoutGoals } from "@/hooks/useWorkoutGoals";
import { useWorkoutLog } from "@/hooks/useWorkoutLog";
import { useWaterLog } from "@/hooks/useWaterLog";
import { useFoodLog } from "@/hooks/useFoodLog";
import { useGoalStore } from "@/store/useGoalStore";
import { useProfile } from "@/hooks/useProfile";
import { ProgressRing } from "@/components/ProgressRing";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { format, addHours } from "date-fns";
import { router } from "expo-router";

function useElapsedMinutes(startTime: string | null) {
  const [totalMinutes, setTotalMinutes] = useState(0);
  useEffect(() => {
    if (!startTime) { setTotalMinutes(0); return; }
    const tick = () => {
      const diff = Date.now() - new Date(startTime).getTime();
      setTotalMinutes(Math.max(0, Math.floor(diff / 60000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  return totalMinutes;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { session } = useFastingSession(user?.id);
  const { fastingHours, eatingHours } = useFastingStore();
  const { profile } = useProfile(user?.id ?? null);
  const { goals: workoutGoals } = useWorkoutGoals(user?.id);
  const { todayTotals } = useWorkoutLog(user?.id, profile?.weight_kg ?? null);
  const { totalMl, addWater } = useWaterLog(user?.id);
  const { totals } = useFoodLog(user?.id);
  const goals = useGoalStore();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  const phase = !session ? "idle" : (session.status as "idle" | "fasting" | "eating");
  const fastStartStr = phase === "fasting" ? session!.start_time : null;
  const elapsedMinutes = useElapsedMinutes(fastStartStr);
  const fastPct = Math.min(elapsedMinutes / (fastingHours * 60), 1);
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedMins = elapsedMinutes % 60;

  const waterPct = goals.waterGoalMl > 0 ? Math.min(totalMl / goals.waterGoalMl, 1) : 0;
  const enabledGoals = workoutGoals.filter((g) => g.enabled);
  const totalReps = Object.values(todayTotals).reduce((sum, t) => sum + t.reps, 0);

  const [customWater, setCustomWater] = useState("");

  const macros = [
    { label: "Calories", current: totals.calories, goal: goals.dailyCalories, unit: "kcal", barColor: ACCENT.lime },
    { label: "Protein", current: totals.protein_g, goal: goals.dailyProtein, unit: "g", barColor: "#b6c9d8" },
    { label: "Carbs", current: totals.carbs_g, goal: goals.dailyCarbs, unit: "g", barColor: "#9cf0ff" },
    { label: "Fat", current: totals.fat_g, goal: goals.dailyFat, unit: "g", barColor: "#ffb4ab" },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      {/* Fixed Top App Bar */}
      <View style={{ backgroundColor: c.tabBarBg, borderBottomWidth: 1, borderBottomColor: "rgba(53,53,52,0.2)", paddingTop: 8 }}>
        <View className="flex-row justify-between items-center" style={{ height: 44, paddingHorizontal: 20 }}>
          <View className="flex-row items-center">
            <Text style={{ color: ACCENT.lime, fontFamily: "Inter_800ExtraBold", fontSize: 22, letterSpacing: -0.5 }}>FastTrack</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          {/* Fasting Today */}
          <View className="mb-section-gap">
            <View className="flex-row justify-between items-end mb-3">
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
                Fasting Today
              </Text>
              <Text style={{ color: ACCENT.lime, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                {Math.round(fastPct * 100)}%
              </Text>
            </View>
            <Pressable onPress={() => router.push("/(tabs)/fast")} className="rounded-xl p-6" style={{ backgroundColor: "rgba(28,28,30,0.8)", borderWidth: 1, borderColor: "rgba(44,44,46,1)" }}>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 40, letterSpacing: -1 }}>
                    {elapsedHours}h {elapsedMins}m
                  </Text>
                  <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginTop: 4, textTransform: "uppercase" }}>
                    {phase === "idle" ? `READY TO FAST` : `ELAPSED OF ${fastingHours}H GOAL`}
                  </Text>
                </View>
                <ProgressRing size={96} progress={fastPct} strokeWidth={8} indicatorColor={ACCENT.lime}>
                  <MaterialCommunityIcons name="timer-outline" size={28} color={ACCENT.lime} />
                </ProgressRing>
              </View>
              <View className="mt-6 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(53,53,52,0.3)" }}>
                <View className="h-full rounded-full" style={{ width: `${fastPct * 100}%`, backgroundColor: ACCENT.lime }} />
              </View>
            </Pressable>
          </View>

          {/* Workout Progress */}
          {enabledGoals.length > 0 && (
            <View className="mb-section-gap">
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>
                Workout Progress
              </Text>
              <View className="rounded-xl p-5" style={{ backgroundColor: "rgba(28,28,30,0.8)", borderWidth: 1, borderColor: "rgba(44,44,46,1)" }}>
                {enabledGoals.slice(0, 4).map((goal) => {
                  const total = todayTotals[goal.exercise_type];
                  const reps = total?.reps ?? 0;
                  const pct = Math.min(reps / goal.daily_goal, 1);
                  return (
                    <View key={goal.id} className="mb-3">
                      <View className="flex-row justify-between items-center mb-2">
                        <View className="flex-row items-center gap-2">
                          <MaterialCommunityIcons name="dumbbell" size={16} color={ACCENT.cyan} />
                          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14, textTransform: "capitalize" }}>
                            {goal.exercise_type}
                          </Text>
                        </View>
                        <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12 }}>
                          {reps}/{goal.daily_goal}
                        </Text>
                      </View>
                      <View className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(53,53,52,0.3)" }}>
                        <View className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: ACCENT.cyan }} />
                      </View>
                    </View>
                  );
                })}
                {enabledGoals.length > 4 && (
                  <Pressable onPress={() => router.push("/(tabs)/workouts")} className="mt-2">
                    <Text style={{ color: ACCENT.cyan, fontFamily: "Inter_700Bold", fontSize: 12, textAlign: "center" }}>
                      +{enabledGoals.length - 2} more exercises
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* Hydration */}
          <View className="mb-section-gap">
            <View className="flex-row justify-between items-center mb-3">
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
                Hydration
              </Text>
              <View className="flex-row items-center gap-2">
                <Text style={{ color: ACCENT.cyan, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 24, letterSpacing: -0.5 }}>
                  {Math.round(totalMl / 100) / 10}
                </Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                  / {goals.waterGoalMl / 1000}L
                </Text>
              </View>
            </View>
            <View className="rounded-xl p-5" style={{ backgroundColor: "rgba(28,28,30,0.8)", borderWidth: 1, borderColor: "rgba(44,44,46,1)" }}>
              <View className="h-2 rounded-full overflow-hidden mb-5" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                <View className="h-full rounded-full" style={{ width: `${Math.min(totalMl / goals.waterGoalMl, 1) * 100}%`, backgroundColor: ACCENT.cyan }} />
              </View>
              <View className="flex-row gap-3 mb-5 overflow-x-auto no-scrollbar">
                {[250, 500, 750].map((ml) => (
                  <Pressable
                    key={ml}
                    onPress={() => addWater(ml).catch((err: Error) => console.error("addWater failed:", err))}
                    className="flex-1 py-3 rounded items-center glass-panel"
                  >
                    <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>{ml}ml</Text>
                    <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, textTransform: "uppercase" }}>
                      {ml === 250 ? "Small" : ml === 500 ? "Regular" : "Large"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View className="flex-row gap-3 mb-4">
                <TextInput
                  value={customWater}
                  onChangeText={setCustomWater}
                  placeholder="Custom ml"
                  placeholderTextColor={c.placeholder}
                  keyboardType="numeric"
                  className="flex-1 rounded-lg px-4 py-3"
                  style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", borderWidth: 1, borderColor: c.inputBorder }}
                />
                <Pressable
                  onPress={() => {
                    const ml = parseInt(customWater);
                    if (!isNaN(ml) && ml > 0) { addWater(ml).catch((err: Error) => console.error("addWater failed:", err)); setCustomWater(""); }
                  }}
                  className="px-5 py-3 rounded-lg items-center justify-center"
                  style={{ backgroundColor: ACCENT.cyan }}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="#161e00" />
                </Pressable>
              </View>
              <Pressable
                onPress={() => addWater(250).catch((err: Error) => console.error("addWater failed:", err))}
                className="w-full py-3 rounded flex-row items-center justify-center"
                style={{ backgroundColor: ACCENT.lime }}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#161e00" />
                <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold", fontSize: 14, marginLeft: 8 }}>Add Water</Text>
              </Pressable>
            </View>
          </View>

          {/* Daily Macros */}
          <View className="mb-section-gap">
            <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>
              Daily Macros
            </Text>
            <View className="flex-row flex-wrap" style={{ marginHorizontal: -8 }}>
              {macros.map((macro) => {
                const pct = macro.goal > 0 ? Math.min(macro.current / macro.goal, 1) : 0;
                return (
                  <View key={macro.label} className="w-1/2" style={{ paddingHorizontal: 8, marginBottom: 16 }}>
                    <View className="rounded-xl p-4" style={{ backgroundColor: "rgba(28,28,30,0.8)", borderWidth: 1, borderColor: "rgba(44,44,46,1)" }}>
                      <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>
                        {macro.label}
                      </Text>
                      <View className="flex-row items-baseline gap-1">
                        <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 22, letterSpacing: -0.5 }}>
                          {Math.round(macro.current).toLocaleString()}
                        </Text>
                        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>{macro.unit}</Text>
                      </View>
                      <View className="mt-3 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(53,53,52,0.3)" }}>
                        <View className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: macro.barColor }} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
