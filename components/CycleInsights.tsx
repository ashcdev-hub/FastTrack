import React from "react";
import { View, Text } from "react-native";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, getAccentColors } from "@/lib/theme-colors";
import type { CyclePhase } from "@/lib/types";
import { getPhaseDef, getPhaseColor, getPhaseIcon } from "@/lib/cycle-phases";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { GlassPanel } from "@/components/GlassPanel";

type CycleInsightsProps = {
  phase: CyclePhase;
  nextPeriodDate: string | null;
  isFertile: boolean;
  fertileStart: string | null;
  fertileEnd: string | null;
};

export function CycleInsights({ phase, nextPeriodDate, isFertile, fertileStart, fertileEnd }: CycleInsightsProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const def = getPhaseDef(phase);
  const color = getPhaseColor(phase, theme);
  const icon = getPhaseIcon(phase);

  const formatDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <GlassPanel className=" p-5">
      <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: 0.5, marginBottom: 12, textTransform: "uppercase" }}>
        Phase Insights
      </Text>

      <View className="flex-row items-center gap-2 mb-3">
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: color + "22", alignItems: "center", justifyContent: "center" }}>
          <MaterialCommunityIcons name={icon as any} size={14} color={color} />
        </View>
        <Text style={{ color, fontFamily: "SpaceGrotesk_700Bold", fontSize: 13, letterSpacing: 0.5, textTransform: "uppercase" }}>
          {def.label}
        </Text>
      </View>

      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 12, lineHeight: 18 }}>
        {def.description}
      </Text>

      <View className="p-3 mb-2" style={{ backgroundColor: color + "11" }}>
        <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 13, marginBottom: 2 }}>
          Fasting tip
        </Text>
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 }}>
          {def.fastingSuggestion}
        </Text>
      </View>

      {isFertile && fertileStart && fertileEnd && (
        <View className="flex-row items-center gap-2 mt-2 px-3 py-2 rounded-lg" style={{ backgroundColor: accent.cyanBg }}>
          <MaterialCommunityIcons name="information" size={14} color={accent.cyan} />
          <Text style={{ color: accent.cyan, fontFamily: "Inter_400Regular", fontSize: 12 }}>
            Fertile window: {formatDate(fertileStart)} – {formatDate(fertileEnd)}
          </Text>
        </View>
      )}

      {nextPeriodDate && (
        <View className="flex-row items-center gap-2 mt-2 px-3 py-2 rounded-lg" style={{ backgroundColor: accent.roseBg }}>
          <MaterialCommunityIcons name="calendar" size={14} color={accent.rose} />
          <Text style={{ color: accent.rose, fontFamily: "Inter_400Regular", fontSize: 12 }}>
            Next period predicted: {formatDate(nextPeriodDate)}
          </Text>
        </View>
      )}
    </GlassPanel>
  );
}
