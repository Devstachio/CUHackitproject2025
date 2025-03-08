import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { COLORS, COMMON_STYLES } from '../constants/AppStyles';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { login, loading, error, isAuthenticated, isDriver, isParent } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // For auto-redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      if (isDriver) {
        router.replace('/driver');
      } else if (isParent) {
        router.replace('/parent');
      }
    }
  }, [isAuthenticated, isDriver, isParent]);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    
    try {
      await login(email, password);
    } catch (error) {
      console.error("Login error:", error);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>BUS</Text>
                <Text style={styles.logoTextSmall}>TRACKER</Text>
              </View>
            </View>
            
            <View style={styles.infoContainer}>
              <Text style={styles.title}>School Bus Tracker</Text>
              <Text style={styles.subtitle}>Keep track of your child's school bus in real-time</Text>
              
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Error: {error.message}</Text>
                </View>
              )}
              
              <View style={styles.formContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={COLORS.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                
                <TouchableOpacity 
                  style={styles.loginButton} 
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <Ionicons name="log-in-outline" size={20} color="#000" style={styles.buttonIcon} />
                      <Text style={styles.loginButtonText}>Sign In</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                This app is for authorized users only. Contact your school administrator for access.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
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
  infoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
    marginTop: 8,
  },
  buttonIcon: {
    marginRight: 10,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  footerText: {
    color: '#CCC',
    fontSize: 12,
    textAlign: 'center',
  },
});