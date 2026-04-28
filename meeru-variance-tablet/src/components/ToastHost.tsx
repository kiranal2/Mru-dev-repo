import { View, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToasts } from '../store';
import { Icon } from './icons';

export function ToastHost() {
  const { toasts } = useToasts();
  if (toasts.length === 0) return null;
  return (
    <SafeAreaView
      pointerEvents="box-none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, alignItems: 'flex-end', padding: 12 }}
    >
      {toasts.map((t) => {
        const accent = t.kind === 'warn' ? '#D97706' : t.kind === 'info' ? '#B64D1D' : '#16A34A';
        const Ic = t.kind === 'warn' ? Icon.Alert : t.kind === 'info' ? Icon.Sparkle : Icon.Check;
        return (
          <Animated.View
            key={t.id}
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(180)}
            className="bg-surface rounded-xl px-3 py-2 mb-2 flex-row items-start gap-2"
            style={{ borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 3, borderLeftColor: accent, minWidth: 240, maxWidth: 340 }}
          >
            <View style={{ marginTop: 2 }}>
              <Ic color={accent} size={14} />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-sm font-semibold text-ink">{t.title}</Text>
              {t.sub && <Text className="text-xs text-muted mt-0.5">{t.sub}</Text>}
            </View>
          </Animated.View>
        );
      })}
    </SafeAreaView>
  );
}
