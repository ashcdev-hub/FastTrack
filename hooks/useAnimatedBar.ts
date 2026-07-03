import { useEffect } from "react";
import { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";

export function useAnimatedBar(pct: number) {
  const widthSv = useSharedValue(0);

  useEffect(() => {
    widthSv.value = withTiming(pct, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [pct]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthSv.value}%`,
  }));

  return animatedStyle;
}
