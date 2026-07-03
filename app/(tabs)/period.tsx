import React, { useState, useRef } from "react";
import { Pressable, View, Text, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { usePeriodLog } from "@/hooks/usePeriodLog";
import { useCycleTracker } from "@/hooks/useCycleTracker";
import { usePeriodSettings } from "@/hooks/usePeriodSettings";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { CyclePhaseBadge } from "@/components/CyclePhaseBadge";
import { CycleWheel } from "@/components/CycleWheel";
import { PeriodCalendar } from "@/components/PeriodCalendar";
import { PeriodLogModal } from "@/components/PeriodLogModal";
import { CycleInsights } from "@/components/CycleInsights";
import { PeriodSettingsModal } from "@/components/PeriodSettingsModal";
import { AmbientBackground } from "@/components/AmbientBackground";
import { FastTrackHeader } from "@/components/FastTrackHeader";
import { getPhaseDef } from "@/lib/cycle-phases";
import { useScrollToTop } from "@react-navigation/native";
import type { PeriodLogEntry } from "@/lib/types";

function formatCountdown(nextPeriodDate: string | null, confidence: number): string {
  if (!nextPeriodDate) return "Log your first period to get predictions";
  const now = new Date();
  const next = new Date(nextPeriodDate + "T12:00:00");
  const diff = Math.round((next.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return "Period overdue by " + Math.abs(diff) + " days";
  if (diff === 0) return "Period expected today";
  if (diff === 1) return "Period expected tomorrow";
  const confidenceLabel = confidence > 0.7 ? "" : confidence > 0.4 ? " (estimated)" : " (rough estimate)";
  return "Period in " + diff + " days" + confidenceLabel;
}

export default function PeriodScreen() {
  const { user } = useAuth();
  const { entries, entriesByDate, loading, logDay, deleteEntry } = usePeriodLog(user?.id);
  const { settings, updateSettings } = usePeriodSettings(user?.id);
  const { cycleInfo, predictedPeriods, periodHistory } = useCycleTracker(entries, settings);
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef as any);

  const [showLogModal, setShowLogModal] = useState(false);
  const [logDateStr, setLogDateStr] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showQuickFlowPicker, setShowQuickFlowPicker] = useState(false);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const hasRecentFlow = (() => {
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const entry = entriesByDate.get(key);
      if (entry?.flow_intensity && entry.flow_intensity !== "spotting") return true;
    }
    return false;
  })();

  const handleDayPress = (dateStr: string) => {
    setLogDateStr(dateStr);
    setShowLogModal(true);
  };

  const handleSave = async (data: Partial<PeriodLogEntry>) => {
    await logDay(logDateStr, data);
  };

  const handleDelete = async () => {
    const entry = entriesByDate.get(logDateStr);
    if (entry) await deleteEntry(entry.id);
  };

  const logEntry = logDateStr ? entriesByDate.get(logDateStr) ?? null : null;
  const predictedDates = new Set(predictedPeriods);
  const isFertileDay = logDateStr
    ? cycleInfo.fertileStart && cycleInfo.fertileEnd
      ? logDateStr >= cycleInfo.fertileStart && logDateStr <= cycleInfo.fertileEnd
      : false
    : false;
  const isOvulationDay = logDateStr === cycleInfo.ovulationDate;

  const nextPeriodLabel = formatCountdown(cycleInfo.nextPeriodDate, cycleInfo.confidence);
  const phaseDef = getPhaseDef(cycleInfo.phase);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: c.bg }}>
      <AmbientBackground />
      <FastTrackHeader />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 85, paddingHorizontal: 20, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row justify-between items-center mb-section-gap">
          <CyclePhaseBadge phase={cycleInfo.phase} dayOfCycle={cycleInfo.dayOfCycle} totalCycleDays={cycleInfo.totalCycleDays} />
          <Pressable onPress={() => setShowSettings(true)} className="p-2 rounded-lg" style={{ backgroundColor: c.buttonBg }}>
            <MaterialCommunityIcons name="cog-outline" size={18} color={c.textSecondary} />
          </Pressable>
        </View>

        <View className="items-center mb-section-gap">
          <CycleWheel
            phase={cycleInfo.phase}
            dayOfCycle={cycleInfo.dayOfCycle}
            totalCycleDays={cycleInfo.totalCycleDays}
            phaseDay={cycleInfo.phaseDay}
            phaseTotalDays={cycleInfo.phaseTotalDays}
            isFertile={cycleInfo.isFertile}
            nextPeriodLabel={nextPeriodLabel}
          />
        </View>

        <View className="glass-panel rounded-xl p-5 mb-section-gap">
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 0.5, marginBottom: 12, textTransform: "uppercase" }}>
            Quick Log
          </Text>
          {showQuickFlowPicker ? (
            <View className="flex-row gap-2">
              {["Light", "Medium", "Heavy"].map((label) => {
                const intensity = label.toLowerCase();
                return (
                  <Pressable
                    key={label}
                    onPress={() => {
                      logDay(todayStr, { flow_intensity: intensity as any });
                      setShowQuickFlowPicker(false);
                    }}
                    className="flex-1 py-3 rounded-xl items-center"
                    style={{ backgroundColor: accent.roseBg, borderWidth: 1, borderColor: accent.rose + "44" }}
                  >
                    <Text style={{ color: accent.rose, fontFamily: "Inter_700Bold", fontSize: 14 }}>{label}</Text>
                  </Pressable>
                );
              })}
              <Pressable onPress={() => setShowQuickFlowPicker(false)} className="py-3 px-3 rounded-xl items-center justify-center" style={{ backgroundColor: c.buttonBg }}>
                <MaterialCommunityIcons name="close" size={18} color={c.textMuted} />
              </Pressable>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowQuickFlowPicker(true)}
                className="flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2"
                style={{ backgroundColor: accent.roseBg, borderWidth: 1, borderColor: accent.rose + "44" }}
              >
                <MaterialCommunityIcons name="plus-circle" size={18} color={accent.rose} />
                <Text style={{ color: accent.rose, fontFamily: "Inter_700Bold", fontSize: 14 }}>Period Started</Text>
              </Pressable>
              {hasRecentFlow && (
                <Pressable
                  onPress={() => { logDay(todayStr, { flow_intensity: null }); }}
                  className="flex-1 py-3 rounded-xl items-center flex-row justify-center gap-2"
                  style={{ backgroundColor: c.buttonBg, borderWidth: 1, borderColor: c.cardBorder }}
                >
                  <MaterialCommunityIcons name="check-circle-outline" size={18} color={c.text} />
                  <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 14 }}>Period Ended</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        <View className="mb-section-gap">
          <PeriodCalendar
            entriesByDate={entriesByDate}
            predictedPeriods={predictedPeriods}
            settings={settings}
            cycleDay={cycleInfo.dayOfCycle}
            cycleLength={cycleInfo.totalCycleDays}
            fertileStart={cycleInfo.fertileStart}
            fertileEnd={cycleInfo.fertileEnd}
            ovulationDate={cycleInfo.ovulationDate}
            onDayPress={handleDayPress}
          />
        </View>

        <View className="mb-section-gap">
          <CycleInsights
            phase={cycleInfo.phase}
            nextPeriodDate={cycleInfo.nextPeriodDate}
            isFertile={cycleInfo.isFertile}
            fertileStart={cycleInfo.fertileStart}
            fertileEnd={cycleInfo.fertileEnd}
          />
        </View>

        {periodHistory.length > 0 && (
          <View className="glass-panel rounded-xl p-5 mb-section-gap">
            <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 0.5, marginBottom: 12, textTransform: "uppercase" }}>
              Past Periods
            </Text>
            {periodHistory.slice(-6).reverse().map((p, i) => (
              <View key={p.start} className="flex-row justify-between py-2" style={{ borderBottomWidth: i < Math.min(periodHistory.length, 6) - 1 ? 1 : 0, borderBottomColor: c.divider }}>
                <Text style={{ color: c.text, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                  {new Date(p.start + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {p.end !== p.start && " – " + new Date(p.end + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </Text>
                <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                  {(() => {
                    const diff = Math.round((new Date(p.end + "T12:00:00").getTime() - new Date(p.start + "T12:00:00").getTime()) / 86400000) + 1;
                    return diff + (diff === 1 ? " day" : " days");
                  })()}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View className="rounded-xl p-5 mb-section-gap" style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}>
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>
            About This Data
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 }}>
            Predictions improve the more you log. Period data is private and stored on-device with optional cloud sync. Never shared.
          </Text>
        </View>
      </ScrollView>

      <PeriodLogModal
        visible={showLogModal}
        dateStr={logDateStr}
        entry={logEntry}
        predictedFertile={isFertileDay}
        predictedOvulation={isOvulationDay}
        onSave={handleSave}
        onDelete={handleDelete}
        onClose={() => setShowLogModal(false)}
      />

      <PeriodSettingsModal
        visible={showSettings}
        settings={settings}
        onSave={updateSettings}
        onClose={() => setShowSettings(false)}
      />
    </SafeAreaView>
  );
}
