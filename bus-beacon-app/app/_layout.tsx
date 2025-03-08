import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { LocationProvider } from '../context/LocationContext';
import { COLORS } from '../constants/AppStyles';

export default function RootLayout() {
  return (
    <AuthProvider>
      <LocationProvider>
        <StatusBar style="light" />
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
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="driver/index"
            options={{
              title: 'Bus Driver Dashboard',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="parent/index"
            options={{
              title: 'Bus Tracker',
              gestureEnabled: false,
            }}
          />
        </Stack>
      </LocationProvider>
    </AuthProvider>
  );
}