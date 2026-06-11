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

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    if (!displayName || !email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    const { error: signUpError } = await signUp(email, password, displayName);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Profile is auto-created by database trigger on auth.users insert
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <View className="flex-1 justify-center px-8" style={{ backgroundColor: "#0F172A" }}>
        <Text style={{ color: "#FFFFFF" }} className="text-3xl font-bold text-center mb-4">
          Check Your Email
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.5)" }} className="text-center mb-8">
          We sent a confirmation link to {email}
        </Text>
        <Link href="/(auth)/login" asChild>
          <Pressable style={{ backgroundColor: "#3B82F6" }} className="rounded-xl py-4">
            <Text style={{ color: "#FFFFFF" }} className="text-center font-semibold text-lg">
              Back to Sign In
            </Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      style={{ backgroundColor: "#0F172A" }}
    >
      <View className="flex-1 justify-center px-8">
        <Text style={{ color: "#FFFFFF" }} className="text-4xl font-bold text-center mb-2">
          Create Account
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.5)" }} className="text-center mb-10">
          Start tracking your fasting journey
        </Text>

        {error ? (
          <View style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" }} className="rounded-xl p-3 mb-4">
            <Text style={{ color: "#EF4444" }} className="text-sm text-center">{error}</Text>
          </View>
        ) : null}

        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display Name"
          placeholderTextColor="rgba(255,255,255,0.4)"
          autoCapitalize="words"
          style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#FFFFFF" }}
          className="rounded-xl px-4 py-4 mb-3"
        />
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
          className="rounded-xl px-4 py-4 mb-3"
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          placeholderTextColor="rgba(255,255,255,0.4)"
          secureTextEntry
          style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#FFFFFF" }}
          className="rounded-xl px-4 py-4 mb-6"
        />

        <Pressable
          onPress={handleSignup}
          disabled={loading}
          style={{ backgroundColor: "#3B82F6" }}
          className="rounded-xl py-4 mb-4"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#FFFFFF" }} className="text-center font-semibold text-lg">
              Sign Up
            </Text>
          )}
        </Pressable>

        <Link href="/(auth)/login" asChild>
          <Pressable>
            <Text style={{ color: "rgba(255,255,255,0.5)" }} className="text-center">
              Already have an account?{" "}
              <Text style={{ color: "#60A5FA" }} className="font-medium">Sign In</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
