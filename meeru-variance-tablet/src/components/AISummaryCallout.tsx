import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Line, Polyline } from 'react-native-svg';
import type { BridgeTextPart } from '../industry-presets';
import { Icon } from './icons';

const TONE_CLASS = {
  pos:  'text-positive',
  neg:  'text-negative',
  warn: 'text-warning',
} as const;

/**
 * AI Summary — prominent brand-tinted callout at the top of the Analysis tab.
 * Stores the user's dismissal preference per-scope so it doesn't reopen on
 * every tab switch. Each `parts` item is mapped to a styled <Text> span.
 */
export function AISummaryCallout({
  parts,
  storageKey = 'meeru.perf.aiSummaryOpen',
}: {
  parts: BridgeTextPart[];
  storageKey?: string;
}) {
  const [open, setOpen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((raw) => {
      setOpen(raw !== '0');
    });
  }, [storageKey]);

  const close = () => {
    setOpen(false);
    AsyncStorage.setItem(storageKey, '0').catch(() => {});
  };

  if (open !== true) return null;
  return (
    <View className="relative mb-3 rounded-lg border border-brand-weak bg-brand-tint/40 px-3.5 py-3 pr-9">
      <View className="flex-row items-start gap-2.5">
        <View className="w-6 h-6 rounded-md bg-brand-tint items-center justify-center">
          <Icon.Sparkle size={14} color="#1E40AF" />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-semibold tracking-widest uppercase text-brand mb-1">
            AI Summary
          </Text>
          <Text className="text-[12.5px] leading-5 text-ink">
            {parts.map((p, i) => (
              <Text
                key={i}
                className={`${p.bold ? 'font-semibold' : ''} ${p.tone ? TONE_CLASS[p.tone] : ''}`}
              >
                {p.text}
              </Text>
            ))}
          </Text>
        </View>
      </View>
      <Pressable onPress={close} className="absolute top-2 right-2 w-6 h-6 rounded items-center justify-center">
        <XIcon />
      </Pressable>
    </View>
  );
}

function XIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round">
      <Polyline points="" />
      <Line x1="5" y1="5" x2="19" y2="19" />
      <Line x1="19" y1="5" x2="5" y2="19" />
    </Svg>
  );
}
