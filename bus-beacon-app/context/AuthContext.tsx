import React, { createContext, useState, useContext, useEffect } from 'react';
import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';
import { supabase, getProfile, getDriverBus, clockInOut } from '../lib/supabase';
import { User } from '../lib/types';
import { Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  isDriver: boolean;
  isParent: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clockIn: (isActive: boolean) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Listen for auth changes
  useEffect(() => {
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth state changed: ${event}`);
      
      if (session) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Initial session check
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setUser(null);
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Load user profile data from Supabase
  const loadUserProfile = async (userId: string) => {
    try {
      // Fetch the user profile
      const profile = await getProfile(userId);
      
      if (!profile) {
        throw new Error('User profile not found');
      }
      
      let userData: User = {
        id: userId,
        email: profile.email,
        name: profile.name,
        type: profile.user_type,
      };
      
      // If user is a driver, fetch assigned bus
      if (profile.user_type === 'driver') {
        const driverBus = await getDriverBus(userId);
        
        if (driverBus) {
          userData = {
            ...userData,
            busId: driverBus.buses.id,
            isActive: driverBus.is_active || false
          };
        }
      }
      
      setUser(userData);
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError(err as Error);
      
      // For security, sign out if there's an error loading profile
      await supabase.auth.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      // AuthListener will handle the profile loading and redirection
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err as Error);
      
      if (Platform.OS !== 'web') {
        Alert.alert(
          'Login Error', 
          (err as Error).message || 'There was a problem signing in. Please try again.'
        );
      }
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      router.replace('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  // Driver clock-in function
  const clockIn = async (isActive: boolean) => {
    if (user && user.type === 'driver') {
      try {
        setLoading(true);
        
        await clockInOut(user.id, isActive);
        
        // Update local user state
        setUser(prevUser => {
          if (prevUser) {
            return { ...prevUser, isActive };
          }
          return prevUser;
        });
      } catch (err) {
        console.error('Error updating clock-in status:', err);
        setError(err as Error);
        
        Alert.alert(
          'Error', 
          'Failed to update your status. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    } else {
      console.log("Clock-in attempted but user is not a driver");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        isDriver: user?.type === 'driver' || false,
        isParent: user?.type === 'parent' || false,
        login,
        logout,
        clockIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};