import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
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
import { ACCENT } from "@/lib/theme-colors";

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
  isOver?: boolean;
  schedule?: string | null;
};

const COLORS = {
  idle: {
    stroke: "#6B6E73",
    bg: "rgba(128,128,128,0.15)",
    glow: "#6B6E73",
    dot: "#6B6E73",
    gradientStart: "#6B6E73",
    gradientEnd: "#8B8E93",
  },
  fasting: {
    stroke: ACCENT.mint,
    bg: ACCENT.mintBg,
    glow: ACCENT.mint,
    dot: ACCENT.mint,
    gradientStart: ACCENT.mint,
    gradientEnd: ACCENT.mintLight,
  },
  eating: {
    stroke: ACCENT.coral,
    bg: ACCENT.coralBg,
    glow: ACCENT.coral,
    dot: ACCENT.coral,
    gradientStart: ACCENT.coral,
    gradientEnd: ACCENT.coralLight,
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
  isOver = false,
  schedule,
}: FastingTimerProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [showElapsed, setShowElapsed] = useState(false);
  const size = 310;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const colors = COLORS[status];

  useEffect(() => {
    const pct = totalMinutes > 0 ? elapsedMinutes / totalMinutes : 0;
    const target = Math.min(pct, 1);

    if (status === "idle") {
      progress.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = withSpring(target, { damping: 15, stiffness: 120 });
    }
  }, [elapsedMinutes, totalMinutes, status]);

  useEffect(() => {
    if (status === "idle") {
      glowOpacity.value = withTiming(0, { duration: 300 });
      return;
    }
    glowOpacity.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [status]);

  const progressAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const glowAnimatedProps = useAnimatedProps(() => ({
    opacity: 0.03 + glowOpacity.value * 0.07,
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
          <Defs>
            <LinearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.gradientStart} />
              <Stop offset="1" stopColor={colors.gradientEnd} />
            </LinearGradient>
          </Defs>
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
            strokeWidth={strokeWidth + 4}
            fill="none"
            stroke={colors.glow}
            animatedProps={glowAnimatedProps}
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke="url(#progressGrad)"
            strokeDasharray={circumference}
            strokeLinecap="round"
            animatedProps={progressAnimatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={7}
            fill={colors.dot}
            animatedProps={dotAnimatedProps}
          />
        </Svg>

        <View className="absolute items-center justify-center">
          {status === "idle" ? (
            <>
              <Text
                style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }}
                className="text-2xl mb-1"
              >
                Ready to Fast?
              </Text>
              <Text style={{ color: c.textMuted }} className="text-sm">
                Tap below to begin
              </Text>
            </>
          ) : (
            <>
              <Text
                style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_600SemiBold" }}
                className="text-xs tracking-widest mb-2"
              >
                {status === "fasting"
                  ? `FASTING${schedule ? `  ·  ${schedule}` : ""}`
                  : `EATING${schedule ? `  ·  ${schedule}` : ""}`}
              </Text>
              <Pressable
                onPress={() => setShowElapsed((prev) => !prev)}
                hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
                className="items-center"
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${showElapsed ? "remaining" : "elapsed"} time`}
              >
                <Text
                  style={{
                    color: c.text,
                    fontFamily: "PlusJakartaSans_700Bold",
                    borderBottomWidth: 1,
                    borderBottomColor: showElapsed || isOver ? colors.stroke : "transparent",
                    paddingBottom: 2,
                  }}
                  className="text-5xl tracking-tight"
                >
                  {showElapsed
                    ? `${pad(elapsedHours)}:${pad(elapsedMinutesPart)}:${pad(elapsedSeconds)}`
                    : isOver
                      ? `+${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
                      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`}
                </Text>
                <View className="flex-row items-center mt-2">
                  <HugeiconsIcon icon={Exchange01Icon} size={12} color={c.textMuted} strokeWidth={1.5} />
                  <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-xs ml-1">
                    {showElapsed ? "elapsed" : isOver ? "over schedule" : "remaining"}
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
