import { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polyline, Circle, Rect } from 'react-native-svg';
import { useAuth, useChat } from '../store';
import {
  PERF_KPIS, PERF_COMMENTARY, PERF_CHART,
  PERF_DRILL_SEGMENTS, PERF_EXCEPTIONS, PERF_SIGNALS, PERF_HISTORY,
} from '../data';
import type { TagTone } from '../types';
import { KpiCard } from '../components/KpiCard';
import { Commentary } from '../components/Commentary';
import { VarianceChart } from '../components/VarianceChart';
import { ChatSheet, type ChatSheetRef } from '../components/ChatSheet';
import { VarianceSwitcher } from '../components/VarianceSwitcher';
import { Icon } from '../components/icons';

// Shared tag color system — mirrors Commentary.tsx
const TAG_STYLES: Record<TagTone, { bg: string; fg: string }> = {
  red:   { bg: '#FEE2E2', fg: '#DC2626' },
  green: { bg: '#DCFCE7', fg: '#16A34A' },
  amber: { bg: '#FEF3C7', fg: '#D97706' },
  blue:  { bg: '#EFF6FF', fg: '#1E40AF' },
};

const TONE_COLOR = {
  pos:  '#16A34A',
  neg:  '#DC2626',
  warn: '#D97706',
  blue: '#1E40AF',
} as const;

// Max width for centered content on wide (tablet-landscape) screens.
const MAX_W = 1100;

