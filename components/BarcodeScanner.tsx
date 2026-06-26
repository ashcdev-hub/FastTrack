import React, { useState, useRef } from "react";
import { Pressable, View, Text, ActivityIndicator, Modal } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";

type BarcodeScannerProps = {
  visible: boolean;
  onClose: () => void;
  onProductFound: (product: {
    name: string;
    brand: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    serving_size?: string;
  }) => void;
};

export function BarcodeScanner({ visible, onClose, onProductFound }: BarcodeScannerProps) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const scannedRef = useRef(false);

  const handleBarcodeScanned = async (event: { data: string; type: string }) => {
    if (scannedRef.current || lookupLoading) return;
    scannedRef.current = true;
    setLookupLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("food-search", {
        body: { barcode: event.data },
      });

      if (fnError) throw new Error(fnError.message);

      if (data?.error) {
        setError(data.error);
        scannedRef.current = false;
        setLookupLoading(false);
        return;
      }

      const product = data?.products?.[0];
      if (!product) {
        setError("Product not found");
        scannedRef.current = false;
        setLookupLoading(false);
        return;
      }

      onProductFound({
        name: product.name,
        brand: product.brand,
        calories: product.nutrition.calories,
        protein_g: product.nutrition.protein,
        carbs_g: product.nutrition.carbs,
        fat_g: product.nutrition.fat,
        serving_size: product.serving_size,
      });

      onClose();
    } catch (e: any) {
      setError("Failed to look up product. Try again.");
      scannedRef.current = false;
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Permission not yet determined */}
      {!permission ? (
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: c.bg }}>
          <ActivityIndicator size="large" color={ACCENT.lime} />
        </View>
      ) : !permission.granted ? (
        <View className="flex-1 items-center justify-center px-8" style={{ backgroundColor: c.bg }}>
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-xl text-center mb-3">
            Camera Access Required
          </Text>
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-center mb-8">
            Allow camera access to scan barcodes on food packaging
          </Text>
          <Pressable
            onPress={requestPermission}
            className="rounded-xl py-3 px-8"
            style={{ backgroundColor: ACCENT.lime }}
          >
            <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }}>
              Grant Permission
            </Text>
          </Pressable>
          <Pressable onPress={onClose} className="mt-4">
            <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }}>Cancel</Text>
          </Pressable>
        </View>
      ) : (
        <View className="flex-1" style={{ backgroundColor: "#000" }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
            }}
            onBarcodeScanned={scanning || lookupLoading ? undefined : handleBarcodeScanned}
          >
            <View className="flex-1 items-center justify-center">
              <View className="absolute top-0 left-0 right-0 flex-row justify-between items-center px-6 pt-12">
                <Pressable
                  onPress={onClose}
                  className="p-2 rounded-full"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                  <MaterialCommunityIcons name="close-circle-outline" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={{ color: "#FFFFFF", fontFamily: "SpaceGrotesk_600SemiBold" }} className="text-sm">
                  Scan Barcode
                </Text>
                <View className="w-10" />
              </View>

              <View
                style={{
                  width: 260, height: 260, borderWidth: 2, borderColor: ACCENT.lime,
                  borderRadius: 16, backgroundColor: "transparent",
                }}
              >
                <View style={{ position: "absolute", top: -1, left: -1, width: 32, height: 32, borderTopWidth: 3, borderLeftWidth: 3, borderColor: ACCENT.lime, borderTopLeftRadius: 16 }} />
                <View style={{ position: "absolute", top: -1, right: -1, width: 32, height: 32, borderTopWidth: 3, borderRightWidth: 3, borderColor: ACCENT.lime, borderTopRightRadius: 16 }} />
                <View style={{ position: "absolute", bottom: -1, left: -1, width: 32, height: 32, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: ACCENT.lime, borderBottomLeftRadius: 16 }} />
                <View style={{ position: "absolute", bottom: -1, right: -1, width: 32, height: 32, borderBottomWidth: 3, borderRightWidth: 3, borderColor: ACCENT.lime, borderBottomRightRadius: 16 }} />
              </View>

              <Text
                style={{ color: "#FFFFFF", fontFamily: "Inter_400Regular" }}
                className="text-sm mt-6 text-center px-8"
              >
                Align the barcode within the frame
              </Text>

              {(lookupLoading || error) && (
                <View className="absolute bottom-32 left-8 right-8 items-center">
                  {lookupLoading ? (
                    <View className="flex-row items-center gap-2 rounded-xl px-5 py-3" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                      <ActivityIndicator size="small" color={ACCENT.lime} />
                      <Text style={{ color: "#FFFFFF", fontFamily: "Inter_400Regular" }} className="text-sm">
                        Looking up product...
                      </Text>
                    </View>
                  ) : error ? (
                    <View className="rounded-xl px-5 py-3" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
                      <Text style={{ color: ACCENT.rose, fontFamily: "Inter_400Regular" }} className="text-sm text-center">{error}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }} className="text-xs text-center mt-1">
                        Try scanning again
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          </CameraView>
        </View>
      )}
    </Modal>
  );
}
