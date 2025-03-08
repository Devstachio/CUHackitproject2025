import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  SafeAreaView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/CognitoAuthContext';
import { COLORS, COMMON_STYLES } from '../constants/AppStyles';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  
  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("[DEBUG] Login.tsx: Calling login function with username:", username);
      const result = await login(username, password);
      console.log("[DEBUG] Login.tsx: Login result:", JSON.stringify(result, null, 2));
      
      if (!result.success) {
        console.log("[DEBUG] Login.tsx: Login failed with message:", result.message);
        Alert.alert('Login Failed', result.message || 'Please check your credentials');
      } else {
        console.log("[DEBUG] Login.tsx: Login successful");
      }
    } catch (error) {
      console.error("[DEBUG] Login.tsx: Error during login:", error);
      if (error instanceof Error) {
        console.log("[DEBUG] Error name:", error.name);
        console.log("[DEBUG] Error message:", error.message);
      }
      Alert.alert('Error', 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>BUS</Text>
            <Text style={styles.logoTextSmall}>TRACKER</Text>
          </View>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.loginTitle}>
            Bus Tracker Login
          </Text>
          
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              This app is for authorized users only. Contact your administrator if you don't have credentials.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logoBox: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  logoTextSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#777',
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  helpText: {
    color: '#CCC',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
});