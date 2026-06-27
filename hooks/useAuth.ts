import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import type { User, Session } from "@supabase/supabase-js";

WebBrowser.maybeCompleteAuthSession();

const IOS_CLIENT_ID = "467971760239-k02ta1j2psjhpttu2bt45fften9t0lf1.apps.googleusercontent.com";
const ANDROID_CLIENT_ID = "467971760239-dogg4n6mfhghj481bqsbfovkh8lev4ld.apps.googleusercontent.com";

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
      const clientId = IOS_CLIENT_ID;
      const redirectUri = `com.googleusercontent.apps.${clientId}:/oauthredirect`;

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=id_token` +
        `&scope=${encodeURIComponent("openid profile email")}` +
        `&nonce=${Date.now()}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === "success" && result.url) {
        const fragment = result.url.split("#")[1] || "";
        const params = new URLSearchParams(fragment);
        const idToken = params.get("id_token");
        if (idToken) {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: idToken,
          });
          if (!error) {
            const { data: { session: s } } = await supabase.auth.getSession();
            if (s?.user?.user_metadata?.full_name) {
              await supabase.auth.updateUser({
                data: { display_name: s.user.user_metadata.full_name },
              }).catch(() => {});
            }
          }
          return { error };
        }
      } else if (result.type === "cancel") {
        return { error: null };
      }
      return { error: new Error("Google sign-in failed") };
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
