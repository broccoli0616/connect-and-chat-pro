import { createContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  getProfile as getLocalProfile,
  saveProfile as saveLocalProfile,
  clearProfile as clearLocalProfile,
  type UserProfile,
} from "@/lib/userProfile";

export interface Profile {
  id: string;
  name: string;
  age: number | null;
  role: "learner" | "therapist";
  preferred_language: "en-US" | "zh-CN";
  created_at: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isOfflineMode: boolean;
  signUp: (
    email: string,
    password: string,
    profileData: Omit<Profile, "id" | "created_at">
  ) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Offline-only: save a profile to localStorage and set it as current */
  offlineSignIn: (data: {
    name: string;
    age: string;
    role: "learner" | "therapist";
    preferredLanguage: "en-US" | "zh-CN";
  }) => void;
}

export const AuthContext = createContext<AuthState | null>(null);

/** Convert localStorage UserProfile → AuthProvider Profile shape */
const localToProfile = (local: UserProfile): Profile => ({
  id: local.createdAt, // no real UUID in offline mode
  name: local.name,
  age: local.age ? parseInt(local.age, 10) || null : null,
  role: local.role,
  preferred_language: local.preferredLanguage,
  created_at: local.createdAt,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Offline (localStorage) helpers ──────────────────────────────

  const offlineSignIn = useCallback(
    (data: {
      name: string;
      age: string;
      role: "learner" | "therapist";
      preferredLanguage: "en-US" | "zh-CN";
    }) => {
      const localProfile: UserProfile = {
        name: data.name,
        age: data.age,
        role: data.role,
        preferredLanguage: data.preferredLanguage,
        createdAt: new Date().toISOString(),
      };
      saveLocalProfile(localProfile);
      setProfile(localToProfile(localProfile));
    },
    []
  );

  // ── Supabase helpers ───────────────────────────────────────────

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.warn("[AuthProvider] Failed to fetch profile:", error.message);
      setProfile(null);
    } else {
      setProfile(data as Profile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  // ── Initialization ─────────────────────────────────────────────

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Offline mode: restore from localStorage
      const local = getLocalProfile();
      if (local) {
        setProfile(localToProfile(local));
      }
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          fetchProfile(s.user.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── Auth actions ───────────────────────────────────────────────

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      profileData: Omit<Profile, "id" | "created_at">
    ) => {
      if (!isSupabaseConfigured) {
        // Offline fallback
        offlineSignIn({
          name: profileData.name,
          age: String(profileData.age ?? ""),
          role: profileData.role,
          preferredLanguage: profileData.preferred_language,
        });
        return { error: null };
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (!data.user) return { error: "Sign-up succeeded but no user returned." };

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        name: profileData.name,
        age: profileData.age,
        role: profileData.role,
        preferred_language: profileData.preferred_language,
      });

      if (profileError) return { error: profileError.message };

      await fetchProfile(data.user.id);
      return { error: null };
    },
    [fetchProfile, offlineSignIn]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured) {
        // In offline mode, "sign in" isn't meaningful via email—use offlineSignIn instead
        return { error: "Supabase is not configured. Use the register flow." };
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    clearLocalProfile();
    setProfile(null);
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isOfflineMode: !isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        offlineSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
