import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { useConnectivity } from "@/hooks/useConnectivity";
import { getThemeColors } from "@/lib/theme-colors";
import { useThemeStore } from "@/lib/theme-store";

export function OfflineBanner() {
  const { isOffline } = useConnectivity();
  const { theme } = useThemeStore();
  const colors = getThemeColors(theme);
  const slideAnim = useRef(new Animated.Value(-50)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOffline ? 0 : -50,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [isOffline, slideAnim]);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: "#F59E0B",
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#000", fontSize: 13, fontWeight: "600" }}>
        You're offline — changes will sync when reconnected
      </Text>
    </Animated.View>
  );
}
