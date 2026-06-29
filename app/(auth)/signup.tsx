import React, { useState } from "react";
import { Pressable, View, Text, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { useThemeStore } from "@/lib/theme-store";

export default function SignupScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignup = async () => {
    if (!displayName || !email || !password) { setError("Please fill in all fields"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setError("");
    const { error: signUpError } = await signUp(email, password, displayName);
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  };

  const inputStyle = { backgroundColor: c.inputBg, color: c.text, fontFamily: "Inter_400Regular" as const };

  if (success) {
    return (
      <View className="flex-1 justify-center px-6" style={{ backgroundColor: c.bg }}>
        <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-3xl text-center mb-4">
          Check Your Email
        </Text>
        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-center mb-8">
          We sent a confirmation link to {email}
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable className="rounded-xl py-4" style={{ backgroundColor: accent.lime }}>
            <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }} className="text-center text-lg">
              Back to Sign In
            </Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1" style={{ backgroundColor: c.bg }}>
      <View className="flex-1 justify-center px-6">
        <Text style={{ color: c.text, fontFamily: "Inter_700Bold" }} className="text-4xl text-center mb-2">
          Create Account
        </Text>
        <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-center mb-10">
          Start tracking your fasting journey
        </Text>

        {error ? (
          <View className="rounded-xl p-3 mb-4" style={{ backgroundColor: ACCENT.roseBg, borderWidth: 1, borderColor: ACCENT.roseBorder }}>
            <Text style={{ color: ACCENT.rose, fontFamily: "Inter_400Regular" }} className="text-sm text-center">{error}</Text>
          </View>
        ) : null}

        <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Display Name" placeholderTextColor={c.placeholder}
          autoCapitalize="words" className="rounded-xl px-4 py-4 mb-3" style={inputStyle} />
        <TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={c.placeholder}
          autoCapitalize="none" keyboardType="email-address" className="rounded-xl px-4 py-4 mb-3" style={inputStyle} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={c.placeholder}
          secureTextEntry className="rounded-xl px-4 py-4 mb-3" style={inputStyle} />
        <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm Password" placeholderTextColor={c.placeholder}
          secureTextEntry className="rounded-xl px-4 py-4 mb-6" style={inputStyle} />

        <Pressable onPress={handleSignup} disabled={loading} className="rounded-xl py-4 mb-4" style={{ backgroundColor: accent.lime }}>
          {loading ? (
            <ActivityIndicator color={c.textOnAccent} />
          ) : (
            <Text style={{ color: c.textOnAccent, fontFamily: "Inter_700Bold" }} className="text-center text-lg">
              Sign Up
            </Text>
          )}
        </Pressable>

        <View className="flex-row items-center mb-4">
          <View className="flex-1" style={{ height: 1, backgroundColor: c.divider }} />
          <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 13, marginHorizontal: 12 }}>or</Text>
          <View className="flex-1" style={{ height: 1, backgroundColor: c.divider }} />
        </View>

        <Pressable
          onPress={async () => {
            setGoogleLoading(true);
            const { error: googleErr } = await signInWithGoogle();
            setGoogleLoading(false);
            if (googleErr) setError(googleErr.message);
          }}
          disabled={googleLoading}
          className="rounded-xl py-4 mb-6 flex-row items-center justify-center gap-3"
          style={{ backgroundColor: c.buttonBg, borderWidth: 1, borderColor: c.cardBorder }}
        >
          {googleLoading ? (
            <ActivityIndicator color={c.textSecondary} />
          ) : (
            <>
              <MaterialCommunityIcons name="google" size={22} color={c.textSecondary} />
              <Text style={{ color: c.textSecondary, fontFamily: "Inter_400Regular" }} className="text-center">
                Continue with Google
              </Text>
            </>
          )}
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-center">
              Already have an account?{" "}
              <Text style={{ color: accent.lime, fontFamily: "SpaceGrotesk_600SemiBold" }}>Sign In</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
