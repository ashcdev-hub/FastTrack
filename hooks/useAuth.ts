import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import type { User, Session } from "@supabase/supabase-js";

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [, googleResponse, googlePrompt] = Google.useIdTokenAuthRequest({
    iosClientId: "467971760239-k02ta1j2psjhpttu2bt45fften9t0lf1.apps.googleusercontent.com",
    androidClientId: "467971760239-dogg4n6mfhghj481bqsbfovkh8lev4ld.apps.googleusercontent.com",
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_AUTH_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const idToken = googleResponse.params?.id_token;
      if (idToken) {
        supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        }).then(({ data: { user: u } }) => {
          if (u?.user_metadata?.full_name) {
            supabase.auth.updateUser({
              data: { display_name: u.user_metadata.full_name },
            }).catch(() => {});
          }
        });
      }
    } else if (googleResponse?.type === "error") {
      console.error("Google sign-in error:", googleResponse.error);
    }
  }, [googleResponse]);

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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName ?? null },
        emailRedirectTo: makeRedirectUri({ path: "/auth/callback" }),
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
      await googlePrompt();
      return { error: null };
    } catch (e: any) {
      return { error: e };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return { user, session, loading, signUp, signIn, signInWithGoogle, signOut };
}
