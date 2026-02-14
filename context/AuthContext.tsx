
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isVerified: boolean;
  activePlan: string | null;
  refreshProfile: () => Promise<void>;
  getSecureNow: () => Date;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  
  const [isVerified, setIsVerified] = useState(false);
  const [activePlan, setActivePlan] = useState<string | null>(null);

  useEffect(() => {
    const check = () => {
      if (!profile?.is_verified) return false;
      if (!profile.verified_until) return true;
      return new Date(profile.verified_until) > getSecureNow();
    };

    const isCurrentlyVerified = check();
    setIsVerified(isCurrentlyVerified);

    if (profile?.active_plan) {
      // If it's a test plan (starter/pro), it should expire with verification
      const isTestPlan = ['scouting', 'casting', 'starter', 'pro'].includes(profile.active_plan.toLowerCase());
      if (isTestPlan) {
        setActivePlan(isCurrentlyVerified ? profile.active_plan : null);
      } else {
        setActivePlan(profile.active_plan);
      }
    } else {
      setActivePlan(null);
    }

    if (profile?.is_verified && profile.verified_until) {
      const remaining = new Date(profile.verified_until).getTime() - getSecureNow().getTime();
      if (remaining > 0) {
        const timer = setTimeout(() => {
          setIsVerified(false);
          // Also update activePlan if it was a test plan
          const isTestPlan = profile.active_plan && ['scouting', 'casting', 'starter', 'pro'].includes(profile.active_plan.toLowerCase());
          if (isTestPlan) {
            setActivePlan(null);
          }
        }, remaining + 100); 
        return () => clearTimeout(timer);
      }
    }
  }, [profile, timeOffset]);
  
  // Actually, exposes a function is better for real-time checks in components
  const checkIsVerified = () => {
      if (!profile?.is_verified) return false;
      if (!profile.verified_until) return true;
      return new Date(profile.verified_until) > getSecureNow();
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    // Sync Server Time on Mount
    const syncTime = async () => {
        const start = performance.now();
        const { data, error } = await supabase.rpc('get_server_time');
        if (!error && data) {
            const serverTime = new Date(data).getTime();
            const end = performance.now();
            const latency = (end - start) / 2;
            
            startRef.current = end;
            setTimeOffset(serverTime + latency);
            console.log('⏰ Secure time synced with server.');
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

    console.log('🔌 Connecting to Realtime Profile updates...');
    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (UPDATE, etc.)
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('⚡ Realtime Update Received:', payload);
          if (payload.new) {
            // Merge strictly to avoid type issues, but usually payload.new IS the record
            setProfile(payload.new as UserProfile);
          }
        }
      )
      .subscribe((status) => {
         if (status === 'SUBSCRIBED') console.log('✅ Realtime Subscribed!');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
    await supabase.auth.signOut();
    setProfile(null);
    setUser(null);
    setSession(null);
  };
  
  const isAdmin = profile?.role?.toLowerCase() === 'admin';

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, isAdmin, isVerified, activePlan, refreshProfile, getSecureNow }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
