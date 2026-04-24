import { View, Text } from 'react-native';
import type { CommentaryItem } from '../types';

const TAG_STYLES = {
  red:   { bg: '#FEE2E2', fg: '#DC2626' },
  green: { bg: '#DCFCE7', fg: '#16A34A' },
  amber: { bg: '#FEF3C7', fg: '#D97706' },
  blue:  { bg: '#FFF1E7', fg: '#F16922' },
} as const;

export function Commentary({ items }: { items: CommentaryItem[] }) {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', marginBottom: 12 }}>
        AI-Generated Commentary — Ranked by Impact
      </Text>
      {items.map((c, idx) => {
        const deltaColor = c.delta.startsWith('+') ? '#16A34A' : '#DC2626';
        return (
          <View
            key={c.rank}
            style={{
              flexDirection: 'row',
              paddingVertical: 12,
              ...(idx > 0 ? { borderTopWidth: 1, borderTopColor: '#E2E8F0' } : {}),
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                marginRight: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F1F5F9',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#0F172A' }}>{c.rank}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0F172A' }}>{c.name}</Text>
                <Text style={{ fontSize: 11, color: deltaColor, marginLeft: 6, fontWeight: '500' }}>
                  — {c.delta}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18, marginTop: 4 }}>{c.text}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                {c.tags.map((t, i) => {
                  const s = TAG_STYLES[t.t];
                  return (
                    <View
                      key={i}
                      style={{ backgroundColor: s.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '500', color: s.fg }}>{t.l}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
