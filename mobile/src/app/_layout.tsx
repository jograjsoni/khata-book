import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { useKhataStore } from '../store/useKhataStore';
import { THEME } from '../theme/theme';
import { AppLockGate } from '../components/common/AppLockGate';
import { SileoNotification } from '../components/common/SileoNotification';

export default function RootLayout() {
  const { isDarkMode, fetchInitialData } = useKhataStore();
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AppLockGate>
        <SileoNotification />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: isDarkMode ? THEME.colors.dark.bgCanvas : THEME.colors.bgCanvas,
            },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="cashbook" options={{ headerShown: false }} />
          <Stack.Screen name="party/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="add-customer" options={{ headerShown: false }} />
          <Stack.Screen name="add-customer-supplier" options={{ headerShown: false }} />
          <Stack.Screen name="bills" options={{ headerShown: false }} />
          <Stack.Screen name="items" options={{ headerShown: false }} />
          <Stack.Screen name="passbook" options={{ headerShown: false }} />
          <Stack.Screen name="payment-links" options={{ headerShown: false }} />
          <Stack.Screen name="payment-settings" options={{ headerShown: false }} />
          <Stack.Screen name="edit-business-profile" options={{ headerShown: false }} />
          <Stack.Screen name="app-lock-settings" options={{ headerShown: false }} />
          <Stack.Screen name="sms-settings" options={{ headerShown: false }} />
          <Stack.Screen name="shop-insurance" options={{ headerShown: false }} />
          <Stack.Screen name="staff" options={{ headerShown: false }} />
        </Stack>
      </AppLockGate>
    </SafeAreaProvider>
  );
}
