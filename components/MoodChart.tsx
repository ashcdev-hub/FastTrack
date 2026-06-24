import React, { useState } from "react";
import { View, Text } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import type { FastCheckIn } from "@/lib/types";

type MoodChartProps = {
  checkIns: FastCheckIn[];
};

const MOOD_LABELS = ["", "1", "2", "3", "4", "5"];
const MOOD_COLORS: Record<number, string> = {
  1: ACCENT.rose,
  2: ACCENT.coral,
  3: ACCENT.amber,
  4: ACCENT.lime,
  5: ACCENT.cyan,
};

export function MoodChart({ checkIns }: MoodChartProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [containerWidth, setContainerWidth] = useState(320);

  if (checkIns.length <= 2) return null;

  const width = containerWidth;
  const height = 140;
  const padding = { top: 20, right: 20, bottom: 30, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = checkIns.map((ch, i) => ({
    x: padding.left + (i / (checkIns.length - 1)) * chartW,
    y: padding.top + chartH - ((ch.mood - 1) / 4) * chartH,
    mood: ch.mood,
    time: new Date(ch.created_at),
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const avgMood = checkIns.reduce((sum, ch) => sum + ch.mood, 0) / checkIns.length;
  const lineColor = avgMood >= 4 ? ACCENT.lime : avgMood >= 3 ? ACCENT.amber : ACCENT.rose;
  const gridColor = theme === "dark" ? "rgba(240,237,232,0.05)" : "rgba(26,24,22,0.05)";
  const labelColor = theme === "dark" ? "rgba(240,237,232,0.25)" : "rgba(26,24,22,0.25)";
  const dotStroke = c.bg;

  return (
    <View className="mb-4" onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <View className="flex-row justify-between items-center mb-2">
        <Text style={{ color: c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs tracking-widest">
          MOOD OVER TIME
        </Text>
        <Text style={{ color: lineColor, fontFamily: "Inter_400Regular" }} className="text-xs">
          Avg: {MOOD_LABELS[Math.round(avgMood)]} · {avgMood.toFixed(1)}
        </Text>
      </View>

      <View className="glass-panel" style={{ padding: 8 }}>
        <Svg width={width - 16} height={height}>
          {[1, 2, 3, 4, 5].map((m) => {
            const y = padding.top + chartH - ((m - 1) / 4) * chartH;
            return (
              <React.Fragment key={m}>
                <Line x1={padding.left} y1={y} x2={width - padding.right - 16} y2={y} stroke={gridColor} strokeWidth={1} />
                <SvgText x={padding.left - 8} y={y + 4} textAnchor="end" fontSize={10} fill={labelColor} fontFamily="Inter_400Regular">
                  {MOOD_LABELS[m]}
                </SvgText>
              </React.Fragment>
            );
          })}

          {points.length > 1 && [0, Math.floor(points.length / 2), points.length - 1].map((idx) => {
            const p = points[idx];
            const h = p.time.getHours();
            const m = p.time.getMinutes();
            const label = `${h}:${String(m).padStart(2, "0")}`;
            return (
              <SvgText key={idx} x={p.x} y={height - 8} textAnchor="middle" fontSize={9} fill={labelColor} fontFamily="Inter_400Regular">
                {label}
              </SvgText>
            );
          })}

          <Path d={pathD} stroke={lineColor} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={5}
              fill={MOOD_COLORS[p.mood] ?? lineColor}
              stroke={dotStroke}
              strokeWidth={2}
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}
