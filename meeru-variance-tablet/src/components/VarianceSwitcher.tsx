import { View, Text, Pressable, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

/**
 * Unified top bar for Variance-stack screens:
 *   [ MeeruAI logo ]   [ Performance | Margin | Flux ]
 *
 * Single light row — logo on the left, segmented switcher on the right.
 * Matches the overall white/slate visual language of the app.
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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
      }}
    >
      <Image
        source={require('../../assets/meeru-logo.png')}
        style={{ width: 88, height: 22, resizeMode: 'contain' }}
      />

      <View
        style={{
          flexDirection: 'row',
          gap: 4,
          padding: 3,
          borderRadius: 8,
          backgroundColor: '#F1F5F9',
          borderWidth: 1,
          borderColor: '#E2E8F0',
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
                paddingVertical: 5,
                paddingHorizontal: 14,
                borderRadius: 6,
                backgroundColor: active ? '#FFFFFF' : 'transparent',
                borderWidth: active ? 1 : 0,
                borderColor: '#E2E8F0',
                shadowColor: active ? '#0F172A' : 'transparent',
                shadowOpacity: active ? 0.04 : 0,
                shadowRadius: active ? 2 : 0,
                shadowOffset: { width: 0, height: 1 },
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: active ? '600' : '500',
                  color: active ? '#1E40AF' : '#64748B',
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
