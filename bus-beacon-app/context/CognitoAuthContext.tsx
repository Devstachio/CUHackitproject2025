import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, signIn, signOut, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type User = {
  id: string;
  username: string;
  name: string;
  type: 'driver' | 'parent';
  busId?: string;
  children?: Array<{ name: string; busId: string }>;
  isActive?: boolean;
  email: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
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
        console.log("[DEBUG] Checking for existing authenticated user...");
        // Try to get the current authenticated user from Cognito
        const cognitoUser = await getCurrentUser();
        console.log("[DEBUG] Current user:", cognitoUser ? JSON.stringify(cognitoUser, null, 2) : "No user found");
        
        if (cognitoUser) {
          console.log("[DEBUG] User found, fetching attributes...");
          // Get the user attributes
          try {
            const userAttributes = await fetchUserAttributes();
            console.log("[DEBUG] User attributes:", JSON.stringify(userAttributes, null, 2));
            
            // Get custom user data from AsyncStorage if needed
            console.log("[DEBUG] Checking for additional user data in AsyncStorage...");
            const userDataString = await AsyncStorage.getItem('userData');
            const userData = userDataString ? JSON.parse(userDataString) : {};
            const userSpecificData = userData[cognitoUser.username] || {};
            console.log("[DEBUG] User specific data from AsyncStorage:", JSON.stringify(userSpecificData, null, 2));
            
            // Get user type from Cognito custom attributes (custom:userType)
            const userType = userAttributes['custom:userType'] as 'driver' | 'parent';
            console.log("[DEBUG] User type:", userType || "User type not found in attributes");
            
            if (!userType) {
              console.log("[DEBUG] User type attribute missing, defaulting to 'parent'");
            }
            
            // Construct user object
            const appUser: User = {
              id: cognitoUser.username,
              username: cognitoUser.username,
              name: userAttributes.name || cognitoUser.username,
              email: userAttributes.email || '',
              type: userType || 'parent', // Default to parent if not specified
              // Include other attributes
              ...(userType === 'driver' && { 
                busId: userAttributes['custom:busId'],
                isActive: userSpecificData.isActive || false
              }),
              ...(userType === 'parent' && { 
                children: userSpecificData.children || []
              })
            };
            
            console.log("[DEBUG] Constructed user object:", JSON.stringify(appUser, null, 2));
            setUser(appUser);
          } catch (attributeError) {
            console.error("[DEBUG] Error fetching user attributes:", attributeError);
          }
        } else {
          console.log("[DEBUG] No authenticated user found");
        }
      } catch (e) {
        console.log("[DEBUG] Error in bootstrapAsync:", e);
        if (e instanceof Error) {
          console.log("[DEBUG] Error name:", e.name);
          console.log("[DEBUG] Error message:", e.message);
          console.log("[DEBUG] Error stack:", e.stack);
        }
      } finally {
        setLoading(false);
      }
    };
    
    bootstrapAsync();
  }, []);
  
  // Login function
  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      
      console.log("[DEBUG] Login attempt with username:", username);
      
      // Sign in with Cognito
      console.log("[DEBUG] Calling Cognito signIn...");
      try {
        const signInOutput = await signIn({ username, password });
        console.log("[DEBUG] SignIn response:", JSON.stringify(signInOutput, null, 2));
        
        if (signInOutput.isSignedIn) {
          console.log("[DEBUG] User successfully signed in");
          
          // Get user attributes
          try {
            console.log("[DEBUG] Fetching user attributes...");
            const userAttributes = await fetchUserAttributes();
            console.log("[DEBUG] User attributes:", JSON.stringify(userAttributes, null, 2));
            
            // Log all available attributes for debugging
            console.log("[DEBUG] Available attribute keys:", Object.keys(userAttributes));
            
            // Get user type from Cognito custom attributes
            let userType = userAttributes['custom:userType'] as 'driver' | 'parent';
            console.log("[DEBUG] User type from attributes:", userType);
            
            // If user type is missing, default to parent
            if (!userType) {
              console.log("[DEBUG] User type attribute missing, defaulting to 'parent'");
              userType = 'parent';
            }
            
            // Get any additional app-specific data
            console.log("[DEBUG] Checking for additional user data in AsyncStorage...");
            const userDataString = await AsyncStorage.getItem('userData') || '{}';
            const userData = JSON.parse(userDataString);
            const userSpecificData = userData[username] || {};
            console.log("[DEBUG] User specific data from AsyncStorage:", JSON.stringify(userSpecificData, null, 2));
            
            // Construct user object
            const appUser: User = {
              id: username,
              username: username,
              name: userAttributes.name || username,
              email: userAttributes.email || '',
              type: userType,
              // Include other attributes based on user type
              ...(userType === 'driver' && { 
                busId: userAttributes['custom:busId'] || 'BUS001', // Default if not specified
                isActive: userSpecificData.isActive || false
              }),
              ...(userType === 'parent' && { 
                children: userSpecificData.children || [{ name: 'Default Child', busId: 'BUS001' }] // Default if not specified
              })
            };
            
            console.log("[DEBUG] Constructed user object:", JSON.stringify(appUser, null, 2));
            setUser(appUser);
            
            // Navigate to the appropriate home screen based on user type
            console.log("[DEBUG] Navigating to", userType === 'driver' ? 'driver' : 'parent', "home screen");
            if (userType === 'driver') {
              router.replace('./driver/');
            } else {
              router.replace('./parent/');
            }
            
            return { success: true };
          } catch (attributeError) {
            console.error("[DEBUG] Error fetching user attributes:", attributeError);
            if (attributeError instanceof Error) {
              console.error("[DEBUG] Attribute error details:", attributeError.name, attributeError.message);
            }
            
            // Even if attribute fetching fails, we're still logged in, so construct a default user
            console.log("[DEBUG] Using default user object due to attribute fetch failure");
            const defaultUser: User = {
              id: username,
              username: username,
              name: username,
              email: '',
              type: 'parent', // Default to parent
              children: [{ name: 'Default Child', busId: 'BUS001' }]
            };
            
            setUser(defaultUser);
            router.replace('./parent/');
            
            return { 
              success: true,
              message: 'Authenticated but could not fetch all user details' 
            };
          }
        } else {
          console.log("[DEBUG] Sign in failed - isSignedIn is false");
          return { success: false, message: 'Login failed' };
        }
      } catch (signInError) {
        console.error("[DEBUG] Error during signIn:", signInError);
        if (signInError instanceof Error) {
          console.error("[DEBUG] SignIn error details:", 
            signInError.name, 
            signInError.message);
          
          // Extract the most user-friendly error message
          let errorMessage = 'Login failed. Please check your credentials.';
          
          if (signInError.name === 'NotAuthorizedException') {
            errorMessage = 'Incorrect username or password.';
          } else if (signInError.name === 'UserNotFoundException') {
            errorMessage = 'Account not found. Please check your username.';
          } else if (signInError.name === 'UserNotConfirmedException') {
            errorMessage = 'Account not verified. Please verify your account.';
          } else if (signInError.message) {
            errorMessage = signInError.message;
          }
          
          return { success: false, message: errorMessage };
        }
        
        return { success: false, message: 'Login failed' };
      }
    } catch (e) {
      console.error("[DEBUG] Unexpected error in login function:", e);
      const err = e as Error;
      return { 
        success: false, 
        message: err.message || 'An unexpected error occurred during login.' 
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      console.log("[DEBUG] Attempting to sign out...");
      // Sign out from Cognito
      await signOut();
      console.log("[DEBUG] Sign out successful");
      setUser(null);
      router.replace('/login');
    } catch (e) {
      console.log("[DEBUG] Logout error:", e);
      if (e instanceof Error) {
        console.log("[DEBUG] Logout error details:", e.name, e.message);
      }
      // Even if logout fails on the backend, clear the local state
      setUser(null);
      router.replace('/login');
    }
  };
  
  // Driver clock-in function (store this locally)
  const clockIn = async (isActive: boolean) => {
    if (user && user.type === 'driver') {
      try {
        console.log("[DEBUG] Clocking", isActive ? "in" : "out", "for driver:", user.username);
        // Update local user state
        const updatedUser = { ...user, isActive };
        setUser(updatedUser);
        
        // Store in AsyncStorage for persistence
        console.log("[DEBUG] Updating AsyncStorage with clock status");
        const userDataString = await AsyncStorage.getItem('userData') || '{}';
        const userData = JSON.parse(userDataString);
        
        // Update driver data in userData
        userData[user.username] = {
          ...userData[user.username],
          isActive
        };
        
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        console.log("[DEBUG] AsyncStorage updated successfully");
      } catch (e) {
        console.log("[DEBUG] Error updating clock-in status:", e);
        if (e instanceof Error) {
          console.log("[DEBUG] Clock-in error details:", e.name, e.message);
        }
      }
    } else {
      console.log("[DEBUG] Clock-in attempted but user is not a driver or not logged in");
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