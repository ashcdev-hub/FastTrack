import React, { useState } from "react";
import { Pressable, View, Text, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from "react-native";
import { Link, router } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { useAuth } from "@/hooks/useAuth";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { useThemeStore } from "@/lib/theme-store";

const BACKGROUND_VIDEO = require("../../assets/videos/background.mp4");

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: string, p?: string) => {
    const loginEmail = e ?? email;
    const loginPass = p ?? password;
    if (!loginEmail || !loginPass) { setError("Please fill in all fields"); return; }
    setLoading(true);
    setError("");
    const { error } = await signIn(loginEmail, loginPass);
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.replace("/");
  };

  const inputStyle = { backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular" as const };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {Platform.OS !== "web" && (
        <>
          <Video
            source={BACKGROUND_VIDEO}
            style={StyleSheet.absoluteFill}
            shouldPlay
            isLooping
            isMuted
            resizeMode={ResizeMode.COVER}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.75)" }]} />
        </>
      )}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <View className="flex-1 justify-center px-6">
          <View className="flex-row justify-center items-center gap-3 mb-2">
            <Image source={require("../../assets/icon.png")} style={{ width: 40, height: 40, borderRadius: 8 }} />
            <Text style={{ color: ACCENT.lime, fontFamily: "Inter_800ExtraBold", fontSize: 48, letterSpacing: -1 }}>FastTrack</Text>
          </View>
        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 16 }} className="text-center mb-10">
          Intermittent Fasting, Workouts & Macro Tracker
        </Text>

        {error ? (
          <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: ACCENT.roseBg, borderWidth: 1, borderColor: ACCENT.roseBorder }}>
            <Text style={{ color: ACCENT.rose, fontFamily: "Inter_400Regular" }} className="text-sm text-center">{error}</Text>
          </View>
        ) : null}

        <TextInput
          value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={c.placeholder}
          autoCapitalize="none" keyboardType="email-address" className="rounded-xl px-4 py-4 mb-3" style={inputStyle}
        />
        <TextInput
          value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={c.placeholder}
          secureTextEntry className="rounded-xl px-4 py-4 mb-6" style={inputStyle}
        />

        <Pressable
          onPress={() => handleLogin()} disabled={loading}
          className="rounded-xl py-4 mb-4" style={{ backgroundColor: ACCENT.lime }}
        >
          {loading ? (
            <ActivityIndicator color={c.textOnAccent} />
          ) : (
            <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }} className="text-center text-lg">
              Sign In
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => handleLogin("test@fasttrack.app", "test1234")} disabled={loading}
          className="rounded-xl py-4 mb-6" style={{ backgroundColor: c.buttonBg, borderWidth: 1, borderColor: c.cardBorder }}
        >
          <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-center">
            Quick Test Login
          </Text>
        </Pressable>

        <Link href="/(auth)/signup" asChild>
          <Pressable>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-center">
              Don&apos;t have an account?{" "}
              <Text style={{ color: ACCENT.lime, fontFamily: "SpaceGrotesk_600SemiBold" }}>Sign Up</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
    </View>
  );
}
