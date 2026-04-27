import { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChat } from '../store';
import {
  FLUX_KPIS, FLUX_IS_ROWS, FLUX_BS_ROWS, FLUX_CF_ROWS,
} from '../data';
import type { FluxRow, FluxView } from '../types';
import { KpiCard } from '../components/KpiCard';
import { ChatSheet, type ChatSheetRef } from '../components/ChatSheet';
import { VarianceSwitcher } from '../components/VarianceSwitcher';
import { Icon } from '../components/icons';

const TONE_COLOR = {
  pos:  '#16A34A',
  neg:  '#DC2626',
  warn: '#D97706',
  blue: '#FE9519',
} as const;

const MAX_W = 1100;

const VIEWS: { k: FluxView; n: string; sub: string }[] = [
  { k: 'is', n: 'Income Statement', sub: 'Revenue, COGS, OpEx' },
  { k: 'bs', n: 'Balance Sheet',    sub: 'Assets & Liabilities' },
  { k: 'cf', n: 'Cash Flow Bridge', sub: 'NI → FCF walk' },
];

function pickRows(view: FluxView): FluxRow[] {
  if (view === 'is') return FLUX_IS_ROWS;
  if (view === 'bs') return FLUX_BS_ROWS;
  return FLUX_CF_ROWS;
}

function VarianceBar({ row, maxAbs }: { row: FluxRow; maxAbs: number }) {
  // Parse variance numeric value from strings like "+$1.2M", "−$420K", "+$17.6M".
  const raw = row.variance.replace(/[$,]/g, '').replace('−', '-');
  const m = raw.match(/(-?)([\d.]+)([MK]?)/);
  let n = 0;
  if (m) {
    n = parseFloat(m[2]);
    if (m[3] === 'K') n /= 1000;        // in $M units
    if (m[1] === '-') n = -n;
  }
  const pct = Math.min(100, (Math.abs(n) / Math.max(0.01, maxAbs)) * 100);
  const color = n >= 0 ? '#16A34A' : '#DC2626';
  const isNeg = n < 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 6, width: 120 }}>
      {/* left half (negative) */}
      <View style={{ flex: 1, height: 6, alignItems: 'flex-end', backgroundColor: '#F1F5F9', borderTopLeftRadius: 3, borderBottomLeftRadius: 3 }}>
        {isNeg && (
          <View style={{ width: `${pct}%` as any, height: 6, backgroundColor: color }} />
        )}
      </View>
      <View style={{ width: 1, height: 10, backgroundColor: '#CBD5E1' }} />
      {/* right half (positive) */}
      <View style={{ flex: 1, height: 6, backgroundColor: '#F1F5F9', borderTopRightRadius: 3, borderBottomRightRadius: 3 }}>
        {!isNeg && (
          <View style={{ width: `${pct}%` as any, height: 6, backgroundColor: color }} />
        )}
      </View>
    </View>
  );
}

