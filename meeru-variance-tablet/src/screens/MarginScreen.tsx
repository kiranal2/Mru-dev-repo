import { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Polyline, Line, Text as SvgText, G } from 'react-native-svg';
import { useChat } from '../store';
import {
  MARGIN_KPIS, MARGIN_WATERFALL, MARGIN_PRODUCT_MIX,
  MARGIN_COST_DRIVERS, MARGIN_SENSITIVITY,
} from '../data';
import type { TagTone } from '../types';
import { KpiCard } from '../components/KpiCard';
import { ChatSheet, type ChatSheetRef } from '../components/ChatSheet';
import { CommandCenter } from '../components/CommandCenter';
import { VarianceSwitcher } from '../components/VarianceSwitcher';
import { Icon } from '../components/icons';

const TONE_COLOR = {
  pos:  '#16A34A',
  neg:  '#DC2626',
  warn: '#D97706',
  blue: '#B64D1D',
} as const;

const TAG_STYLES: Record<TagTone, { bg: string; fg: string }> = {
  red:   { bg: '#FEE2E2', fg: '#DC2626' },
  green: { bg: '#DCFCE7', fg: '#16A34A' },
  amber: { bg: '#FEF3C7', fg: '#D97706' },
  blue:  { bg: '#F7E8D8', fg: '#B64D1D' },
};

const MAX_W = 1100;

const TABS = [
  { k: 'bridge',       n: 'Bridge' },
  { k: 'mix',          n: 'Product Mix' },
  { k: 'drivers',      n: 'Cost Drivers' },
  { k: 'sensitivity',  n: 'Sensitivity' },
];

