import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Sample hardcoded users
const USERS = {
  drivers: [
    { id: 'd1', username: 'driver1', password: 'password123', name: 'John Driver', busId: 'BUS001', type: 'driver' },
    { id: 'd2', username: 'driver2', password: 'password123', name: 'Sarah Driver', busId: 'BUS002', type: 'driver' },
  ],
  parents: [
    { id: 'p1', username: 'parent1', password: 'password123', name: 'Parent One', children: [{ name: 'Child One', busId: 'BUS001' }], type: 'parent' },
    { id: 'p2', username: 'parent2', password: 'password123', name: 'Parent Two', children: [{ name: 'Child Two', busId: 'BUS002' }], type: 'parent' },
  ]
};

type User = {
  id: string;
  username: string;
  name: string;
  type: 'driver' | 'parent';
  busId?: string;
  children?: Array<{ name: string; busId: string }>;
  isActive?: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, userType: 'driver' | 'parent') => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  clockIn: (isActive: boolean) => Promise<void>;
  isAuthenticated: boolean;
  isDriver: boolean;
  isParent: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check for stored user session on app start
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const userString = await AsyncStorage.getItem('user');
        if (userString) {
          setUser(JSON.parse(userString));
        }
      } catch (e) {
        console.log('Failed to load user from storage', e);
      } finally {
        setLoading(false);
      }
    };
    
    bootstrapAsync();
  }, []);
  
  // Login function
  const login = async (username: string, password: string, userType: 'driver' | 'parent') => {
    try {
      let foundUser = null;
      
      if (userType === 'driver') {
        foundUser = USERS.drivers.find(
          d => d.username === username && d.password === password
        );
        if (foundUser) {
          foundUser.type = 'driver';
        }
      } else if (userType === 'parent') {
        foundUser = USERS.parents.find(
          p => p.username === username && p.password === password
        );
        if (foundUser) {
          foundUser.type = 'parent';
        }
      }
      
      if (foundUser) {
        // Don't store password in state or storage
        const user = { ...foundUser };
        const { password, ...userToStore } = user; // Remove password from user object
        
        await AsyncStorage.setItem('user', JSON.stringify(userToStore));
        setUser(userToStore as User);
        
        // Navigate to the appropriate home screen
        if (userType === 'driver') {
          router.replace('./driver/');
        } else {
          router.replace('./parent/');
        }
        
        return { success: true };
      } else {
        return { success: false, message: 'Invalid credentials' };
      }
    } catch (e) {
      console.log('Login error', e);
      return { success: false, message: 'Login failed' };
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
      router.replace('./login');
    } catch (e) {
      console.log('Logout error', e);
    }
  };
  
  // Driver clock-in function
  const clockIn = async (isActive: boolean) => {
    if (user && user.type === 'driver') {
      const updatedUser = { ...user, isActive };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout,
      clockIn,
      isAuthenticated: !!user,
      isDriver: user?.type === 'driver' || false,
      isParent: user?.type === 'parent' || false,
    }}>
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