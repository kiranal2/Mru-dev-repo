import { View, Text } from 'react-native';

// Title-level status chip — tinted pill matching the web's chip-neg / chip-pos
// / chip-warn / chip-info classes. Since React Native doesn't support
// CSS color-mix, we use pre-computed semi-transparent rgba so the tint
// renders cleanly on both light + dark surfaces.
const STYLES = {
  neg:  { bg: 'rgba(220,38,38,0.14)',  border: 'rgba(220,38,38,0.28)',  text: 'text-negative' },
  pos:  { bg: 'rgba(22,163,74,0.14)',  border: 'rgba(22,163,74,0.28)',  text: 'text-positive' },
  warn: { bg: 'rgba(217,119,6,0.14)',  border: 'rgba(217,119,6,0.28)',  text: 'text-warning' },
  info: { bg: 'rgba(241,105,34,0.14)',  border: 'rgba(241,105,34,0.28)',  text: 'text-brand' },
} as const;

export type StatusKind = keyof typeof STYLES;

export function StatusChip({ kind, children }: { kind: StatusKind; children: string }) {
  const s = STYLES[kind];
  return (
    <View
      className="px-2.5 py-1 rounded-md self-start"
      style={{ backgroundColor: s.bg, borderWidth: 1, borderColor: s.border }}
    >
      <Text className={`text-[14px] font-semibold ${s.text}`}>{children}</Text>
    </View>
  );
}
