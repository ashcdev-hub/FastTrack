import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, Platform } from "react-native";
import type { ToastType } from "@/hooks/useToast";

type ToastProps = {
  visible: boolean;
  message: string;
  type: ToastType;
};

export function Toast({ visible, message, type }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setRendered(false);
      });
    }
  }, [visible, opacity]);

  if (!rendered) return null;

  const bgColor = type === "success" ? "#16A34A" : "#DC2626";

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        opacity,
        position: "absolute",
        top: Platform.OS === "web" ? 20 : 60,
        alignSelf: "center",
        zIndex: 9999,
        maxWidth: 360,
        width: "90%",
      }}
    >
      <Text
        style={{
          backgroundColor: bgColor,
          color: "#FFFFFF",
          textAlign: "center",
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 12,
          fontSize: 14,
          fontWeight: "600",
          overflow: "hidden",
          ...(Platform.OS === "web" ? { boxShadow: "0 4px 12px rgba(0,0,0,0.25)" } : {}),
        }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}
