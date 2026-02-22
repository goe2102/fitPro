import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { useAppTheme } from '../constants/Config';

// This component handles the actual routing logic
function RootNavigation() {
  const { user, isLoading } = useAuth();
  // 1. Cast it to a string array so TS stops complaining
  const segments = useSegments() as string[];
  const router = useRouter();
  const { colors } = useAppTheme();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    // 2. Safely check if we are on the verify screen
    const inVerifyScreen = segments.length > 1 && segments[1] === 'verify';

    if (!user && !inAuthGroup) {
      // Not logged in -> Kick to Login
      router.replace('/(auth)/login');
    } else if (user && !user.emailVerified && !inVerifyScreen) {
      // Logged in, but unverified -> Kick to Verify
      router.replace('/(auth)/verify');
    } else if (user && user.emailVerified && inAuthGroup) {
      // Logged in & Verified -> Kick to App Tabs
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

// Wrap the whole app in the Providers
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}