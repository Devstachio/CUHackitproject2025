import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../constants/AppStyles';

export default function ParentLayout() {
  const { isAuthenticated, isParent, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isParent)) {
      router.replace('./login');
    }
  }, [loading, isAuthenticated, isParent]);

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
          title: 'Bus Tracker',
          headerRight: () => null,
        }}
      />
    </Stack>
  );
}