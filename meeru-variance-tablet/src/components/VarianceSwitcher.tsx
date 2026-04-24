import { View, Text, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Logo } from './Logo';

/**
 * Unified top bar for Variance-stack screens:
 *   [ MeeruAI logo ]   [ Performance | Margin | Flux ]
 *
 * Single row — logo on the left, segmented switcher on the right. Uses
 * Tailwind tokens so it flips with the active theme.
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
    <View className="flex-row items-center justify-between px-4 py-2.5 bg-surface border-b border-rule">
      <Logo height={22} />

      <View className="flex-row gap-1 p-0.5 rounded-lg bg-surface-soft border border-rule">
        {ITEMS.map((it) => {
          const active = route.name === it.route;
          return (
            <Pressable
              key={it.route}
              onPress={() => {
                if (!active) navigation.navigate(it.route);
              }}
              className={`px-3.5 py-1 rounded-md ${
                active ? 'bg-surface border border-rule' : ''
              }`}
            >
              <Text
                className={`text-[14px] ${
                  active ? 'text-brand font-semibold' : 'text-muted font-medium'
                }`}
                style={{ letterSpacing: 0.2 }}
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
