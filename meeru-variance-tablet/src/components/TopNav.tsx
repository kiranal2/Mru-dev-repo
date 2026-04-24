import { View, Text, Pressable } from 'react-native';

export interface TopNavTab {
  k: string;
  n: string;
}

interface TopNavProps {
  tabs: TopNavTab[];
  active: string;
  onChange: (k: string) => void;
  /** Optional per-tab dot badges — e.g. { exceptions: 3 } */
  dots?: Record<string, number>;
  /** Optional right-aligned content rendered in the same row. */
  right?: React.ReactNode;
}

export function TopNav({ tabs, active, onChange, dots, right }: TopNavProps) {
  return (
    <View className="flex-row items-center bg-surface border-b border-rule" style={{ height: 44 }}>
      <View className="flex-row flex-1">
        {tabs.map((t) => {
          const isActive = active === t.k;
          const dot = dots?.[t.k];
          return (
            <Pressable
              key={t.k}
              onPress={() => onChange(t.k)}
              className="flex-row items-center px-4 h-full"
            >
              <Text
                className={`text-[12px] ${
                  isActive ? 'text-brand font-semibold' : 'text-muted font-medium'
                }`}
              >
                {t.n}
              </Text>
              {dot !== undefined && dot > 0 && (
                <View className="ml-1.5 min-w-[16px] h-4 px-1 bg-negative rounded-full items-center justify-center">
                  <Text className="text-[9px] font-bold text-white leading-none">{dot}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      {right && <View className="pr-3 flex-row items-center gap-2">{right}</View>}
    </View>
  );
}
