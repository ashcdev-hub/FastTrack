import React, { useState, useEffect } from "react";
import { Pressable, View, Text, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat, withSequence, Easing } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { Video, ResizeMode } from "expo-av";
import { useAuth } from "@/hooks/useAuth";
import { getThemeColors, ACCENT, getAccentColors } from "@/lib/theme-colors";
import { useThemeStore } from "@/lib/theme-store";

const BACKGROUND_VIDEO = require("../../assets/videos/background.mp4");

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const { theme } = useThemeStore();
  const c = getThemeColors(theme);
  const accent = getAccentColors(theme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const formY = useSharedValue(40);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 10, stiffness: 120 });
    logoOpacity.value = withTiming(1, { duration: 400 });

    setTimeout(() => {
      subtitleOpacity.value = withTiming(1, { duration: 300 });
      formOpacity.value = withTiming(1, { duration: 400 });
      formY.value = withSpring(0, { damping: 16, stiffness: 120 });
    }, 400);

    setTimeout(() => {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
    }, 800);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formY.value }],
    opacity: formOpacity.value,
  }));

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
          <LinearGradient
            colors={["rgba(0,0,0,0.85)", "rgba(0,0,0,0.70)", "rgba(0,0,0,0.85)"]}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <View className="flex-1 justify-center px-6">
            <Animated.View className="items-center mb-2" style={logoAnimatedStyle}>
              <View className="relative items-center justify-center">
                <Animated.View
                  style={[
                    {
                      position: "absolute",
                      width: 80, height: 80, borderRadius: 40,
                      backgroundColor: accent.lime,
                    },
                    glowAnimatedStyle,
                  ]}
                />
                <Image source={require("../../assets/icon.png")} style={{ width: 40, height: 40, borderRadius: 8, zIndex: 1 }} />
              </View>
              <Text style={{ color: accent.lime, fontFamily: "Inter_800ExtraBold", fontSize: 48, letterSpacing: -1, marginTop: 8 }}>
                FastTrack
              </Text>
            </Animated.View>
            <Animated.Text style={[{ color: c.textMuted, fontFamily: "Inter_400Regular", fontSize: 16, textAlign: "center", marginBottom: 40 }, subtitleAnimatedStyle]}>
              Intermittent Fasting, Workouts & Macro Tracker
            </Animated.Text>

          <Animated.View style={[formAnimatedStyle, { width: "100%" }]}>
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
          className="rounded-xl py-4 mb-4" style={{ backgroundColor: accent.lime }}
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

        <Link href="/(auth)/signup" asChild>
          <Pressable>
            <Text style={{ color: c.textMuted, fontFamily: "Inter_400Regular" }} className="text-center">
              Don&apos;t have an account?{" "}
              <Text style={{ color: accent.lime, fontFamily: "SpaceGrotesk_600SemiBold" }}>Sign Up</Text>
            </Text>
          </Pressable>
        </Link>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
    </View>
  );
}
