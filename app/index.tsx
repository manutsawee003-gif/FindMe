import { Redirect } from 'expo-router';

// Keep the direct /index URL working as well as the canonical root route.
export default function IndexRedirect() {
  return <Redirect href="/(tabs)" />;
}
