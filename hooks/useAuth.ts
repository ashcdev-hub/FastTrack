import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import type { User, Session } from "@supabase/supabase-js";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = "467971760239-8t1dncukb052edaprt0d83k3mu9ekq5j.apps.googleusercontent.com";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const discovery = {
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
  };

  const proxyRedirect = makeRedirectUri({ useProxy: true } as any);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: ["openid", "profile", "email"],
      responseType: "id_token",
      redirectUri: proxyRedirect,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === "success" && response.params?.id_token) {
      supabase.auth.signInWithIdToken({
        provider: "google",
        token: response.params.id_token,
      }).then(({ data: { user: u } }) => {
        if (u?.user_metadata?.full_name) {
          supabase.auth.updateUser({
            data: { display_name: u.user_metadata.full_name },
          }).catch(() => {});
        }
      });
    }
  }, [response]);

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
      await promptAsync();
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