export default function FluxScreen() {
  const { send } = useChat();
  const { width } = useWindowDimensions();
  const [view, setView] = useState<FluxView>('is');
  const [showMaterialOnly, setShowMaterialOnly] = useState(false);
  const chatRef = useRef<ChatSheetRef>(null);

  const isWide = width >= 820;
  const isXWide = width >= 1100;

  const askAgent = (q: string) => {
    send(q);
    chatRef.current?.expand();
  };

  const rows = useMemo(() => {
    const all = pickRows(view);
    return showMaterialOnly ? all.filter((r) => r.material) : all;
  }, [view, showMaterialOnly]);

  const maxAbs = useMemo(() => {
    const vals = rows.map((r) => {
      const raw = r.variance.replace(/[$,]/g, '').replace('−', '-');
      const m = raw.match(/(-?)([\d.]+)([MK]?)/);
      if (!m) return 0;
      let n = parseFloat(m[2]);
      if (m[3] === 'K') n /= 1000;
      return Math.abs(n);
    });
    return Math.max(0.01, ...vals);
  }, [rows]);

  const pageStyle = {
    width: '100%' as const,
    maxWidth: MAX_W,
    alignSelf: 'center' as const,
    padding: isWide ? 20 : 16,
    paddingBottom: 140,
  };

  const matCount = pickRows(view).filter((r) => r.material).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <VarianceSwitcher />
      {/* Top bar */}
      <View
        style={{
          paddingHorizontal: isWide ? 20 : 16,
          paddingTop: 8, paddingBottom: 10,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: '#64748B' }}>
            Variance
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A', marginTop: 1 }}>
            Flux Intelligence
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
              backgroundColor: '#FFF1E0',
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FE9519' }} />
            <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 0.4, color: '#FE9519' }}>
              {matCount} MATERIAL
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5,
              borderWidth: 1, borderColor: '#E2E8F0',
            }}
          >
            <Text style={{ fontSize: 10, color: '#64748B', letterSpacing: 0.4 }}>Q1 vs Q4 2025</Text>
          </View>
          <Pressable onPress={() => chatRef.current?.expand()} hitSlop={8}>
            <Icon.Sparkle color="#FE9519" size={22} />
          </Pressable>
        </View>
      </View>

      {/* View tabs — IS / BS / CF */}
      <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: isWide ? 20 : 12, gap: 6, paddingVertical: 8 }}
        >
          {VIEWS.map((v) => {
            const active = view === v.k;
            return (
              <Pressable
                key={v.k}
                onPress={() => setView(v.k)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6,
                  backgroundColor: active ? '#FFF1E0' : '#FFFFFF',
                  borderWidth: 1, borderColor: active ? '#FE9519' : '#E2E8F0',
                }}
              >
                <Text style={{
                  fontSize: 12, fontWeight: active ? '700' : '500',
                  color: active ? '#FE9519' : '#0F172A',
                }}>
                  {v.n}
                </Text>
                <Text style={{ fontSize: 9, color: active ? '#FE9519' : '#94A3B8', marginTop: 1 }}>{v.sub}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Materiality filter chip */}
      <View style={{ backgroundColor: '#F8FAFC', paddingHorizontal: isWide ? 20 : 16, paddingVertical: 10, flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => setShowMaterialOnly(false)}
          style={{
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
            backgroundColor: !showMaterialOnly ? '#FFF1E0' : '#FFFFFF',
            borderWidth: 1, borderColor: !showMaterialOnly ? '#FE9519' : '#E2E8F0',
          }}
        >
          <Text style={{
            fontSize: 12, fontWeight: !showMaterialOnly ? '600' : '500',
            color: !showMaterialOnly ? '#FE9519' : '#64748B',
          }}>
            All rows · {pickRows(view).length}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setShowMaterialOnly(true)}
          style={{
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
            backgroundColor: showMaterialOnly ? '#FFF1E0' : '#FFFFFF',
            borderWidth: 1, borderColor: showMaterialOnly ? '#FE9519' : '#E2E8F0',
          }}
        >
          <Text style={{
            fontSize: 12, fontWeight: showMaterialOnly ? '600' : '500',
            color: showMaterialOnly ? '#FE9519' : '#64748B',
          }}>
            Material only · {matCount}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={pageStyle}>
          {/* KPI strip */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            {FLUX_KPIS.map((k, i) => <KpiCard key={i} kpi={k} compact />)}
          </View>

          {/* Compact variance table — card per row to look good on tablet. */}
          <View
            style={{
              backgroundColor: '#FFFFFF', borderRadius: 12,
              borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden',
            }}
          >
            {/* Header row */}
            <View
              style={{
                flexDirection: 'row',
                paddingVertical: 8, paddingHorizontal: 14,
                backgroundColor: '#F8FAFC',
                borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
              }}
            >
              <Text style={{ flex: isXWide ? 2 : 2.3, fontSize: 9, letterSpacing: 0.8, color: '#64748B', fontWeight: '700' }}>ACCOUNT</Text>
              {isWide && (
                <>
                  <Text style={{ flex: 1, fontSize: 9, letterSpacing: 0.8, color: '#64748B', fontWeight: '700', textAlign: 'right' }}>CURR</Text>
                  <Text style={{ flex: 1, fontSize: 9, letterSpacing: 0.8, color: '#64748B', fontWeight: '700', textAlign: 'right' }}>PRIOR</Text>
                </>
              )}
              <Text style={{ flex: 1, fontSize: 9, letterSpacing: 0.8, color: '#64748B', fontWeight: '700', textAlign: 'right' }}>Δ</Text>
              {isXWide && (
                <View style={{ width: 130, alignItems: 'center' }}>
                  <Text style={{ fontSize: 9, letterSpacing: 0.8, color: '#64748B', fontWeight: '700' }}>VARIANCE</Text>
                </View>
              )}
              <Text style={{ width: 24 }} />
            </View>

            {rows.map((r, i) => {
              const varColor = TONE_COLOR[r.varTone];
              return (
                <Pressable
                  key={r.id}
                  onPress={() => askAgent(r.aiQ)}
                  style={{
                    paddingVertical: 10, paddingHorizontal: 14,
                    borderTopWidth: i === 0 ? 0 : 1, borderTopColor: '#F1F5F9',
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <View style={{ flex: isXWide ? 2 : 2.3, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: '#0F172A' }}>{r.account}</Text>
                      {r.material && (
                        <View style={{
                          paddingHorizontal: 5, paddingVertical: 1,
                          backgroundColor: '#FFF1E0', borderRadius: 3,
                        }}>
                          <Text style={{ fontSize: 8, fontWeight: '700', color: '#FE9519', letterSpacing: 0.4 }}>MAT</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2, lineHeight: 14 }}>
                      {r.driver}
                    </Text>
                  </View>
                  {isWide && (
                    <>
                      <Text style={{ flex: 1, fontSize: 12, color: '#0F172A', textAlign: 'right', fontVariant: ['tabular-nums'] as any }}>
                        {r.curr}
                      </Text>
                      <Text style={{ flex: 1, fontSize: 12, color: '#64748B', textAlign: 'right', fontVariant: ['tabular-nums'] as any }}>
                        {r.prior}
                      </Text>
                    </>
                  )}
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: varColor, fontVariant: ['tabular-nums'] as any }}>
                      {r.variance}
                    </Text>
                    <Text style={{ fontSize: 10, color: varColor, fontWeight: '500' }}>{r.variancePct}</Text>
                  </View>
                  {isXWide && (
                    <View style={{ width: 130, alignItems: 'center' }}>
                      <VarianceBar row={r} maxAbs={maxAbs} />
                    </View>
                  )}
                  <View style={{ width: 24, alignItems: 'flex-end' }}>
                    <Icon.Sparkle color="#FE9519" size={12} />
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 12 }}>
            Tap any row to ask the agent · materiality threshold $1M
          </Text>
        </View>
      </ScrollView>

      <ChatSheet ref={chatRef} />
    </SafeAreaView>
  );
}
