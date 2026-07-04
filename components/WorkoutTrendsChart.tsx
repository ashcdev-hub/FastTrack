import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Path, Line, Text as SvgText, Circle } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from "react-native-reanimated";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import type { DailyTrend } from "@/hooks/useWorkoutTrends";
import { GlassPanel } from "@/components/GlassPanel";

const AnimatedPath = Animated.createAnimatedComponent(Path);

type WorkoutTrendsChartProps = {
  trends: DailyTrend[];
};

export function WorkoutTrendsChart({ trends }: WorkoutTrendsChartProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [containerWidth, setContainerWidth] = useState(320);
  const [mode, setMode] = useState<"reps" | "calories">("reps");

  const sorted = trends.length <= 1 ? [] : trends;
  const width = containerWidth;
  const height = 180;
  const pad = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const values = sorted.map((d) => mode === "reps" ? d.totalReps : d.totalCalories);
  const minV = values.length > 0 ? Math.min(...values) : 0;
  const maxV = values.length > 0 ? Math.max(...values) : 0;
  const range = maxV - minV || 1;
  const yMin = minV - range * 0.1;
  const yMax = maxV + range * 0.1;
  const yRange = yMax - yMin;

  const points = sorted.map((d, i) => ({
    x: pad.left + (i / Math.max(sorted.length - 1, 1)) * chartW,
    y: pad.top + chartH - ((values[i] - yMin) / yRange) * chartH,
    value: values[i],
    date: d.date,
  }));

  const pathD = points.length > 0
    ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    : "";

  const fillPathD = pathD === ""
    ? ""
    : pathD + ` L ${points[points.length - 1].x} ${pad.top + chartH}` + ` L ${points[0].x} ${pad.top + chartH} Z`;

  const [dashArray, setDashArray] = useState(100000);
  const pathLength = useSharedValue(0);
  const drawProgress = useSharedValue(0);
  const pathRef = useRef<any>(null);
  const measureRef = useRef<any>(null);

  useEffect(() => {
    drawProgress.value = 0;
    pathLength.value = 0;
    setDashArray(100000);
    if (sorted.length <= 1) return;
    const timeout = setTimeout(() => {
      const len = pathRef.current?.getTotalLength?.() ?? measureRef.current?.getTotalLength?.();
      if (typeof len === "number" && len > 0) {
        pathLength.value = len;
        setDashArray(len);
        drawProgress.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) });
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [pathD]);

  const lineAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: pathLength.value * (1 - drawProgress.value),
  }));

  if (sorted.length <= 1) return null;

  const lineColor = mode === "reps" ? accent.cyan : accent.lime;
  const fillColor = theme === "dark" ? "rgba(45,212,168,0.15)" : "rgba(45,212,168,0.1)";
  const gridColor = theme === "dark" ? "rgba(240,237,232,0.05)" : "rgba(26,24,22,0.05)";
  const labelColor = theme === "dark" ? "rgba(240,237,232,0.25)" : "rgba(26,24,22,0.25)";
  const dotStroke = c.bg;

  const gridLines = 4;
  const yTicks = Array.from({ length: gridLines + 1 }, (_, i) => yMin + (yRange * i) / gridLines);

  return (
    <View className="mb-4" onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      <View className="flex-row justify-between items-center mb-2">
        <Text style={{ color: c.textSecondary, fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-xs tracking-widest">
          {mode === "reps" ? "REPS OVER TIME" : "CALORIES BURNED"}
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setMode("reps")}
            className="px-2 py-1"
            style={{ backgroundColor: mode === "reps" ? accent.limeBg : "transparent", borderRadius: 4 }}
          >
            <Text style={{ color: mode === "reps" ? accent.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 10 }}>REPS</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("calories")}
            className="px-2 py-1"
            style={{ backgroundColor: mode === "calories" ? accent.limeBg : "transparent", borderRadius: 4 }}
          >
            <Text style={{ color: mode === "calories" ? accent.lime : c.textMuted, fontFamily: "Inter_700Bold", fontSize: 10 }}>CAL</Text>
          </Pressable>
        </View>
      </View>

      <GlassPanel rounded={false} style={{ padding: 8 }}>
        <Svg width={width - 16} height={height}>
          {yTicks.map((w, i) => {
            const y = pad.top + chartH - ((w - yMin) / yRange) * chartH;
            return (
              <React.Fragment key={i}>
                <Line x1={pad.left} y1={y} x2={width - pad.right - 16} y2={y} stroke={gridColor} strokeWidth={1} />
                <SvgText x={pad.left - 8} y={y + 4} textAnchor="end" fontSize={9} fill={labelColor} fontFamily="Inter_400Regular">
                  {Math.round(w).toString()}
                </SvgText>
              </React.Fragment>
            );
          })}

          {points.length > 1 && [0, Math.floor(points.length / 2), points.length - 1].map((idx) => {
            const p = points[idx];
            const parts = p.date.split("-");
            const label = `${parseInt(parts[1])}/${parseInt(parts[2])}`;
            return (
              <SvgText key={idx} x={p.x} y={height - 8} textAnchor="middle" fontSize={9} fill={labelColor} fontFamily="Inter_400Regular">
                {label}
              </SvgText>
            );
          })}

          {/* Hidden — used for getTotalLength() measurement on native */}
          <Path ref={measureRef} d={pathD} opacity={0} />

          <Path d={fillPathD} fill={fillColor} opacity={0.3} />
          <AnimatedPath
            ref={pathRef}
            d={pathD}
            stroke={lineColor}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={dashArray}
            animatedProps={lineAnimatedProps}
          />

          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={3} fill={lineColor} stroke={dotStroke} strokeWidth={2} />
          ))}
        </Svg>
      </GlassPanel>
    </View>
  );
}
