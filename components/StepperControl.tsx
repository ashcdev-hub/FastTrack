import React from "react";
import { Pressable, View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors } from "@/lib/theme-colors";

type StepperControlProps = {
  value: number;
  label?: string;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
};

export function StepperControl({
  value,
  label = "REPS TODAY",
  onIncrement,
  onDecrement,
  min = 0,
}: StepperControlProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);

  return (
    <View className="flex-row items-center justify-between bg-surface-container-high rounded p-1">
      <Pressable
        onPress={onDecrement}
        className="w-touch-target h-touch-target items-center justify-center rounded active:scale-90"
        style={{ backgroundColor: "transparent" }}
      >
        <MaterialCommunityIcons name="minus" size={20} color={c.textSecondary} />
      </Pressable>
      <View className="flex-col items-center">
        <Text
          style={{ color: c.text, fontFamily: "SpaceGrotesk_600SemiBold" }}
          className="text-[32px] leading-none"
        >
          {value}
        </Text>
        <Text
          style={{ color: c.textMuted, fontFamily: "SpaceGrotesk_700Bold" }}
          className="text-[10px] tracking-widest"
        >
          {label}
        </Text>
      </View>
      <Pressable
        onPress={onIncrement}
        className="w-touch-target h-touch-target items-center justify-center rounded active:scale-90"
        style={{ backgroundColor: "transparent" }}
      >
        <MaterialCommunityIcons name="plus" size={20} color={c.textSecondary} />
      </Pressable>
    </View>
  );
}
