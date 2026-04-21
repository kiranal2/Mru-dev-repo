import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text } from 'react-native';
import { Icon } from './components/icons';
import { useAuth } from './store';

import LoginScreen from './screens/LoginScreen';
import WorkspaceScreen from './screens/WorkspaceScreen';
import PerformanceScreen from './screens/PerformanceScreen';
import MarginScreen from './screens/MarginScreen';
import FluxScreen from './screens/FluxScreen';
import CloseScreen from './screens/CloseScreen';
import ProfileScreen from './screens/ProfileScreen';

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
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1E40AF',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 62,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopColor: '#E2E8F0',
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
    </Tab.Navigator>
  );
}

// ---------- Root ----------
export function RootNavigator() {
  const { user, hydrated } = useAuth();

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-alt">
        <Text className="text-muted text-sm">Loading…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <TabNav /> : <LoginScreen />}
    </NavigationContainer>
  );
}
