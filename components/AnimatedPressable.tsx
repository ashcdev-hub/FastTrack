import React from "react";
import { Pressable, type PressableProps } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing } from "react-native-reanimated";

const SPRING_CONFIG = { damping: 16, stiffness: 200 };
const TIMING_CONFIG = { duration: 80, easing: Easing.out(Easing.quad) };

type AnimatedPressableProps = PressableProps & {
  children: React.ReactNode;
};

export function AnimatedPressable({ style, children, ...props }: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withTiming(0.97, TIMING_CONFIG); }}
      onPressOut={() => { scale.value = withSpring(1, SPRING_CONFIG); }}
      style={[style, { overflow: "visible" } as any]}
      {...props}
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}
