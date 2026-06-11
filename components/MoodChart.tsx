import React from "react";
import { View, Text } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";
import type { FastCheckIn } from "@/lib/types";

type MoodChartProps = {
  checkIns: FastCheckIn[];
};

const MOOD_LABELS = ["", "😫", "😔", "😐", "😊", "🤩"];

export function MoodChart({ checkIns }: MoodChartProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  if (checkIns.length <= 2) return null;

  const width = 320;
  const height = 140;
  const padding = { top: 20, right: 20, bottom: 30, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = checkIns.map((c, i) => ({
    x: padding.left + (i / (checkIns.length - 1)) * chartW,
    y: padding.top + chartH - ((c.mood - 1) / 4) * chartH,
    mood: c.mood,
    time: new Date(c.created_at),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const avgMood = checkIns.reduce((sum, c) => sum + c.mood, 0) / checkIns.length;
  const lineColor = avgMood >= 4 ? "#10B981" : avgMood >= 3 ? "#F59E0B" : "#EF4444";
  const gridColor = theme === "dark" ? "rgba(255,255,255,0.05)" : "#F3F4F6";
  const labelColor = theme === "dark" ? "rgba(255,255,255,0.25)" : "#D1D5DB";
  const dotStroke = theme === "dark" ? "#0F172A" : "#F9FAFB";

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text style={{ color: c.textSecondary }} className="text-xs font-bold tracking-wider">
          MOOD OVER TIME
        </Text>
        <Text style={{ color: lineColor }} className="text-xs font-medium">
          Avg: {MOOD_LABELS[Math.round(avgMood)]} {avgMood.toFixed(1)}
        </Text>
      </View>

      <View style={{ backgroundColor: c.cardBgAlt, borderRadius: 16, padding: 8 }}>
        <Svg width={width} height={height}>
          {[1, 2, 3, 4, 5].map((m) => {
            const y = padding.top + chartH - ((m - 1) / 4) * chartH;
            return (
              <React.Fragment key={m}>
                <Line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={gridColor}
                  strokeWidth={1}
                />
                <SvgText
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill={labelColor}
                >
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
              <SvgText
                key={idx}
                x={p.x}
                y={height - 8}
                textAnchor="middle"
                fontSize={9}
                fill={labelColor}
              >
                {label}
              </SvgText>
            );
          })}

          <Path
            d={pathD}
            stroke={lineColor}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={lineColor}
              stroke={dotStroke}
              strokeWidth={2}
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}
