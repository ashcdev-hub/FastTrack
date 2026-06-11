import React, { useState } from "react";
import { Pressable, View, Text, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getThemeColors, ACCENT } from "@/lib/theme-colors";
import { useThemeStore } from "@/lib/theme-store";

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
    if (error) setError(error.message);
    setLoading(false);
  };

  const inputStyle = { backgroundColor: c.inputBg, color: c.text, fontFamily: "PlusJakartaSans_500Medium" as const };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1" style={{ backgroundColor: c.bg }}>
      <View className="flex-1 justify-center px-6">
        <Text style={{ color: c.text, fontFamily: "PlusJakartaSans_700Bold" }} className="text-4xl text-center mb-2">
          FastTrack
        </Text>
        <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-center mb-10">
          Intermittent Fasting & Macro Tracker
        </Text>

        {error ? (
          <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: ACCENT.roseBg, borderWidth: 1, borderColor: ACCENT.roseBorder }}>
            <Text style={{ color: ACCENT.rose, fontFamily: "PlusJakartaSans_500Medium" }} className="text-sm text-center">{error}</Text>
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
          className="rounded-xl py-4 mb-4" style={{ backgroundColor: ACCENT.mint }}
        >
          {loading ? (
            <ActivityIndicator color={c.textOnAccent} />
          ) : (
            <Text style={{ color: c.textOnAccent, fontFamily: "PlusJakartaSans_700Bold" }} className="text-center text-lg">
              Sign In
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => handleLogin("test@fasttrack.app", "test1234")} disabled={loading}
          className="rounded-xl py-4 mb-6" style={{ backgroundColor: c.buttonBg, borderWidth: 1, borderColor: c.cardBorder }}
        >
          <Text style={{ color: c.textSecondary, fontFamily: "PlusJakartaSans_500Medium" }} className="text-center">
            Quick Test Login
          </Text>
        </Pressable>

        <Link href="/(auth)/signup" asChild>
          <Pressable>
            <Text style={{ color: c.textMuted, fontFamily: "PlusJakartaSans_400Regular" }} className="text-center">
              Don&apos;t have an account?{" "}
              <Text style={{ color: ACCENT.mint, fontFamily: "PlusJakartaSans_600SemiBold" }}>Sign Up</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
