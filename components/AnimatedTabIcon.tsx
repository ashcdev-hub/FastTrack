import React, { useEffect } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, Easing } from "react-native-reanimated";

type AnimatedTabIconProps = {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: number;
  color: string;
  focused: boolean;
};

export function AnimatedTabIcon({ name, size = 22, color, focused }: AnimatedTabIconProps) {
  const scale = useSharedValue(1);
  const pulse = useSharedValue(0.95);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.15, { damping: 12, stiffness: 200 });
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      pulse.value = withRepeat(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      pulse.value = 1;
      scale.value = withSpring(1, { damping: 16, stiffness: 200 });
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { scale: focused ? pulse.value : 1 },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <MaterialCommunityIcons name={name} size={size} color={color} />
    </Animated.View>
  );
}
