import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import type { User, Session } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const redirectUrl = Linking.createURL("/auth/callback");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName ?? null },
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signInWithGoogle = async () => {
    try {
      const { GoogleSignin } = await import("@react-native-google-signin/google-signin");
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_AUTH_WEB_CLIENT_ID,
      });
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.data?.idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.data.idToken,
        });
        if (!error && response.data.user?.name) {
          const name = response.data.user.name;
          await supabase.auth.updateUser({ data: { display_name: name } }).catch(() => {});
        }
        return { error };
      }
      return { error: new Error("No ID token received") };
    } catch (e: any) {
      if (e?.code === "ERR_REQUEST_CANCELED" || e?.message?.includes("CANCELED")) {
        return { error: null }; // User cancelled — not an error
      }
      return { error: e };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return { user, session, loading, signUp, signIn, signInWithGoogle, signOut };
}
