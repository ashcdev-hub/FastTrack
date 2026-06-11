import React from "react";
import { View, Text } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";
import type { WeightLogEntry } from "@/lib/types";

type WeightChartProps = {
  entries: WeightLogEntry[];
  goalWeightKg: number | null;
};

export function WeightChart({ entries, goalWeightKg }: WeightChartProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  if (entries.length <= 1) return null;

  const width = 320;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const weights = entries.map((e) => e.weight_kg);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;
  const yMin = minW - range * 0.1;
  const yMax = maxW + range * 0.1;
  const yRange = yMax - yMin;

  const points = entries.map((e, i) => ({
    x: padding.left + (i / (entries.length - 1)) * chartW,
    y: padding.top + chartH - ((e.weight_kg - yMin) / yRange) * chartH,
    weight: e.weight_kg,
    date: new Date(e.logged_at),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const fillPathD =
    pathD +
    ` L ${points[points.length - 1].x} ${padding.top + chartH}` +
    ` L ${points[0].x} ${padding.top + chartH} Z`;

  const lineColor = "#3B82F6";
  const fillColor = theme === "dark" ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.1)";
  const gridColor = theme === "dark" ? "rgba(255,255,255,0.05)" : "#F3F4F6";
  const labelColor = theme === "dark" ? "rgba(255,255,255,0.25)" : "#D1D5DB";
  const dotStroke = theme === "dark" ? "#0F172A" : "#F9FAFB";

  const goalY =
    goalWeightKg !== null
      ? padding.top + chartH - ((goalWeightKg - yMin) / yRange) * chartH
      : null;

  const gridLines = 4;
  const yTicks = Array.from({ length: gridLines + 1 }, (_, i) => yMin + (yRange * i) / gridLines);

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text style={{ color: c.textSecondary }} className="text-xs font-bold tracking-wider">
          WEIGHT OVER TIME
        </Text>
        <Text style={{ color: lineColor }} className="text-xs font-medium">
          {entries.length} entries
        </Text>
      </View>

      <View style={{ backgroundColor: c.cardBgAlt, borderRadius: 16, padding: 8 }}>
        <Svg width={width} height={height}>
          {yTicks.map((w, i) => {
            const y = padding.top + chartH - ((w - yMin) / yRange) * chartH;
            return (
              <React.Fragment key={i}>
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
                  fontSize={9}
                  fill={labelColor}
                >
                  {w.toFixed(1)}
                </SvgText>
              </React.Fragment>
            );
          })}

          {points.length > 1 &&
            [0, Math.floor(points.length / 2), points.length - 1].map((idx) => {
              const p = points[idx];
              const label = `${p.date.getMonth() + 1}/${p.date.getDate()}`;
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

          {goalY !== null && (
            <>
              <Line
                x1={padding.left}
                y1={goalY}
                x2={width - padding.right}
                y2={goalY}
                stroke="#10B981"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <SvgText
                x={width - padding.right + 4}
                y={goalY + 4}
                fontSize={8}
                fill="#10B981"
              >
                Goal
              </SvgText>
            </>
          )}

          <Path d={fillPathD} fill={fillColor} />

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