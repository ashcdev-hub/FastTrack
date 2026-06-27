import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20;

    const check = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace("/(tabs)");
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(check, 500);
          } else {
            router.replace("/(auth)/login");
          }
        }
      });
    };

    // Small delay to let the auth state propagate
    setTimeout(check, 1000);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#131313" }}>
      <ActivityIndicator size="large" color="#c3f400" />
    </View>
  );
}
