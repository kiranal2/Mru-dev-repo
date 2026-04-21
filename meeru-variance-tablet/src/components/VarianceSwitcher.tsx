import { View, Text, Pressable, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

/**
 * Thin segmented control shown at the top of every Variance-stack screen so
 * users can move between Performance / Margin / Flux without using a tab icon.
 * Includes a white logo strip above the dark segmented control for brand presence.
 */
const ITEMS = [
  { route: 'Performance', label: 'Performance' },
  { route: 'Margin',      label: 'Margin' },
  { route: 'Flux',        label: 'Flux' },
] as const;

export function VarianceSwitcher() {
  const navigation = useNavigation<any>();
  const route = useRoute();

  return (
    <View>
      {/* Logo strip */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
        }}
      >
        <Image
          source={require('../../assets/meeru-logo.png')}
          style={{ width: 96, height: 24, resizeMode: 'contain' }}
        />
      </View>

      {/* Dark segmented control */}
      <View
        style={{
          flexDirection: 'row',
          gap: 4,
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: '#0F172A',
        }}
      >
        {ITEMS.map((it) => {
          const active = route.name === it.route;
          return (
            <Pressable
              key={it.route}
              onPress={() => {
                if (!active) navigation.navigate(it.route);
              }}
              style={{
                flex: 1,
                paddingVertical: 6,
                borderRadius: 6,
                alignItems: 'center',
                backgroundColor: active ? '#1E40AF' : 'transparent',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: active ? '700' : '500',
                  color: active ? '#FFFFFF' : '#94A3B8',
                  letterSpacing: 0.2,
                }}
              >
                {it.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
