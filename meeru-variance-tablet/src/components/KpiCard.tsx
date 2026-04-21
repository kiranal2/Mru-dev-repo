import { View, Text } from 'react-native';
import type { Kpi } from '../types';

/**
 * Compact stat card matching the web uberflux `.uf-stat-card` style.
 * 20px value, 9.5px uppercase label, 10px delta, 12×14 padding, 8 radius.
 */
export function KpiCard({ kpi, compact = true }: { kpi: Kpi; compact?: boolean }) {
  const deltaColor = kpi.tone === 'pos' ? '#16A34A' : kpi.tone === 'neg' ? '#DC2626' : '#D97706';
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingVertical: compact ? 10 : 14,
        paddingHorizontal: compact ? 12 : 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
      }}
    >
      <Text
        style={{
          fontSize: compact ? 9.5 : 10,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: '#64748B',
          fontWeight: '600',
          marginBottom: 5,
        }}
      >
        {kpi.lbl}
      </Text>
      <Text
        style={{
          fontSize: compact ? 20 : 24,
          fontWeight: '700',
          color: '#0F172A',
          letterSpacing: -0.3,
          lineHeight: compact ? 22 : 28,
        }}
      >
        {kpi.val}
      </Text>
      <Text style={{ fontSize: 10, color: deltaColor, marginTop: 3 }}>{kpi.delta}</Text>
    </View>
  );
}
