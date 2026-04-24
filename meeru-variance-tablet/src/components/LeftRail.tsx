import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import type { LeftItem } from '../industry-presets';

const TONE_DOT: Record<NonNullable<LeftItem['tone']>, string> = {
  pos:  '#16A34A',
  neg:  '#DC2626',
  warn: '#D97706',
};

const TONE_TEXT: Record<NonNullable<LeftItem['tone']>, string> = {
  pos:  'text-positive',
  neg:  'text-negative',
  warn: 'text-warning',
};

interface RailGroupProps {
  label: string;
  items: LeftItem[];
  active?: string;
  onSelect: (k: string) => void;
}

export function RailGroup({ label, items, active, onSelect }: RailGroupProps) {
  return (
    <View className="mb-4">
      <Text className="px-1 mb-1.5 text-[10px] font-semibold tracking-wider uppercase text-faint">
        {label}
      </Text>
      {items.map((it) => {
        const isActive = active === it.k;
        return (
          <Pressable
            key={it.k}
            onPress={() => onSelect(it.k)}
            className={`flex-row items-center gap-2 px-2 py-2 rounded-md mb-0.5 ${
              isActive ? 'bg-brand-tint' : ''
            }`}
          >
            {it.tone && (
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: TONE_DOT[it.tone] }}
              />
            )}
            <Text
              className={`flex-1 text-[12px] ${
                isActive ? 'text-brand font-semibold' : 'text-ink'
              }`}
              numberOfLines={1}
            >
              {it.n}
            </Text>
            {it.d && (
              <Text
                className={`text-[11px] font-medium ${
                  it.tone ? TONE_TEXT[it.tone] : 'text-muted'
                }`}
              >
                {it.d}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

interface LeftRailProps {
  children: React.ReactNode;
}

/**
 * LeftRail — scrollable filter column on the left of the workbench.
 * Compose with one or more <RailGroup /> children. Renders the Meeru logo
 * at the top so brand is always visible inside a workbench context.
 */
export function LeftRail({ children }: LeftRailProps) {
  return (
    <View className="bg-surface border-r border-rule" style={{ width: 200 }}>
      <View className="px-3 pt-3 pb-2 border-b border-rule">
        <Image
          source={require('../../assets/meeru-logo.png')}
          style={{ width: 88, height: 22, resizeMode: 'contain' }}
        />
      </View>
      <ScrollView contentContainerStyle={{ padding: 10 }}>{children}</ScrollView>
    </View>
  );
}
