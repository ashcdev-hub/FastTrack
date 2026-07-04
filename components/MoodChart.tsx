import React, { useState } from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import type { FastCheckIn } from "@/lib/types";
import { GlassPanel } from "@/components/GlassPanel";

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
  const accent = getAccentColors(theme);
// accent defined below
// accent defined below
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

  const gridColor = theme === "dark" ? "rgba(240,237,232,0.05)" : "rgba(26,24,22,0.05)";
  const labelColor = theme === "dark" ? "rgba(240,237,232,0.25)" : "rgba(26,24,22,0.25)";
  const dotStroke = c.bg;

  const avgMood = checkIns.reduce((sum, ch) => sum + ch.mood, 0) / checkIns.length;

  function blendColors(colorA: string, colorB: string): string {
    const h = (color: string) => color.replace("#", "");
    const aR = parseInt(h(colorA).substring(0, 2), 16);
    const aG = parseInt(h(colorA).substring(2, 4), 16);
    const aB = parseInt(h(colorA).substring(4, 6), 16);
    const bR = parseInt(h(colorB).substring(0, 2), 16);
    const bG = parseInt(h(colorB).substring(2, 4), 16);
    const bB = parseInt(h(colorB).substring(4, 6), 16);
    const r = Math.round((aR + bR) / 2 + (255 - (aR + bR) / 2) * 0.35);
    const g = Math.round((aG + bG) / 2 + (255 - (aG + bG) / 2) * 0.35);
    const bVal = Math.round((aB + bB) / 2 + (255 - (aB + bB) / 2) * 0.35);
    return `rgb(${r},${g},${bVal})`;
  }

  return (
    <View className="mb-4" onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <View className="flex-row justify-between items-center mb-2">
        <Text style={{ color: c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs tracking-widest">
          MOOD OVER TIME
        </Text>
        <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-xs">
          Avg: {MOOD_LABELS[Math.round(avgMood)]} · {avgMood.toFixed(1)}
        </Text>
      </View>

      <GlassPanel rounded={false} style={{ padding: 8 }}>
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

          {points.slice(0, -1).map((p, i) => {
            const next = points[i + 1];
            const segmentColor = blendColors(MOOD_COLORS[p.mood], MOOD_COLORS[next.mood]);
            return (
              <Line
                key={`seg-${i}`}
                x1={p.x}
                y1={p.y}
                x2={next.x}
                y2={next.y}
                stroke={segmentColor}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            );
          })}

          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={5}
              fill={MOOD_COLORS[p.mood] ?? c.text}
              stroke={dotStroke}
              strokeWidth={2}
            />
          ))}
        </Svg>
      </GlassPanel>
    </View>
  );
}
