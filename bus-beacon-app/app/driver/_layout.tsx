import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../context/CognitoAuthContext';
import { COLORS } from '../../constants/AppStyles';

export default function DriverLayout() {
  const { isAuthenticated, isDriver, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isDriver)) {
      router.replace('./login');
    }
  }, [loading, isAuthenticated, isDriver]);

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Bus Driver Dashboard',
          headerRight: () => null,
        }}
      />
    </Stack>
  );
}