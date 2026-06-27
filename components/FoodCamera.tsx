import React, { useState, useRef } from "react";
import { Pressable, View, Text, Modal, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

type FoodCameraProps = {
  visible: boolean;
  onClose: () => void;
  onProductsFound: (products: any[]) => void;
};

export function FoodCamera({ visible, onClose, onProductsFound }: FoodCameraProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [permission, requestPermission] = useCameraPermissions();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const handleCapture = async () => {
    if (!cameraRef.current || analyzing) return;
    setError(null);
    setAnalyzing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.3 });
      if (photo?.base64) {
        const { data } = await supabase.functions.invoke("food-photo", {
          body: { image: photo.base64 },
        });
        if (data?.products && data.products.length > 0) {
          onProductsFound(data.products);
          onClose();
        } else {
          setError("Couldn't identify food. Try again.");
        }
      }
    } catch {
      setError("Failed to analyze photo. Try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {!permission ? (
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: c.bg }}>
          <ActivityIndicator size="large" color={ACCENT.lime} />
        </View>
      ) : !permission.granted ? (
        <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: c.bg }}>
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20, textAlign: "center", marginBottom: 12 }}>
            Camera Access Required
          </Text>
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
            Allow camera access to take food photos for AI analysis
          </Text>
          <Pressable onPress={requestPermission} className="rounded-xl py-3 px-8" style={{ backgroundColor: ACCENT.lime }}>
            <Text style={{ color: "#161e00", fontFamily: "Inter_700Bold", fontSize: 15 }}>Grant Permission</Text>
          </Pressable>
          <Pressable onPress={onClose} className="mt-4">
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 14 }}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1" style={{ backgroundColor: "#000" }}>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" autofocus="on">
            <View className="flex-1">
              <View className="flex-row justify-between items-center px-6 pt-12">
                <Pressable onPress={onClose} style={{ padding: 8, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.5)" }}>
                  <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 15 }}>Food Photo</Text>
                <View className="w-10" />
              </View>

              <View className="flex-1 justify-center items-center">
                <View style={{ width: 220, height: 220, borderWidth: 2, borderColor: ACCENT.lime, borderRadius: 12, borderStyle: "dashed", opacity: 0.6 }} />
                <Text style={{ color: "#FFFFFF", fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 16, opacity: 0.8 }}>
                  Frame the food in the square
                </Text>
              </View>

              <View className="items-center pb-16">
                {error && (
                  <Text style={{ color: ACCENT.rose, fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 12, textAlign: "center" }}>
                    {error}
                  </Text>
                )}
                <Pressable
                  onPress={handleCapture}
                  disabled={analyzing}
                  style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: analyzing ? "rgba(195,244,0,0.4)" : ACCENT.lime, alignItems: "center", justifyContent: "center" }}
                >
                  {analyzing ? (
                    <ActivityIndicator size="small" color="#161e00" />
                  ) : (
                    <MaterialCommunityIcons name="camera" size={32} color="#161e00" />
                  )}
                </Pressable>
                {analyzing && (
                  <Text style={{ color: "#FFFFFF", fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 8 }}>
                    Analyzing food...
                  </Text>
                )}
              </View>
            </View>
          </CameraView>
        </View>
      )}
    </Modal>
  );
}
