import { SecretCornerProvider } from '@/context/SecretCornerContext';
import {
  PlaywriteAUTAS_400Regular,
  useFonts,
} from '@expo-google-fonts/playwrite-au-tas';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as NavigationBar from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({ PlaywriteAUTAS_400Regular });

  // The app surfaces are always light, so force dark bar icons regardless of
  // the system theme (otherwise dark-mode devices show white icons that clash
  // with the light background).
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync('dark').catch(() => {});
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SecretCornerProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="note" options={{ headerShown: false }} />
      </Stack>
      </SecretCornerProvider>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}
