import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { supabase } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { UserProfile } from "../types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isEditor: boolean;
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
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

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

  // Record login info (Device, OS, Browser, IP)
  useEffect(() => {
    if (user && profile) {
      const updateLoginInfo = async () => {
        try {
          const ua = navigator.userAgent;
          // Simple parser for human readable device/browser
          let deviceInfo = "Unknown Device";
          if (ua.includes("Windows")) deviceInfo = "Windows PC";
          else if (ua.includes("Android")) deviceInfo = "Android Phone";
          else if (ua.includes("iPhone")) deviceInfo = "iPhone";
          else if (ua.includes("Macintosh")) deviceInfo = "Mac / Apple";
          else if (ua.includes("Linux")) deviceInfo = "Linux Device";

          // Fetch Public IP
          let currentIp = null;
          try {
            const ipRes = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipRes.json();
            currentIp = ipData.ip;
          } catch (e) {
            console.error("Could not fetch IP:", e);
          }

          // Only update if it hasn't been updated in this session
          const hasRecentlyUpdated = sessionStorage.getItem(
            `last_login_sync_${user.id}`,
          );

          if (!hasRecentlyUpdated) {
            const updates: any = {
              last_device_info: deviceInfo,
              last_login_at: new Date().toISOString(),
            };

            if (currentIp) {
              updates.last_ip_address = currentIp;
              
              // Handle IP history to detect attacks/changing IPs
              const { data: currentProfile } = await supabase
                .from("profiles")
                .select("ip_history")
                .eq("id", user.id)
                .single();
              
              const history = currentProfile?.ip_history || [];
              if (!history.includes(currentIp)) {
                updates.ip_history = [...history, currentIp].slice(-20); // Keep last 20
              }
            }

            await supabase
              .from("profiles")
              .update(updates)
              .eq("id", user.id);
            sessionStorage.setItem(`last_login_sync_${user.id}`, "true");
          }
        } catch (err) {
          console.error("Failed to update login info:", err);
        }
      };
      updateLoginInfo();
    }
  }, [user, !!profile]);

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
      // (Supabase usually does this, but we reinforce it)
      const keysToRemove = Object.keys(localStorage);
      keysToRemove.forEach((key) => {
        if (key.includes("supabase.auth.token") || key.includes("sb-")) {
          localStorage.removeItem(key);
        }
      });
      
      // 6. Dispatch event to clear local cart state
      window.dispatchEvent(new Event("clear_local_cart"));
    } catch (error) {
      console.error("❌ Error during logout:", error);
    }
  };

  const isAdmin = profile?.role === "admin";
  const isEditor = profile?.role === "editor" || profile?.role === "admin";
  const userRole = profile?.role;

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
