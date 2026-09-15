import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '../services/session';
export default function RootLayout() { return <SafeAreaProvider><SessionProvider><StatusBar style="dark" /><Stack><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="sos" options={{ title: 'Request help', presentation: 'modal' }} /><Stack.Screen name="join" options={{ title: 'Family invitation' }} /><Stack.Screen name="auth/callback" options={{ headerShown: false }} /></Stack></SessionProvider></SafeAreaProvider>; }
