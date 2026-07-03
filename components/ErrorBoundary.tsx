import React, { Component, ReactNode, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useThemeStore } from "@/lib/theme-store";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";

function DefaultFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: c.bg }}>
      <MaterialCommunityIcons name="alert-circle-outline" size={64} color={ACCENT.rose} />
      <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 20, marginTop: 16 }}>
        Something went wrong
      </Text>
      <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
        An unexpected error occurred. Please try again.
      </Text>

      <View className="w-full" style={{ gap: 12, marginTop: 24 }}>
        <Pressable
          onPress={onReset}
          className="w-full py-4 rounded-xl items-center"
          style={{ backgroundColor: accent.lime }}
        >
          <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold", fontSize: 16 }}>
            Try Again
          </Text>
        </Pressable>
        <Pressable
          onPress={() => { onReset(); setTimeout(() => router.replace("/(tabs)"), 50); }}
          className="w-full py-3.5 rounded-xl items-center"
          style={{ backgroundColor: c.buttonBg, borderWidth: 1, borderColor: c.cardBorder }}
        >
          <Text style={{ color: c.text, fontFamily: "Inter_700Bold", fontSize: 15 }}>
            Go Home
          </Text>
        </Pressable>
      </View>

      {__DEV__ && error && (
        <View className="w-full" style={{ marginTop: 24 }}>
          <Pressable onPress={() => setShowDetails(!showDetails)} className="py-2 items-center">
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 12 }}>
              {showDetails ? "Hide details" : "Show details"}
            </Text>
          </Pressable>
          {showDetails && (
            <View
              className="rounded-xl p-4"
              style={{ backgroundColor: c.cardBg, borderWidth: 1, borderColor: c.cardBorder }}
            >
              <Text style={{ color: ACCENT.rose, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                {error.message}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

type Props = {
  children: ReactNode;
  onError?: (error: Error, stack: string) => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
  resetKey: number;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, resetKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info.componentStack ?? "");
  }

  reset = () => {
    this.setState({ hasError: false, error: null, resetKey: this.state.resetKey + 1 });
  };

  render() {
    if (this.state.hasError) {
      return <DefaultFallback error={this.state.error} onReset={this.reset} />;
    }
    return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
  }
}
