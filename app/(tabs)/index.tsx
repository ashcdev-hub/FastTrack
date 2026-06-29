import React, { useEffect, useState, useRef } from "react";
import { Pressable, View, Text, TextInput, ScrollView, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/hooks/useAuth";
import { useFastingSession } from "@/hooks/useFastingSession";
import { useFastingStore } from "@/store/useFastingStore";
import { useWorkoutGoals } from "@/hooks/useWorkoutGoals";
import { useWorkoutLog } from "@/hooks/useWorkoutLog";
import { useWaterLog } from "@/hooks/useWaterLog";
import { useFoodLog } from "@/hooks/useFoodLog";
import { useGoalStore } from "@/store/useGoalStore";
import { useProfile } from "@/hooks/useProfile";
import { useWeightLog } from "@/hooks/useWeightLog";
import { useTrackerStore } from "@/store/useTrackerStore";
import { ProgressRing } from "@/components/ProgressRing";
import { WeightChart } from "@/components/WeightChart";
import { WeightTracker } from "@/components/WeightTracker";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { DEFAULT_UNITS } from "@/lib/units";
import { format, addHours } from "date-fns";
import { router } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";

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
  const { session, streak, completedFasts } = useFastingSession(user?.id);
  const { fastingHours, eatingHours } = useFastingStore();
  const { profile } = useProfile(user?.id ?? null);
  const { isEnabled } = useTrackerStore();
  const { goals: workoutGoals } = useWorkoutGoals(user?.id);
  const { todayTotals } = useWorkoutLog(user?.id, profile?.weight_kg ?? null);
  const { totalMl, addWater } = useWaterLog(user?.id);
  const { totals } = useFoodLog(user?.id);
  const goals = useGoalStore();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const { entries: weightEntries, loading: weightLoading, addWeight: addWeightRaw, deleteWeight: deleteWeightRaw, currentWeight, weightChange } = useWeightLog(user?.id);
  const addWeight = async (kg: number) => {
    try { await addWeightRaw(kg); return { error: null }; } catch (e) { return { error: e as Error }; }
  };
  const deleteWeight = async (id: string) => {
    try { await deleteWeightRaw(id); return { error: null }; } catch (e) { return { error: e as Error }; }
  };
  const unitPrefs = profile?.unit_preferences ?? DEFAULT_UNITS;

  const phase = !session ? "idle" : (session.status as "idle" | "fasting" | "eating");
  const trackStartStr = phase === "fasting"
    ? session!.start_time
    : phase === "eating"
      ? session!.end_time
      : null;
  const elapsedMinutes = useElapsedMinutes(trackStartStr);
  const goalMinutes = phase === "eating" ? eatingHours * 60 : fastingHours * 60;
  const fastPct = goalMinutes > 0 ? Math.min(elapsedMinutes / goalMinutes, 1) : 0;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedMins = elapsedMinutes % 60;
  const isFastOver = phase !== "idle" && elapsedMinutes >= goalMinutes;

  const waterPct = goals.waterGoalMl > 0 ? Math.min(totalMl / goals.waterGoalMl, 1) : 0;
  const enabledGoals = workoutGoals.filter((g) => g.enabled);
  const totalReps = Object.values(todayTotals).reduce((sum, t) => sum + t.reps, 0);

  const [selectedWaterMl, setSelectedWaterMl] = useState<number | null>(null);
  const [showHydrationGoal, setShowHydrationGoal] = useState(false);
  const [coachInput, setCoachInput] = useState("");
  const [coachReply, setCoachReply] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [showCoachChat, setShowCoachChat] = useState(false);
  const hydrationGoalShownRef = useRef(true);
  const hydrationGoalKey = `@fasttrack_hydration_goal_${new Date().toISOString().split("T")[0]}`;

  useEffect(() => {
    AsyncStorage.getItem(hydrationGoalKey).then((val) => {
      if (val !== "shown") {
        hydrationGoalShownRef.current = false;
      }
    });
  }, [hydrationGoalKey]);

  useEffect(() => {
    if (goals.waterGoalMl > 0 && totalMl >= goals.waterGoalMl && !hydrationGoalShownRef.current) {
      hydrationGoalShownRef.current = true;
      AsyncStorage.setItem(hydrationGoalKey, "shown");
      setShowHydrationGoal(true);
    }
  }, [totalMl, goals.waterGoalMl, hydrationGoalKey]);

  const macros = [
    { label: "Calories", current: totals.calories, goal: goals.dailyCalories, unit: "kcal", barColor: accent.lime },
    { label: "Protein", current: totals.protein_g, goal: goals.dailyProtein, unit: "g", barColor: "#b6c9d8" },
    { label: "Carbs", current: totals.carbs_g, goal: goals.dailyCarbs, unit: "g", barColor: "#9cf0ff" },
    { label: "Fat", current: totals.fat_g, goal: goals.dailyFat, unit: "g", barColor: "#ffb4ab" },
  ];

  const coachContext = {
    streak,
    completedFasts,
    phase,
    calories: totals.calories,
    protein: totals.protein_g,
    carbs: totals.carbs_g,
    fat: totals.fat_g,
    calorieGoal: goals.dailyCalories,
    proteinGoal: goals.dailyProtein,
    carbsGoal: goals.dailyCarbs,
    fatGoal: goals.dailyFat,
    waterMl: totalMl,
    waterGoalMl: goals.waterGoalMl,
    workoutReps: Object.values(todayTotals).reduce((sum, t) => sum + t.reps, 0),
    weight: currentWeight?.toFixed(1) ?? "unknown",
    weightChange: weightChange?.toFixed(1) ?? "unknown",
  };

  const handleAskCoach = async (question: string) => {
    if (!question.trim() || coachLoading) return;
    setCoachLoading(true);
    setCoachReply(null);
    try {
      const { data } = await supabase.functions.invoke("ai-coach", { body: { question, context: coachContext } });
      setCoachReply(data?.reply ?? "I'm not sure how to answer that.");
    } catch {
      setCoachReply("Sorry, I couldn't reach the coach. Try again in a moment.");
    } finally {
      setCoachLoading(false);
    }
  };
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef as any);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      {/* Fixed Top App Bar */}
      <View style={{ backgroundColor: c.tabBarBg, borderBottomWidth: 1, borderBottomColor: c.tabBarBorder, paddingTop: 8 }}>
        <View className="flex-row justify-between items-center" style={{ height: 44, paddingHorizontal: 20 }}>
          <View className="flex-row items-center gap-2">
            <Image source={require("../../assets/icon.png")} style={{ width: 22, height: 22, borderRadius: 5 }} />
            <Text style={{ color: accent.lime, fontFamily: "Inter_800ExtraBold", fontSize: 22, letterSpacing: -0.5 }}>FastTrack</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 85 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          {/* Fasting Today */}
          {isEnabled('fasting') ? (
          <View className="mb-section-gap">
            <Pressable onPress={() => router.push("/(tabs)/fast")} className="rounded-xl p-6 glass-panel">
              <View className="flex-row justify-between items-center mb-4">
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
                  {phase === "eating" ? "Eating Window" : "Fasting Today"}
                </Text>
                <Text style={{ color: phase === "eating" ? accent.cyan : accent.lime, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                  {Math.round(fastPct * 100)}%
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View>
                  <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 40, letterSpacing: -1 }}>
                    {elapsedHours}h {elapsedMins}m
                  </Text>
                  <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginTop: 4, textTransform: "uppercase" }}>
                    {phase === "idle" ? `READY TO FAST` : phase === "eating" ? `ELAPSED OF ${eatingHours}H WINDOW` : `ELAPSED OF ${fastingHours}H GOAL`}
                  </Text>
                </View>
                <ProgressRing size={96} progress={fastPct} strokeWidth={8} indicatorColor={phase === "eating" ? accent.cyan : accent.lime}>
                  <MaterialCommunityIcons name={phase === "eating" ? "food-apple-outline" : "timer-outline"} size={28} color={phase === "eating" ? accent.cyan : accent.lime} />
                </ProgressRing>
              </View>
              <View className="mt-6 h-1 rounded-full overflow-hidden" style={{ backgroundColor: c.progressTrack }}>
                <View className="h-full rounded-full" style={{ width: `${fastPct * 100}%`, backgroundColor: phase === "eating" ? accent.cyan : accent.lime }} />
              </View>
            </Pressable>
          </View>
          ) : null}

          {/* Workout Progress */}
          {isEnabled('workouts') && enabledGoals.length > 0 ? (
            <View className="mb-section-gap">
              <Pressable onPress={() => router.push("/(tabs)/workouts")} className="rounded-xl p-5 glass-panel">
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>
                  Workout Progress
                </Text>
                <View className="flex-row justify-between">
                  {enabledGoals.slice(0, 4).map((goal) => {
                    const total = todayTotals[goal.exercise_type];
                    const reps = total?.reps ?? 0;
                    const pct = Math.min(reps / goal.daily_goal, 1);
                    const t = pct * 100;
                    let color: string;
                    if (t <= 50) {
                      const f = t / 50;
                      const r = Math.round(255 - (255 - 255) * f);
                      const g = Math.round(59 + (214 - 59) * f);
                      const b = Math.round(48 + (10 - 48) * f);
                      color = `rgb(${r},${g},${b})`;
                    } else {
                      const f = (t - 50) / 50;
                      const r = Math.round(255 - (255 - 48) * f);
                      const g = Math.round(214 - (214 - 209) * f);
                      const b = Math.round(10 + (88 - 10) * f);
                      color = `rgb(${r},${g},${b})`;
                    }
                    return (
                      <View key={goal.id} className="flex-1 items-center">
                        <ProgressRing size={56} strokeWidth={5} progress={pct} indicatorColor={color}>
                          <Text style={{ color, fontFamily: "Inter_700Bold", fontSize: 10 }}>
                            {reps}/{goal.daily_goal}
                          </Text>
                        </ProgressRing>
                        <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 11, marginTop: 6, textTransform: "capitalize" }}>
                          {goal.exercise_type}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                {enabledGoals.length > 4 && (
                  <Text style={{ color: accent.cyan, fontFamily: "Inter_700Bold", fontSize: 12, textAlign: "center", marginTop: 3 }}>
                    +{enabledGoals.length - 4} more
                  </Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {/* Hydration */}
          <View className="mb-section-gap">
            <View className="rounded-xl p-5 glass-panel">
              <View className="flex-row justify-between items-center mb-4">
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
                  Hydration
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text style={{ color: accent.cyan, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 24, letterSpacing: -0.5 }}>
                    {(totalMl / 1000).toFixed(2).replace(/\.?0+$/, '')}
                  </Text>
                  <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                    / {goals.waterGoalMl / 1000}L
                  </Text>
                  <Pressable onPress={() => router.replace("/(tabs)/profile?expand=preferences")}>
                    <MaterialCommunityIcons name="cog-outline" size={14} color={c.textMuted} />
                  </Pressable>
                </View>
              </View>
              <View className="h-2 rounded-full overflow-hidden mb-5" style={{ backgroundColor: c.progressTrack }}>
                <View className="h-full rounded-full" style={{ width: `${Math.min(totalMl / goals.waterGoalMl, 1) * 100}%`, backgroundColor: accent.cyan }} />
              </View>
              <View className="flex-row gap-3 mb-5 overflow-x-auto no-scrollbar">
                {[250, 500, 750].map((ml) => {
                  const isSelected = selectedWaterMl === ml;
                  return (
                    <Pressable
                      key={ml}
                      onPress={() => setSelectedWaterMl(isSelected ? null : ml)}
                      className="flex-1 py-3 rounded items-center"
                      style={{ backgroundColor: isSelected ? accent.cyan : c.buttonBg, borderWidth: 1, borderColor: isSelected ? accent.cyan : c.cardBorder }}
                    >
                      <Text style={{ color: isSelected ? c.textOnAccent : c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>{ml}ml</Text>
                      <Text style={{ color: isSelected ? c.textOnAccent : c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, textTransform: "uppercase" }}>
                        {ml === 250 ? "Small" : ml === 500 ? "Regular" : "Large"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View className="flex-row gap-3 mb-5">
                <TextInput
                  value={selectedWaterMl ? String(selectedWaterMl) : ""}
                  onChangeText={(text) => {
                    const parsed = parseInt(text);
                    setSelectedWaterMl(!isNaN(parsed) && parsed > 0 ? parsed : null);
                  }}
                  placeholder="Custom ml"
                  placeholderTextColor={c.placeholder}
                  keyboardType="numeric"
                  className="flex-1 rounded-xl px-4 py-3"
                  style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", borderWidth: 1, borderColor: c.inputBorder }}
                />
              </View>
              <Pressable
                onPress={() => {
                  if (selectedWaterMl && selectedWaterMl > 0) {
                    addWater(selectedWaterMl).catch((err: Error) => console.error("addWater failed:", err));
                    setSelectedWaterMl(null);
                  }
                }}
                disabled={!selectedWaterMl}
                className="w-full py-3.5 rounded flex-row items-center justify-center"
                style={{ backgroundColor: selectedWaterMl ? accent.lime : c.buttonBg }}
              >
                <MaterialCommunityIcons name="plus" size={20} color={selectedWaterMl ? c.textOnAccent : c.textMuted} />
                <Text style={{ color: selectedWaterMl ? c.textOnAccent : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 14, marginLeft: 8 }}>
                  {selectedWaterMl ? `Add ${selectedWaterMl}ml` : "Select Amount"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Weight */}
          <View className="mb-section-gap">
            <View className="rounded-xl p-5 glass-panel">
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>
                Weight
              </Text>
              <WeightChart entries={weightEntries} goalWeightKg={profile?.goal_weight_kg ?? null} />
              <WeightTracker
                entries={weightEntries}
                currentWeight={currentWeight}
                weightChange={weightChange}
                onAddWeight={addWeight}
                onDeleteWeight={deleteWeight}
                loading={weightLoading}
                unitPrefs={unitPrefs}
              />
            </View>
          </View>

          {isEnabled('food') ? (
          <View className="mb-section-gap">
            <View className="rounded-xl p-5 glass-panel">
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>
                Daily Macros
              </Text>
              <View className="flex-row flex-wrap" style={{ marginHorizontal: -8 }}>
                {macros.map((macro) => {
                  const pct = macro.goal > 0 ? Math.min(macro.current / macro.goal, 1) : 0;
                  return (
                    <View key={macro.label} className="w-1/2" style={{ paddingHorizontal: 8, marginBottom: 16 }}>
                      <View className="rounded-xl p-4" style={{ backgroundColor: c.cardBg }}>
                      <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>
                        {macro.label}
                      </Text>
                      <View className="flex-row items-baseline gap-1">
                        <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 22, letterSpacing: -0.5 }}>
                          {Math.round(macro.current).toLocaleString()}
                        </Text>
                        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>{macro.unit}</Text>
                      </View>
                        <View className="mt-3 h-1 rounded-full overflow-hidden" style={{ backgroundColor: c.progressTrack }}>
                          <View className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: macro.barColor }} />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
          ) : null}

          {/* AI Insights */}
          <View className="mb-section-gap">
            <View className="rounded-xl p-5 glass-panel">
              <View className="flex-row items-center gap-2 mb-3">
                <MaterialCommunityIcons name="lightning-bolt" size={18} color={accent.lime} />
                <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
                  AI Insights
                </Text>
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21, marginBottom: 12 }}>
                {completedFasts > 0
                  ? `You've completed ${completedFasts} fasts${streak > 0 ? ` with a ${streak}-day streak` : ""}.${totals.calories > 0 ? ` You've logged ${Math.round(totals.calories)} of ${goals.dailyCalories} kcal today.` : ""}`
                  : "Start your first fast and log your meals to get personalized insights."}
              </Text>

              {!showCoachChat ? (
                <Pressable onPress={() => setShowCoachChat(true)} className="rounded-xl py-3 items-center flex-row justify-center gap-2" style={{ backgroundColor: accent.limeBg }}>
                  <MaterialCommunityIcons name="message-text-outline" size={16} color={accent.lime} />
                  <Text style={{ color: accent.lime, fontFamily: "Inter_700Bold", fontSize: 13 }}>Ask a question</Text>
                </Pressable>
              ) : (
                <View>
                  <View className="flex-row items-center gap-2 mb-3">
                    <TextInput value={coachInput} onChangeText={setCoachInput}
                      placeholder="Ask about fasting, nutrition, workouts..."
                      placeholderTextColor={c.placeholder}
                      className="flex-1 rounded-xl px-4 py-3"
                      style={{ backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}
                      returnKeyType="send"
                      onSubmitEditing={() => { handleAskCoach(coachInput); setCoachInput(""); }}
                    />
                    <Pressable onPress={() => { handleAskCoach(coachInput); setCoachInput(""); }}
                      disabled={!coachInput.trim() || coachLoading}
                      className="rounded-xl p-3"
                      style={{ backgroundColor: coachInput.trim() && !coachLoading ? accent.lime : c.buttonBg }}>
                      <MaterialCommunityIcons name="send" size={18} color={coachInput.trim() && !coachLoading ? c.textOnAccent : c.textMuted} />
                    </Pressable>
                  </View>
                  {coachLoading && <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13 }}>Thinking...</Text>}
                  {coachReply && (
                    <View className="rounded-xl p-3" style={{ backgroundColor: c.elevated }}>
                      <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 }}>{coachReply}</Text>
                    </View>
          )}

                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Hydration Goal Celebration */}
      <Modal visible={showHydrationGoal} transparent animationType="slide" onRequestClose={() => setShowHydrationGoal(false)}>
        <Pressable className="flex-1 justify-end" style={{ backgroundColor: c.overlay }} onPress={() => setShowHydrationGoal(false)}>
          <Pressable onStartShouldSetResponder={() => true} className="rounded-t-3xl p-6" style={{ backgroundColor: c.elevated }}>
            <View className="items-center mb-5">
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(0,218,243,0.15)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <MaterialCommunityIcons name="trophy" size={28} color={accent.cyan} />
              </View>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 22 }}>Hydration Goal Reached!</Text>
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 4 }}>
                You've hit your daily water target. Stay hydrated!
              </Text>
            </View>

            <View className="items-center mb-5">
              <View className="flex-row items-baseline gap-1">
                <Text style={{ color: accent.cyan, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 40, letterSpacing: -1 }}>
                  {Math.round(totalMl / 100) / 10}
                </Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 18 }}>
                  / {goals.waterGoalMl / 1000}L
                </Text>
              </View>
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 1, marginTop: 4, textTransform: "uppercase" }}>
                {Math.round(totalMl)}ml of {goals.waterGoalMl}ml
              </Text>
            </View>

            <View className="rounded-xl p-4 mb-5" style={{ backgroundColor: c.cardBg }}>
              <View className="flex-row items-center gap-3">
                <MaterialCommunityIcons name="water" size={20} color={accent.cyan} />
                <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                  Consistent hydration supports energy, focus, and metabolism.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setShowHydrationGoal(false)}
              className="py-4 rounded-xl items-center"
              style={{ backgroundColor: accent.cyan }}
            >
              <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 16 }}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
