import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { useSession } from '../../services/session';
import { SignIn } from '../../components/SignIn';
import { Screen, Loading } from '../../components/ui';

const tabs = [
  { name: 'index', title: 'Home', icon: 'shield-checkmark-outline' as const, activeIcon: 'shield-checkmark' as const },
  { name: 'map', title: 'Live Map', icon: 'map-outline' as const, activeIcon: 'map' as const },
  { name: 'family', title: 'Family', icon: 'people-outline' as const, activeIcon: 'people' as const },
  { name: 'profile', title: 'Profile', icon: 'person-outline' as const, activeIcon: 'person' as const }
] as const;

export default function TabLayout() {
  const { data, ready } = useSession();

  // If session is still restoring from storage
  if (!ready) {
    return (
      <Screen title="FindMe" subtitle="Initializing safety system...">
        <Loading label="Loading FindMe..." />
      </Screen>
    );
  }

  // If not logged in, render the landing sign-in page full screen without Navbar / Tabs
  if (!data) {
    return <SignIn />;
  }

  // Once authenticated with LINE, render full tabs with bottom navigation
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.cardBorder,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11
        }
      }}
    >
      {tabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? tab.activeIcon : tab.icon}
                size={22}
                color={color}
              />
            )
          }}
        />
      ))}
    </Tabs>
  );
}

