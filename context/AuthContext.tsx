import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { supabase } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { UserProfile, ModerationStatus } from "../types";
import { logSecurityEvent, recordSuccessfulLogin, recordProfileChange } from "../lib/security";
import { registerDeviceSession, updateLastSeen, subscribeToDeviceRevocation } from "../lib/device-service";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isEditor: boolean;
  isBanned: boolean;
  moderationStatus: ModerationStatus;
  userRole: "user" | "editor" | "admin" | undefined;
  refreshProfile: () => Promise<void>;
  getSecureNow: () => Date;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Secure Time Sync
  const [timeOffset, setTimeOffset] = useState<number | null>(null);
  const startRef = useRef(0);

  // Helper to get tamper-proof current time
  const getSecureNow = () => {
    if (timeOffset === null) return new Date(); // Fallback to local if sync fails
    // ServerTimeAtStart + (CurrentMonotonic - StartMonotonic)
    return new Date(timeOffset + performance.now() - startRef.current);
  };

  const isVerified = React.useMemo(() => {
    if (!profile?.is_verified) return false;
    if (!profile.verified_until) return true; // Lifetime

    // Use secure time for check
    return new Date(profile.verified_until) > getSecureNow();

    // Note: We need this to update as time passes.
    // Since this is a boolean value in context, consumers should poll if they need exact second precision,
    // or we rely on re-renders via Realtime updates or local ticks.
    // For safety, we return the calculation.
  }, [profile, timeOffset]); // Dependent on profile changes. Note: Time flowing doesn't auto-update this memo without external tick.

  // Actually, exposes a function is better for real-time checks in components
  const checkIsVerified = () => {
    if (!profile?.is_verified) return false;
    if (!profile.verified_until) return true;
    return new Date(profile.verified_until) > getSecureNow();
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const rememberMe = localStorage.getItem("remember_me");
      const tempSession = sessionStorage.getItem("temp_session");

      if (session && rememberMe === "false" && !tempSession) {
        // The user didn't want to be remembered and has closed the browser/tab
        supabase.auth.signOut().then(() => {
          setSession(null);
          setUser(null);
          setLoading(false);
          localStorage.removeItem("remember_me");
        });
        return;
      }

      if (session && rememberMe === "false" && tempSession) {
        // Re-affirm temp session just in case
        sessionStorage.setItem("temp_session", "true");
      }

      setSession(session);
      setUser(session?.user ?? null);
      // Sync Server Time on Mount
      const syncTime = async () => {
        const start = performance.now();
        const { data, error } = await supabase.rpc("get_server_time");
        if (!error && data) {
          const serverTime = new Date(data).getTime();
          const end = performance.now();
          const latency = (end - start) / 2;

          startRef.current = end;
          setTimeOffset(serverTime + latency);
        }
      };
      syncTime();
      if (session?.user) {
        registerDeviceSession(session.user.id).then((isActive) => {
          if (!isActive) {
            supabase.auth.signOut().then(() => {
              setSession(null);
              setUser(null);
              setLoading(false);
            });
            return;
          }
          fetchProfile(session.user.id);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const prevEmail = sessionStorage.getItem('last_user_email');
      const currentEmail = session?.user?.email;

      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        // Record successful login if not already done in this session
        const recorded = sessionStorage.getItem(`login_recorded_${session.user.id}`);
        if (!recorded) {
            recordSuccessfulLogin(session.user.id);
            registerDeviceSession(session.user.id, null, true); // true for explicitLogin
            sessionStorage.setItem(`login_recorded_${session.user.id}`, 'true');
        }
      }

      // Track email changes if detected in auth state
      if (session?.user && prevEmail && prevEmail !== currentEmail) {
          recordProfileChange(session.user.id, 'email', prevEmail, currentEmail || '', 'user');
      }
      
      if (currentEmail) {
          sessionStorage.setItem('last_user_email', currentEmail);
      }

      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time Profile Updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all events
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          // If profile is deleted, force logout
          if (payload.eventType === "DELETE") {
            signOut();
            return;
          }

          if (payload.new) {
            setProfile(payload.new as UserProfile);
          }
        },
      )
      .subscribe((status) => {});

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Realtime device revocation listener - instant sign out when session is revoked
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToDeviceRevocation(user.id, () => {
      // Session was revoked remotely! Sign out immediately.
      signOut();
    });

    return unsubscribe;
  }, [user]);

  // Periodic last_seen_at heartbeat (every 2 minutes) - fallback safety net
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const isActive = await updateLastSeen(user.id);
      if (!isActive) {
        signOut();
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [user]);

  // Login info is now tracked by security RPCs (record_successful_login)
  // in LoginPage. No need for duplicate client-side IP fetching here.

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        // If account was scheduled for deletion, cancel it upon login/fetch
        if (data.deletion_scheduled_at) {
          const { error: restoreError } = await supabase
            .from("profiles")
            .update({
              deletion_scheduled_at: null,
              deletion_reason: null,
            })
            .eq("id", userId);

          if (!restoreError) {
            data.deletion_scheduled_at = null;
            data.deletion_reason = null;
            // Toast notifications aren't directly available in AuthContext,
            // but we can alert the user via an event or the return data.
          }
        }

        setProfile(data);
      } else if (error) {
        console.error("❌ Error fetching profile:", error);
      }
    } catch (error) {
      console.error("🔥 Unexpected error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    try {
      // Log logout event before clearing session
      if (user) {
        logSecurityEvent('logout', user.id).catch(() => {});
      }

      // 1. Supabase SignOut handles local storage cleanup for Supabase tokens
      await supabase.auth.signOut();

      // 2. Clear manual session trackers
      localStorage.removeItem("remember_me");
      sessionStorage.removeItem("temp_session");

      // 3. Clear all sensitive session data
      sessionStorage.clear();

      // 4. Reset global state
      setProfile(null);
      setUser(null);
      setSession(null);

      // 5. Invalidate any local storage keys if necessary
      const keysToRemove = Object.keys(localStorage);
      keysToRemove.forEach((key) => {
        if (key.includes("supabase.auth.token") || key.includes("sb-")) {
          localStorage.removeItem(key);
        }
      });
      
      // 6. Dispatch event to clear local cart state
      window.dispatchEvent(new Event("clear_local_cart"));
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const isAdmin = profile?.role === "admin";
  const isEditor = profile?.role === "editor" || profile?.role === "admin";
  const userRole = profile?.role;

  // Moderation: compute effective ban status
  const moderationStatus: ModerationStatus = React.useMemo(() => {
    if (!profile?.moderation_status) return 'active';
    // Auto-expire temp bans on frontend
    if (profile.moderation_status === 'temporarily_suspended' && profile.banned_until) {
      const bannedUntil = new Date(profile.banned_until);
      const now = getSecureNow();
      if (bannedUntil <= now) return 'active';
    }
    return profile.moderation_status;
  }, [profile?.moderation_status, profile?.banned_until, timeOffset]);

  const isBanned = moderationStatus === 'temporarily_suspended' || moderationStatus === 'permanently_banned';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signOut,
        isAdmin,
        isEditor,
        isBanned,
        moderationStatus,
        userRole,
        refreshProfile,
        getSecureNow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
