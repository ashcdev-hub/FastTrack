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
import { getFastingPhase } from "@/lib/fasting-phases";
import { isSameDay, addDays, format } from "date-fns";

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
  startedAt?: Date | null;
  eatWindowOpensAt?: Date | null;
  windowClosesAt?: Date | null;
};

function formatScheduleDate(date: Date): string {
  const today = new Date();
  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, addDays(today, 1))) return "Tomorrow";
  return format(date, "EEE");
}

function formatScheduleTime(date: Date): string {
  return format(date, "h:mm a");
}

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
  startedAt,
  eatWindowOpensAt,
  windowClosesAt,
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

  const scheduleColumns =
    status === "fasting" && startedAt
      ? [
          { label: "Started", date: startedAt, color: ACCENT.lime },
          { label: "Eat window", date: eatWindowOpensAt!, color: ACCENT.cyan },
          { label: "Window closes", date: windowClosesAt!, color: ACCENT.coral },
        ]
      : status === "eating" && eatWindowOpensAt
        ? [
            { label: "Started eating", date: eatWindowOpensAt, color: ACCENT.cyan },
            { label: "Window closes", date: windowClosesAt!, color: ACCENT.coral },
          ]
        : null;

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
      <View className="absolute z-10 items-center" style={{ width: size * 0.76 }}>
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
            {/* Time display — pressable to toggle elapsed/remaining */}
            <Pressable onPress={() => setShowElapsed((prev) => !prev)} className="items-center">
              <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 11, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>
                {showElapsed ? "ELAPSED" : "REMAINING"}
              </Text>
              <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 38, letterSpacing: -1, marginBottom: 10 }}>
                {displayTime}
              </Text>
            </Pressable>

            {/* Phase badge */}
            {status === "fasting" && (
              <View className="flex-row items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: c.elevated, borderWidth: 1, borderColor: "rgba(68,73,51,0.3)" }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeColor }} />
                <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12 }}>
                  {getFastingPhase(elapsedMinutes).label}
                </Text>
              </View>
            )}
            {status === "eating" && (
              <View className="flex-row items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: c.elevated, borderWidth: 1, borderColor: "rgba(50,80,90,0.3)" }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeColor }} />
                <Text style={{ color: c.text, fontFamily: "SpaceGrotesk_700Bold", fontSize: 12 }}>
                  EATING WINDOW
                </Text>
              </View>
            )}

            {/* Schedule strip */}
            {scheduleColumns && (
              <View className="flex-row justify-between mt-5" style={{ width: "100%" }}>
                {scheduleColumns.map((col) => (
                  <View key={col.label} className="items-center" style={{ flex: 1 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: col.color, marginBottom: 4 }} />
                    <Text style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold", fontSize: 10, textAlign: "center", marginBottom: 2 }}>
                      {col.label}
                    </Text>
                    <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center" }}>
                      {formatScheduleDate(col.date)}
                    </Text>
                    <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 12, textAlign: "center" }}>
                      {formatScheduleTime(col.date)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}
