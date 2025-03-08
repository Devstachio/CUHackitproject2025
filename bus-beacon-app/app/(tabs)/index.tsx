import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/CognitoAuthContext';
import { COLORS } from '../../constants/AppStyles';

export default function Index() {
  const router = useRouter();
  const { user, isAuthenticated, loading, isDriver, isParent } = useAuth();

  useEffect(() => {
    // Wait a bit to allow auth state to load
    const checkAuthState = async () => {
      if (!loading) {
        if (isAuthenticated) {
          if (isDriver) {
            router.replace('./driver/');
          } else if (isParent) {
            router.replace('./parent/');
          }
        } else {
          router.replace('./login');
        }
      }
    };

    checkAuthState();
  }, [loading, isAuthenticated, isDriver, isParent]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});