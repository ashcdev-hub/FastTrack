import { useEffect } from "react";
import { useSharedValue, useAnimatedProps, withTiming, Easing } from "react-native-reanimated";

export function useAnimatedCounter(target: number, duration = 800) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [target, duration]);

  const displayValue = useSharedValue(0);

  return { progress, displayValue };
}
