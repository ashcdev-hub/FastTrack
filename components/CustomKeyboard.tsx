import React, { useState } from "react";
import { Pressable, View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const KEY_H = 46;
const GAP = 6;

type CustomKeyboardProps = {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSearch: () => void;
};

export function CustomKeyboard({ onKeyPress, onBackspace, onSearch }: CustomKeyboardProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const insets = useSafeAreaInsets();
  const [shifted, setShifted] = useState(true);

  const keyStyle = {
    height: KEY_H,
    borderRadius: 7,
    backgroundColor: c.buttonBg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const handleKey = (letter: string) => {
    onKeyPress(shifted ? letter : letter.toLowerCase());
  };

  return (
    <View style={{ backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.divider }}>
      <View className="items-center pt-2 pb-2">
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: c.divider }} />
      </View>

      {ROWS.map((row, ri) => (
        <View key={ri} style={{ flexDirection: "row", justifyContent: "center", marginBottom: GAP, paddingHorizontal: 4 }}>
          {row.map((letter) => (
            <Pressable key={letter} onPress={() => handleKey(letter)}
              style={[keyStyle, { width: 33, marginHorizontal: GAP / 2 }]}>
              <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 18 }}>
                {shifted ? letter : letter.toLowerCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}

      <View style={{ flexDirection: "row", justifyContent: "center", paddingBottom: 6 + insets.bottom, paddingHorizontal: 4 }}>
        <Pressable onPress={() => setShifted((s) => !s)}
          style={[keyStyle, { width: 46, marginHorizontal: GAP / 2, backgroundColor: shifted ? c.buttonBg : ACCENT.lime }]}>
          <MaterialCommunityIcons name="arrow-up-bold" size={22} color={shifted ? c.text : "#161e00"} />
        </Pressable>
        <Pressable onPress={() => onKeyPress(" ")}
          style={[keyStyle, { flex: 1, maxWidth: 160, marginHorizontal: GAP / 2 }]}>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 1 }}>SPACE</Text>
        </Pressable>
        <Pressable onPress={onSearch}
          style={[keyStyle, { width: 60, marginHorizontal: GAP / 2, backgroundColor: ACCENT.lime }]}>
          <MaterialCommunityIcons name="magnify" size={24} color="#161e00" />
        </Pressable>
      </View>
    </View>
  );
}
