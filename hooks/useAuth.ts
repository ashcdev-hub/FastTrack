import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import type { User, Session } from "@supabase/supabase-js";

WebBrowser.maybeCompleteAuthSession();

const proxyUrl = "https://auth.expo.io/@ashcdev2/FastTrack";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [, googleResponse, googlePrompt] = Google.useIdTokenAuthRequest({
    clientId: "467971760239-8t1dncukb052edaprt0d83k3mu9ekq5j.apps.googleusercontent.com",
    redirectUri: proxyUrl,
  });

  useEffect(() => {
    if (googleResponse?.type === "success" && googleResponse.params?.id_token) {
      supabase.auth.signInWithIdToken({
        provider: "google",
        token: googleResponse.params.id_token,
      }).then(({ data: { user: u } }) => {
        if (u?.user_metadata?.full_name) {
          supabase.auth.updateUser({
            data: { display_name: u.user_metadata.full_name },
          }).catch(() => {});
        }
      });
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