function TagChip({ t, l }: { t: TagTone; l: string }) {
  const s = TAG_STYLES[t];
  return (
    <View style={{ backgroundColor: s.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}>
      <Text style={{ fontSize: 10, fontWeight: '500', color: s.fg }}>{l}</Text>
    </View>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 80, H = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = data.length > 1 ? W / (data.length - 1) : 0;
  const pts = data.map((v, i) => `${i * step},${H - ((v - min) / range) * H}`).join(' ');
  const last = data[data.length - 1];
  const lastY = H - ((last - min) / range) * H;
  return (
    <Svg width={W} height={H}>
      <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
      <Circle cx={(data.length - 1) * step} cy={lastY} r={2} fill={color} />
    </Svg>
  );
}

// Vertical spark bars — matches web `uf-drill-spark`.
function SparkBars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const H = 32, barW = 8, gap = 3;
  return (
    <Svg width={data.length * (barW + gap)} height={H}>
      {data.map((v, i) => {
        const h = (v / max) * H;
        return <Rect key={i} x={i * (barW + gap)} y={H - h} width={barW} height={h} rx={1} fill={color} />;
      })}
    </Svg>
  );
}

const REGIONS = [
  { k: 'global',   n: 'Global',   tone: 'neg'  as const },
  { k: 'americas', n: 'Americas', tone: 'neg'  as const },
  { k: 'emea',     n: 'EMEA',     tone: 'pos'  as const },
  { k: 'apac',     n: 'APAC',     tone: 'neg'  as const },
  { k: 'latam',    n: 'LATAM',    tone: 'warn' as const },
];

const TABS = [
  { k: 'analysis',   n: 'Analysis' },
  { k: 'drilldown',  n: 'Drill' },
  { k: 'exceptions', n: 'Exceptions', badge: 3 },
  { k: 'signals',    n: 'Signals' },
  { k: 'history',    n: 'History' },
];

export default function PerformanceScreen() {
  const { user } = useAuth();
  const { send } = useChat();
  const { width } = useWindowDimensions();
  const [region, setRegion] = useState('global');
  const [tab, setTab] = useState('analysis');
  const chatRef = useRef<ChatSheetRef>(null);

  // Tablet-aware breakpoints.
  const isWide = width >= 820;   // iPad portrait and up
  const isXWide = width >= 1100; // iPad landscape

  const askAgent = (q: string) => {
    send(q);
    chatRef.current?.expand();
  };

  // Centered-content wrapper. ScrollView fills the screen; inner View is capped
  // at MAX_W on wide screens so content doesn't stretch edge-to-edge.
  const pageStyle = {
    width: '100%' as const,
    maxWidth: MAX_W,
    alignSelf: 'center' as const,
    padding: isWide ? 20 : 16,
    paddingBottom: 140,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <VarianceSwitcher />
      {/* Compact top bar — matches web `uf-topbar` */}
      <View
        style={{
          paddingHorizontal: isWide ? 20 : 16,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text style={{ fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: '#64748B' }}>
            Variance
          </Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#0F172A', marginTop: 1 }}>
            Performance Intelligence
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              backgroundColor: '#DCFCE7',
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' }} />
            <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 0.4, color: '#16A34A' }}>LIVE</Text>
          </View>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 5,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <Text style={{ fontSize: 10, color: '#64748B', letterSpacing: 0.4 }}>W10 · Mar 3–9</Text>
          </View>
          <Pressable onPress={() => chatRef.current?.expand()} hitSlop={8}>
            <Icon.Sparkle color="#1E40AF" size={22} />
          </Pressable>
        </View>
      </View>

      {/* Sub-tabs */}
      <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: isWide ? 20 : 12, alignItems: 'center' }}
        >
          {TABS.map((t) => (
            <Pressable
              key={t.k}
              onPress={() => setTab(t.k)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderBottomWidth: 2,
                borderBottomColor: tab === t.k ? '#1E40AF' : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text
                  style={{
                    fontSize: 13,
                    color: tab === t.k ? '#0F172A' : '#64748B',
                    fontWeight: tab === t.k ? '600' : '500',
                  }}
                >
                  {t.n}
                </Text>
                {t.badge && (
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#DC2626' }} />
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Region chip row */}
      <View style={{ backgroundColor: '#F8FAFC' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: isWide ? 20 : 16,
            paddingVertical: 10,
            alignItems: 'center',
            gap: 8,
          }}
        >
          {REGIONS.map((r) => {
            const active = r.k === region;
            return (
              <Pressable
                key={r.k}
                onPress={() => setRegion(r.k)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: active ? '#1E40AF' : '#E2E8F0',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: active ? '600' : '500',
                    color: active ? '#1E40AF' : '#64748B',
                  }}
                >
                  {r.n}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ─────────── ANALYSIS tab ─────────── */}
      {tab === 'analysis' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={pageStyle}>
            {/* 4-stat KPI strip — web `uf-stat-row` */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              {PERF_KPIS.map((k, i) => <KpiCard key={i} kpi={k} compact />)}
            </View>

            {/* On wide screens commentary + chart go side-by-side; on phones they stack. */}
            <View style={{ flexDirection: isXWide ? 'row' : 'column', gap: 12 }}>
              <View style={{ flex: isXWide ? 1.1 : undefined }}>
                <Commentary items={PERF_COMMENTARY} />
              </View>
              <View style={{ flex: isXWide ? 1 : undefined }}>
                <VarianceChart
                  title={`Weekly Revenue Variance — ${REGIONS.find((r) => r.k === region)?.n ?? 'Global'}`}
                  bars={PERF_CHART}
                />
              </View>
            </View>

            <Text style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', marginTop: 12 }}>
              Showing {user?.role} view · Tap the sparkle icon to ask the agent anything
            </Text>
          </View>
        </ScrollView>
      )}

      {/* ─────────── DRILL tab ─────────── */}
      {tab === 'drilldown' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={pageStyle}>
            <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 8, letterSpacing: 1, fontWeight: '600' }}>
              SEGMENT BREAKDOWN · W10
            </Text>
            {/* 2-column grid on wide, single column on phones — web `uf-drill-grid` */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {PERF_DRILL_SEGMENTS.map((s) => {
                const varColor = TONE_COLOR[s.varTone];
                const utilColor = TONE_COLOR[s.utilTone];
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => askAgent(s.aiQ)}
                    style={{
                      width: isWide ? '48.8%' : '100%',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 8,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: '#E2E8F0',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>{s.name}</Text>
                        <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, letterSpacing: 0.5 }}>
                          {s.region.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: varColor }}>{s.variance}</Text>
                    </View>
                    <View style={{ marginTop: 10, marginBottom: 8 }}>
                      <SparkBars data={s.spark} color={varColor} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: utilColor }}>{s.util}</Text>
                        <Text style={{ fontSize: 9, color: '#94A3B8', letterSpacing: 0.5, marginTop: 1 }}>UTIL</Text>
                      </View>
                      <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>{s.trips}</Text>
                        <Text style={{ fontSize: 9, color: '#94A3B8', letterSpacing: 0.5, marginTop: 1 }}>TRIPS</Text>
                      </View>
                      <View style={{ alignItems: 'center', flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: s.tripsVsPlan.startsWith('+') ? '#16A34A' : '#DC2626',
                          }}
                        >
                          {s.tripsVsPlan}
                        </Text>
                        <Text style={{ fontSize: 9, color: '#94A3B8', letterSpacing: 0.5, marginTop: 1 }}>VS PLAN</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      {/* ─────────── EXCEPTIONS tab ─────────── */}
      {tab === 'exceptions' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={pageStyle}>
            <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 8, letterSpacing: 1, fontWeight: '600' }}>
              EXCEPTIONS · {PERF_EXCEPTIONS.length} FLAGGED
            </Text>
            {PERF_EXCEPTIONS.map((e) => {
              const sevColor =
                e.severity === 'critical' ? '#DC2626'
                : e.severity === 'warning' ? '#D97706'
                : '#16A34A';
              const sevBg =
                e.severity === 'critical' ? '#FEE2E2'
                : e.severity === 'warning' ? '#FEF3C7'
                : '#DCFCE7';
              const valColor = e.value.startsWith('+') ? '#16A34A' : '#DC2626';
              return (
                <Pressable
                  key={e.id}
                  onPress={() => askAgent(e.aiQ)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderLeftWidth: 3,
                    borderLeftColor: sevColor,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>{e.name}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#64748B', lineHeight: 16 }}>{e.detail}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                      <View
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 1,
                          borderRadius: 3,
                          backgroundColor: sevBg,
                        }}
                      >
                        <Text style={{ fontSize: 9, fontWeight: '700', color: sevColor, letterSpacing: 0.4 }}>
                          {e.severity.toUpperCase()}
                        </Text>
                      </View>
                      {e.tags.map((t, i) => <TagChip key={i} t={t.t} l={t.l} />)}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: valColor }}>{e.value}</Text>
                    <Text style={{ fontSize: 9, color: '#94A3B8', letterSpacing: 0.4, marginTop: 2 }}>{e.week}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* ─────────── SIGNALS tab ─────────── */}
      {tab === 'signals' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={pageStyle}>
            <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 8, letterSpacing: 1, fontWeight: '600' }}>
              ML SIGNALS · {PERF_SIGNALS.length} ACTIVE
            </Text>
            {PERF_SIGNALS.map((s, i) => {
              const typeColors = TAG_STYLES[s.typeTone];
              const confColor =
                s.confidence >= 90 ? '#16A34A'
                : s.confidence >= 75 ? '#1E40AF'
                : '#D97706';
              return (
                <View
                  key={i}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    padding: 14,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <View
                          style={{
                            paddingHorizontal: 7,
                            paddingVertical: 1,
                            borderRadius: 3,
                            backgroundColor: typeColors.bg,
                          }}
                        >
                          <Text style={{ fontSize: 10, fontWeight: '600', color: typeColors.fg }}>{s.type}</Text>
                        </View>
                        <Icon.Sparkle color="#1E40AF" size={11} />
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>{s.name}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 18, fontWeight: '700', color: confColor }}>{s.confidence}%</Text>
                      <Text style={{ fontSize: 9, color: '#94A3B8', letterSpacing: 0.4 }}>CONFIDENCE</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748B', lineHeight: 16, marginTop: 8 }}>{s.body}</Text>
                  <View style={{ marginTop: 10, height: 3, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                    <View
                      style={{
                        width: `${s.confidence}%` as any,
                        height: 3,
                        backgroundColor: confColor,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* ─────────── HISTORY tab ─────────── */}
      {tab === 'history' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={pageStyle}>
            <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 8, letterSpacing: 1, fontWeight: '600' }}>
              ROLLING 12-WEEK HISTORY
            </Text>
            {PERF_HISTORY.map((h, i) => {
              const varColor = TONE_COLOR[h.varTone];
              const clickable = !!h.aiQ;
              const Wrapper: any = clickable ? Pressable : View;
              return (
                <Wrapper
                  key={i}
                  {...(clickable ? { onPress: () => askAgent(h.aiQ!) } : {})}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 8,
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: h.current ? '#1E40AF' : '#E2E8F0',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 52,
                      paddingVertical: 4,
                      borderRadius: 4,
                      backgroundColor: h.current ? '#EFF6FF' : '#F8FAFC',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: h.current ? '#1E40AF' : '#0F172A' }}>
                      {h.week}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#475569' }}>{h.dates}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
                      {h.tags.map((t, j) => <TagChip key={j} t={t.t} l={t.l} />)}
                      {h.current && (
                        <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 3 }}>
                          <Text style={{ fontSize: 9, fontWeight: '600', color: '#1E40AF', letterSpacing: 0.4 }}>
                            CURRENT
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: varColor }}>{h.variance}</Text>
                </Wrapper>
              );
            })}
          </View>
        </ScrollView>
      )}

      <ChatSheet ref={chatRef} />
    </SafeAreaView>
  );
}
