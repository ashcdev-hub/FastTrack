import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { HugeiconsIcon } from "@hugeicons/react-native";
import Exchange01Icon from "@hugeicons/core-free-icons/dist/esm/Exchange01Icon";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type FastingTimerProps = {
  status: "idle" | "fasting" | "eating";
  totalMinutes: number;
  elapsedMinutes: number;
  hours: number;
  minutes: number;
  seconds: number;
  elapsedHours: number;
  elapsedMinutesPart: number;
  elapsedSeconds: number;
  schedule?: string | null;
};

const COLORS = {
  idle: {
    stroke: "#94A3B8",
    bg: "rgba(255,255,255,0.08)",
    glow: "rgba(255,255,255,0.08)",
    dot: "#94A3B8",
  },
  fasting: {
    stroke: "#10B981",
    bg: "#064E3B",
    glow: "#10B981",
    dot: "#10B981",
  },
  eating: {
    stroke: "#F59E0B",
    bg: "#78350F",
    glow: "#F59E0B",
    dot: "#F59E0B",
  },
};

export function FastingTimer({
  status,
  totalMinutes,
  elapsedMinutes,
  hours,
  minutes,
  seconds,
  elapsedHours,
  elapsedMinutesPart,
  elapsedSeconds,
  schedule,
}: FastingTimerProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [showElapsed, setShowElapsed] = useState(false);
  const size = 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const colors = COLORS[status];

  // Smooth progress animation - no sweep
  useEffect(() => {
    const pct = totalMinutes > 0 ? elapsedMinutes / totalMinutes : 0;
    const target = Math.min(pct, 1);
    
    if (status === "idle") {
      progress.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = withSpring(target, { damping: 15, stiffness: 120 });
    }
  }, [elapsedMinutes, totalMinutes, status]);

  // Glow pulse effect
  useEffect(() => {
    if (status === "idle") {
      glowOpacity.value = withTiming(0, { duration: 300 });
      return;
    }
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [status]);

  const progressAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const glowAnimatedProps = useAnimatedProps(() => ({
    opacity: 0.04 + glowOpacity.value * 0.06,
  }));

  const dotAnimatedProps = useAnimatedProps(() => {
    const angle = -Math.PI / 2 + progress.value * 2 * Math.PI;
    return {
      cx: size / 2 + radius * Math.cos(angle),
      cy: size / 2 + radius * Math.sin(angle),
      opacity: status === "idle" ? 0 : 1,
    };
  });

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <View className="items-center justify-center">
      <View
        className="items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke={colors.bg}
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth + 2}
            fill="none"
            strokeLinecap="round"
            stroke={colors.glow}
            animatedProps={glowAnimatedProps}
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke={colors.stroke}
            strokeDasharray={circumference}
            strokeLinecap="round"
            animatedProps={progressAnimatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={6}
            fill={colors.dot}
            animatedProps={dotAnimatedProps}
          />
        </Svg>

        <View className="absolute items-center justify-center">
          {status === "idle" ? (
            <>
              <Text style={{ color: c.textSecondary }} className="text-lg font-semibold mb-1">
                Ready to Fast?
              </Text>
              <Text style={{ color: c.textMuted }} className="text-xs">
                Tap below to begin
              </Text>
            </>
          ) : (
            <>
              <Text style={{ color: c.textSecondary }} className="text-sm font-medium mb-1">
                {status === "fasting"
                  ? `FASTING${schedule ? ` — ${schedule}` : ""}`
                  : `EATING${schedule ? ` — ${schedule}` : ""}`}
              </Text>
              <Pressable
                onPress={() => setShowElapsed((prev) => !prev)}
                hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
                className="items-center"
              >
                <Text
                  style={{
                    color: c.text,
                    borderBottomWidth: 1,
                    borderBottomColor: showElapsed ? colors.stroke : "transparent",
                    paddingBottom: 2,
                  }}
                  className="text-5xl font-bold tracking-wider"
                >
                  {showElapsed
                    ? `${pad(elapsedHours)}:${pad(elapsedMinutesPart)}:${pad(elapsedSeconds)}`
                    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
                </Text>
                <View className="flex-row items-center mt-1.5">
                  <HugeiconsIcon icon={Exchange01Icon} size={12} color={c.textMuted} strokeWidth={1.5} />
                  <Text style={{ color: c.textMuted }} className="text-xs ml-1">
                    {showElapsed ? "elapsed" : "remaining"}
                  </Text>
                </View>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}
