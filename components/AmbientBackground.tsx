import React, { useEffect } from "react";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from "react-native-reanimated";
import { useThemeStore } from "@/lib/theme-store";
import { getAccentColors } from "@/lib/theme-colors";

type FloatingCircleProps = {
  size: number;
  xOffset: number;
  yOffset: number;
  color: string;
  durationX: number;
  durationY: number;
  delay: number;
};

function FloatingCircle({ size, xOffset, yOffset, color, durationX, durationY, delay }: FloatingCircleProps) {
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    x.value = withRepeat(
      withSequence(
        withTiming(xOffset, { duration: durationX, easing: Easing.inOut(Easing.sin) }),
        withTiming(-xOffset, { duration: durationX, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    y.value = withRepeat(
      withSequence(
        withTiming(yOffset, { duration: durationY, easing: Easing.inOut(Easing.sin) }),
        withTiming(-yOffset, { duration: durationY, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    opacity.value = withTiming(1, { duration: 1000 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    opacity: opacity.value * 0.06,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: -size / 2,
          top: -size / 2,
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

export function AmbientBackground() {
  const { theme } = useThemeStore();
  const accent = getAccentColors(theme);

  return (
    <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      <FloatingCircle size={300} xOffset={40} yOffset={30} color={accent.lime} durationX={8000} durationY={10000} delay={0} />
      <FloatingCircle size={200} xOffset={-30} yOffset={50} color={accent.cyan} durationX={11000} durationY={9000} delay={500} />
      <FloatingCircle size={250} xOffset={50} yOffset={-20} color={accent.rose} durationX={9000} durationY={12000} delay={1000} />
    </Animated.View>
  );
}
