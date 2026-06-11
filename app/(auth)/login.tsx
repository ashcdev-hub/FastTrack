import React, { useState } from "react";
import { Pressable,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: string, p?: string) => {
    const loginEmail = e ?? email;
    const loginPass = p ?? password;
    if (!loginEmail || !loginPass) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await signIn(loginEmail, loginPass);
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: "#0F172A" }}
    >
      <View className="flex-1 justify-center px-8">
        <Text style={{ color: "#FFFFFF" }} className="text-4xl font-bold text-center mb-2">
          FastTrack
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.5)" }} className="text-center mb-10">
          Intermittent Fasting & Macro Tracker
        </Text>

        {error ? (
          <View style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" }} className="rounded-xl p-3 mb-4">
            <Text style={{ color: "#EF4444" }} className="text-sm text-center">{error}</Text>
          </View>
        ) : null}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="rgba(255,255,255,0.4)"
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#FFFFFF" }}
          className="rounded-xl px-4 py-4 mb-3"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="rgba(255,255,255,0.4)"
          secureTextEntry
          style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#FFFFFF" }}
          className="rounded-xl px-4 py-4 mb-6"
        />

        <Pressable
          onPress={() => handleLogin()}
          disabled={loading}
          style={{ backgroundColor: "#3B82F6" }}
          className="rounded-xl py-4 mb-4"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#FFFFFF" }} className="text-center font-semibold text-lg">
              Sign In
            </Text>
          )}
        </Pressable>

        {/* Quick test login */}
        <Pressable
          onPress={() => handleLogin("test@fasttrack.app", "test1234")}
          disabled={loading}
          style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" }}
          className="rounded-xl py-4 mb-6"
        >
          <Text style={{ color: "rgba(255,255,255,0.7)" }} className="text-center font-medium">
            Quick Test Login
          </Text>
        </Pressable>

        <Link href="/(auth)/signup" asChild>
          <Pressable>
            <Text style={{ color: "rgba(255,255,255,0.5)" }} className="text-center">
              Don&apos;t have an account?{" "}
              <Text style={{ color: "#60A5FA" }} className="font-medium">Sign Up</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
