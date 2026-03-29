'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { UserProfile } from '@/types/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          if (mounted) setUser(session.user);
          
          // Fetch profile for role checking
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (mounted && profileData) {
            setProfile(profileData as UserProfile);
          }
        }
      } catch (error) {
        console.error("Error loading auth:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (mounted) setUser(session.user);
        
        // Fetch profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (mounted && profileData) {
          setProfile(profileData as UserProfile);
        }
      } else {
        if (mounted) {
          setUser(null);
          setProfile(null);
        }
      }
      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
