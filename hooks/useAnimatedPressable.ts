import { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from "react-native-reanimated";

const SPRING_CONFIG = { damping: 16, stiffness: 200 };
const TIMING_CONFIG = { duration: 80, easing: Easing.out(Easing.quad) };

export function useAnimatedPressable() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withTiming(0.97, TIMING_CONFIG);
  };

  const onPressOut = () => {
    scale.value = withSpring(1, SPRING_CONFIG);
  };

  return { animatedStyle, onPressIn, onPressOut, scale };
}
