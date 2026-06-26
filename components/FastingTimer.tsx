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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

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
  const size = 320;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const activeColor = status === "eating" ? ACCENT.cyan : ACCENT.lime;

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

  const pad = (n: number) => String(n).padStart(2, "0");

  const displayTime = showElapsed
    ? `${pad(elapsedHours)}:${pad(elapsedMinutesPart)}:${pad(elapsedSeconds)}`
    : isOver
      ? `+${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1c1b1b"
          strokeWidth={strokeWidth}
        />
        {status !== "idle" && (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth + 4}
            fill="none"
            stroke={activeColor}
            animatedProps={glowAnimatedProps}
          />
        )}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={status === "idle" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={status === "idle" ? circumference : 0}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {status !== "idle" && (
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={activeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            strokeDashoffset={0}
            animatedProps={progressAnimatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>

      {/* Center content */}
      <View className="absolute z-10 items-center">
        {status === "idle" ? (
          <>
            <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 8 }}>
              READY TO FAST?
            </Text>
            <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, textTransform: "uppercase" }}>
              Tap below to begin
            </Text>
          </>
        ) : (
          <>
            <Pressable onPress={() => setShowElapsed((prev) => !prev)} className="items-center">
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
                {showElapsed ? "ELAPSED" : "REMAINING"}
              </Text>
              <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 40, letterSpacing: -1, marginBottom: 12 }}>
                {displayTime}
              </Text>
            </Pressable>

            {status === "fasting" && (
              <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full" style={{ backgroundColor: c.elevated, borderWidth: 1, borderColor: "rgba(68,73,51,0.3)" }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeColor }} />
                <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: -0.3 }}>
                  AUTOPHAGY ACTIVE
                </Text>
              </View>
            )}

            {status === "eating" && (
              <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full" style={{ backgroundColor: c.elevated, borderWidth: 1, borderColor: "rgba(50,80,90,0.3)" }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeColor }} />
                <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, letterSpacing: -0.3 }}>
                  EATING WINDOW
                </Text>
              </View>
            )}

            <Pressable onPress={() => setShowElapsed((prev) => !prev)} className="flex-row items-center mt-3">
              <MaterialCommunityIcons name="swap-horizontal-bold" size={12} color={c.textMuted} />
              <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12, marginLeft: 4 }}>
                {showElapsed ? "remaining" : isOver ? "over schedule" : "elapsed"}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}
