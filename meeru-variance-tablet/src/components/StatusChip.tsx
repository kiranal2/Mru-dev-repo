import { View, Text } from 'react-native';

// Title-level status chip — tinted pill matching the web's chip-neg / chip-pos
// / chip-warn / chip-info classes. RN has no CSS color-mix, so we precompute
// rgba tints. Values follow the palette audit: warning is gold (not amber) so
// it pulls away from coral's hue band; info is a cool blue so "info" and
// "brand" don't collide. See MeeruAI_Design_System/palette_audit.html.
const STYLES = {
  neg:  { bg: 'rgba(220,38,38,0.14)',  border: 'rgba(220,38,38,0.28)',  text: 'text-negative' },
  pos:  { bg: 'rgba(22,163,74,0.14)',  border: 'rgba(22,163,74,0.28)',  text: 'text-positive' },
  warn: { bg: 'rgba(217,119,6,0.14)',  border: 'rgba(217,119,6,0.28)',  text: 'text-warning' },
  info: { bg: 'rgba(254,149,25,0.14)',  border: 'rgba(254,149,25,0.28)',  text: 'text-brand' },
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
