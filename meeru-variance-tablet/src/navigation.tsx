import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { View, Text } from 'react-native';
import { Icon } from './components/icons';
import { useAuth } from './store';
import { useTheme } from './theme';

import LoginScreen from './screens/LoginScreen';
import WorkspaceScreen from './screens/WorkspaceScreen';
import PerformanceScreen from './screens/PerformanceScreen';
import MarginScreen from './screens/MarginScreen';
import FluxScreen from './screens/FluxScreen';
import CloseScreen from './screens/CloseScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';

// Palette snippets used directly by react-navigation (which doesn't speak
// Tailwind). Keep these in sync with src/theme.tsx.
const NAV_COLORS = {
  light: { surface: '#FFFFFF', rule: '#E2E8F0', brand: '#F16922', faint: '#94A3B8', ink: '#0F172A' },
  dark:  { surface: '#0A0A0A', rule: '#262626', brand: '#FF9B6C', faint: '#737373', ink: '#F5F5F5' },
};

// ---------- Variance sub-stack ----------
const VarianceStack = createNativeStackNavigator();
function VarianceNav() {
  return (
    <VarianceStack.Navigator screenOptions={{ headerShown: false }}>
      <VarianceStack.Screen name="Performance" component={PerformanceScreen} />
      <VarianceStack.Screen name="Margin" component={MarginScreen} />
      <VarianceStack.Screen name="Flux" component={FluxScreen} />
    </VarianceStack.Navigator>
  );
}

// ---------- Tab bar ----------
const Tab = createBottomTabNavigator();
function TabNav() {
  const { theme } = useTheme();
  const c = NAV_COLORS[theme];
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.brand,
        tabBarInactiveTintColor: c.faint,
        tabBarStyle: {
          height: 62,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: c.surface,
          borderTopColor: c.rule,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="Workspace"
        component={WorkspaceScreen}
        options={{ tabBarIcon: ({ color }) => <Icon.Home color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Variance"
        component={VarianceNav}
        options={{ tabBarIcon: ({ color }) => <Icon.Chart color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Close"
        component={CloseScreen}
        options={{ tabBarIcon: ({ color }) => <Icon.Calendar color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <Icon.User color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: ({ color }) => <Icon.Settings color={color} size={22} /> }}
      />
    </Tab.Navigator>
  );
}

// ---------- Root ----------
export function RootNavigator() {
  const { user, hydrated } = useAuth();
  const { theme } = useTheme();

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-alt">
        <Text className="text-muted text-sm">Loading…</Text>
      </View>
    );
  }

  // React Navigation's theme prop tints the container + status bar chrome.
  // Map our theme to RN's DefaultTheme/DarkTheme so screen transitions and
  // empty spaces honor the active palette.
  const navTheme = theme === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: NAV_COLORS.dark.surface, card: NAV_COLORS.dark.surface, text: NAV_COLORS.dark.ink, border: NAV_COLORS.dark.rule, primary: NAV_COLORS.dark.brand } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: NAV_COLORS.light.surface, card: NAV_COLORS.light.surface, text: NAV_COLORS.light.ink, border: NAV_COLORS.light.rule, primary: NAV_COLORS.light.brand } };

  return (
    <NavigationContainer theme={navTheme}>
      {user ? <TabNav /> : <LoginScreen />}
    </NavigationContainer>
  );
}
