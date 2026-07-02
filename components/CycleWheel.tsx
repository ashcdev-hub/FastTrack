import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from "react-native-reanimated";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, getAccentColors } from "@/lib/theme-colors";
import { getPhaseColor, getPhaseColorBg } from "@/lib/cycle-phases";
import type { CyclePhase } from "@/lib/types";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type CycleWheelProps = {
  phase: CyclePhase;
  dayOfCycle: number;
  totalCycleDays: number;
  phaseDay: number;
  phaseTotalDays: number;
  isFertile: boolean;
  nextPeriodLabel: string;
};

export function CycleWheel({
  phase,
  dayOfCycle,
  totalCycleDays,
  phaseDay,
  phaseTotalDays,
  isFertile,
  nextPeriodLabel,
}: CycleWheelProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const size = 200;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const phaseColor = getPhaseColor(phase, theme);
  const progress = useSharedValue(0);

  const pct = totalCycleDays > 0 ? Math.min(dayOfCycle / totalCycleDays, 1) : 0;

  useEffect(() => {
    progress.value = withTiming(pct, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [pct]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const fertileColor = accent.cyan;
  const fertileStartPct = Math.max(0, dayOfCycle - 6) / totalCycleDays;
  const fertileEndPct = Math.min(1, (dayOfCycle - 1) / totalCycleDays);
  const fertileLength = Math.max(0, fertileEndPct - fertileStartPct);

  return (
    <View className="items-center justify-center" style={{ width: size, height: size + 30 }}>
      <View className="items-center justify-center" style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={c.progressTrack}
            strokeWidth={strokeWidth}
          />
          {isFertile && fertileLength > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={fertileColor}
              strokeWidth={strokeWidth + 2}
              strokeDasharray={`${fertileLength * circumference} ${circumference}`}
              strokeDashoffset={circumference * (1 - fertileStartPct)}
              strokeLinecap="round"
              opacity={0.4}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={phaseColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        <View className="absolute z-10 items-center">
          <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 40, letterSpacing: -1 }}>
            {dayOfCycle}
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 11, letterSpacing: 0.5, marginTop: -4 }}>
            of {totalCycleDays}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: c.elevated, borderWidth: 1, borderColor: phaseColor + "33" }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: phaseColor }} />
            <Text style={{ color: phaseColor, fontFamily: "SpaceGrotesk_700Bold", fontSize: 9, letterSpacing: 0.5, textTransform: "uppercase" }}>
              {phase}
            </Text>
          </View>
        </View>
      </View>

      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 8 }}>
        {nextPeriodLabel}
      </Text>
    </View>
  );
}