// Build a clean waterfall SVG. Heights are in GM% space (0–100). We render a
// compact chart suitable for tablet (larger) and phone (smaller) widths.
function Waterfall({ width }: { width: number }) {
  const H = 180;
  const pad = 28;
  const innerW = width - pad * 2;
  const bars = MARGIN_WATERFALL;
  const barW = Math.max(28, Math.min(72, innerW / bars.length - 8));
  const gap = (innerW - barW * bars.length) / Math.max(1, bars.length - 1);

  // Compute running cumulative GM% for pos/neg bars. start and end use absolute value.
  let cum = bars[0].value;
  const rows = bars.map((b, i) => {
    if (b.kind === 'start' || b.kind === 'end') {
      return { ...b, from: 0, to: b.value };
    }
    const from = cum;
    const to = cum + b.value;
    cum = to;
    return { ...b, from, to };
  });

  const vals = rows.flatMap((r) => [r.from, r.to, r.to === 0 ? r.value : r.to]);
  const minV = Math.min(...vals.filter((v) => v > 0));
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const yFor = (v: number) => H - ((v - minV) / range) * (H - 30) - 10;

  return (
    <Svg width={width} height={H + 40}>
      {/* baseline */}
      <Line x1={pad} y1={H - 10} x2={width - pad} y2={H - 10} stroke="#E2E8F0" strokeWidth={1} />
      {rows.map((r, i) => {
        const x = pad + i * (barW + gap);
        const color =
          r.kind === 'start' || r.kind === 'end' ? '#B64D1D'
          : r.kind === 'pos' ? '#16A34A'
          : '#DC2626';

        // start/end: solid bar from baseline to value
        if (r.kind === 'start' || r.kind === 'end') {
          const y = yFor(r.to);
          const h = H - 10 - y;
          return (
            <G key={`bar-${i}`}>
              <Rect x={x} y={y} width={barW} height={h} fill={color} rx={2} />
              <SvgText
                x={x + barW / 2}
                y={y - 5}
                fontSize={10}
                fontWeight="700"
                fill="#0F172A"
                textAnchor="middle"
              >
                {r.to.toFixed(1)}%
              </SvgText>
            </G>
          );
        }

        // floating bar between from and to
        const top = yFor(Math.max(r.from, r.to));
        const bot = yFor(Math.min(r.from, r.to));
        const h = Math.max(2, bot - top);
        const deltaStr = (r.value > 0 ? '+' : '') + r.value.toFixed(1) + 'pp';
        return (
          <G key={`bar-${i}`}>
            <Rect x={x} y={top} width={barW} height={h} fill={color} rx={2} />
            <SvgText
              x={x + barW / 2}
              y={top - 5}
              fontSize={10}
              fontWeight="600"
              fill={color}
              textAnchor="middle"
            >
              {deltaStr}
            </SvgText>
          </G>
        );
      })}
      {/* Labels below */}
      {rows.map((r, i) => {
        const x = pad + i * (barW + gap) + barW / 2;
        return (
          <SvgText
            key={`label-${i}`}
            x={x}
            y={H + 18}
            fontSize={9}
            fill="#64748B"
            textAnchor="middle"
          >
            {r.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// Mini sparkline for cost driver cards.
function MiniLine({ data, color }: { data: number[]; color: string }) {
  const W = 80, H = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = data.length > 1 ? W / (data.length - 1) : 0;
  const pts = data.map((v, i) => `${i * step},${H - ((v - min) / range) * (H - 2) - 1}`).join(' ');
  return (
    <Svg width={W} height={H}>
      <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export default function MarginScreen() {
  const { send } = useChat();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState('bridge');
  const chatRef = useRef<ChatSheetRef>(null);

  const isWide = width >= 820;
  const isXWide = width >= 1100;

  const askAgent = (q: string) => {
    send(q);
    chatRef.current?.expand();
  };

  const pageStyle = {
    width: '100%' as const,
    maxWidth: MAX_W,
    alignSelf: 'center' as const,
    padding: isWide ? 20 : 16,
    paddingBottom: 140,
  };

  const contentW = Math.min(width, MAX_W) - (isWide ? 40 : 32) - 28; // subtract padding + card padding

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      <VarianceSwitcher />
      {/* Top bar */}
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
            Margin Intelligence
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
              backgroundColor: '#FEF3C7',
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#D97706' }} />
            <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 0.4, color: '#D97706' }}>GM ↓</Text>
          </View>
          <View
            style={{
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5,
              borderWidth: 1, borderColor: '#E2E8F0',
            }}
          >
            <Text style={{ fontSize: 10, color: '#64748B', letterSpacing: 0.4 }}>Q1 2026</Text>
          </View>
          <Pressable onPress={() => chatRef.current?.expand()} hitSlop={8}>
            <Icon.Sparkle color="#B64D1D" size={22} />
          </Pressable>
        </View>
      </View>

      {/* Sub-tabs */}
      <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: isWide ? 20 : 12 }}
        >
          {TABS.map((t) => (
            <Pressable
              key={t.k}
              onPress={() => setTab(t.k)}
              style={{
                paddingHorizontal: 14, paddingVertical: 10,
                borderBottomWidth: 2,
                borderBottomColor: tab === t.k ? '#B64D1D' : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 13,
                color: tab === t.k ? '#0F172A' : '#64748B',
                fontWeight: tab === t.k ? '600' : '500',
              }}>
                {t.n}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* ─────────── BRIDGE tab ─────────── */}
      {tab === 'bridge' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={pageStyle}>
            {/* 4 KPI strip */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              {MARGIN_KPIS.map((k, i) => <KpiCard key={i} kpi={k} compact />)}
            </View>

            {/* Waterfall card */}
            <View
              style={{
                backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
                borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>
                  Gross Margin Bridge — Prior Q to Current Q
                </Text>
                <Pressable onPress={() => askAgent('Walk me through the gross margin bridge')} hitSlop={6}>
                  <Icon.Sparkle color="#B64D1D" size={14} />
                </Pressable>
              </View>
              <Waterfall width={contentW} />
            </View>

            {/* Takeaways */}
            <View
              style={{
                backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
                borderWidth: 1, borderColor: '#E2E8F0',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#0F172A', marginBottom: 8 }}>
                Key Takeaways
              </Text>
              {[
                { tone: 'neg' as const, text: 'Labor OT dominates the decline — 140 bps of the 120 bps GM% drop sits in California Retail.' },
                { tone: 'neg' as const, text: 'Cloud egress is a slow-burn 30 bps headwind; FinOps reservation could neutralise by W16.' },
                { tone: 'pos' as const, text: 'Pricing actions and volume mix together add 100 bps — partial offset holding for 4th straight quarter.' },
              ].map((row, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 6, backgroundColor: TONE_COLOR[row.tone] }} />
                  <Text style={{ flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 }}>{row.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* ─────────── PRODUCT MIX tab ─────────── */}
      {tab === 'mix' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={pageStyle}>
            <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 8, letterSpacing: 1, fontWeight: '600' }}>
              PRODUCT MIX · MARGIN BY LINE
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {MARGIN_PRODUCT_MIX.map((p) => {
                const marginColor = TONE_COLOR[p.marginTone];
                const deltaColor = TONE_COLOR[p.deltaTone];
                return (
                  <Pressable
                    key={p.name}
                    onPress={() => askAgent(p.aiQ)}
                    style={{
                      width: isXWide ? '32.2%' : isWide ? '48.8%' : '100%',
                      backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14,
                      borderWidth: 1, borderColor: '#E2E8F0',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: '#0F172A' }}>{p.name}</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: marginColor }}>{p.margin}</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: deltaColor, marginTop: 3, fontWeight: '500' }}>
                      {p.marginDelta}
                    </Text>
                    {/* Revenue share bar */}
                    <View style={{ marginTop: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 9, letterSpacing: 0.5, color: '#94A3B8', fontWeight: '600' }}>REV SHARE</Text>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#0F172A' }}>{p.revShare}</Text>
                      </View>
                      <View style={{ height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                        <View
                          style={{
                            width: `${p.revShareNum * 2}%` as any,
                            maxWidth: '100%' as any,
                            height: 6, backgroundColor: '#B64D1D', borderRadius: 3,
                          }}
                        />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      {/* ─────────── COST DRIVERS tab ─────────── */}
      {tab === 'drivers' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={pageStyle}>
            <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 8, letterSpacing: 1, fontWeight: '600' }}>
              COST DRIVERS · {MARGIN_COST_DRIVERS.length} ACTIVE
            </Text>
            {MARGIN_COST_DRIVERS.map((d, i) => {
              const catStyle = TAG_STYLES[d.categoryTone];
              const impactColor = TONE_COLOR[d.impactTone];
              return (
                <View
                  key={i}
                  style={{
                    backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14,
                    marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0',
                    borderLeftWidth: 3, borderLeftColor: impactColor,
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <View style={{
                        paddingHorizontal: 7, paddingVertical: 1, borderRadius: 3,
                        backgroundColor: catStyle.bg,
                      }}>
                        <Text style={{ fontSize: 10, fontWeight: '600', color: catStyle.fg }}>{d.category}</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A', flex: 1 }}>{d.name}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#64748B', lineHeight: 16 }}>{d.body}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: impactColor }}>{d.impact}</Text>
                    <View style={{ marginTop: 6 }}>
                      <MiniLine data={d.trend} color={impactColor} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* ─────────── SENSITIVITY tab ─────────── */}
      {tab === 'sensitivity' && (
        <ScrollView style={{ flex: 1 }}>
          <View style={pageStyle}>
            <Text style={{ fontSize: 10, color: '#64748B', marginBottom: 8, letterSpacing: 1, fontWeight: '600' }}>
              SENSITIVITY · WHAT-IF SCENARIOS
            </Text>
            {MARGIN_SENSITIVITY.map((s, i) => {
              const mColor = TONE_COLOR[s.marginTone];
              const aColor = TONE_COLOR[s.arrTone];
              const probColor = s.probability >= 60 ? '#16A34A' : s.probability >= 40 ? '#B64D1D' : '#D97706';
              return (
                <View
                  key={i}
                  style={{
                    backgroundColor: '#FFFFFF', borderRadius: 8, padding: 14,
                    marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>{s.name}</Text>
                      <Text style={{ fontSize: 10, color: '#94A3B8', marginTop: 2, letterSpacing: 0.4 }}>
                        DRIVER · {s.driver.toUpperCase()}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => askAgent(`Run what-if: ${s.name}`)}
                      style={{
                        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5,
                        backgroundColor: '#F7E8D8', flexDirection: 'row', gap: 4, alignItems: 'center',
                      }}
                    >
                      <Icon.Sparkle color="#B64D1D" size={11} />
                      <Text style={{ fontSize: 10, fontWeight: '600', color: '#B64D1D' }}>Run</Text>
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 10, gap: 16 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 9, letterSpacing: 0.5, color: '#94A3B8', fontWeight: '600' }}>GM IMPACT</Text>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: mColor, marginTop: 2 }}>{s.marginImpact}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 9, letterSpacing: 0.5, color: '#94A3B8', fontWeight: '600' }}>ARR IMPACT</Text>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: aColor, marginTop: 2 }}>{s.arrImpact}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 9, letterSpacing: 0.5, color: '#94A3B8', fontWeight: '600' }}>PROBABILITY</Text>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: probColor, marginTop: 2 }}>{s.probability}%</Text>
                    </View>
                  </View>
                  <View style={{ marginTop: 10, height: 4, backgroundColor: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                    <View
                      style={{
                        width: `${s.probability}%` as any,
                        height: 4, backgroundColor: probColor, borderRadius: 2,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <CommandCenter />
      <ChatSheet ref={chatRef} />
    </SafeAreaView>
  );
}
