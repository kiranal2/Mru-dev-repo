import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Svg, { Rect, Polyline } from 'react-native-svg';
import type {
  FluxDrillRow, FluxExceptionItem, FluxSignalItem, FluxHistoryRow,
} from '../industry-presets';

// =======================================================================
// Helpers
// =======================================================================
function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function SparkBars({ data, tone }: { data: number[]; tone: 'pos' | 'neg' | 'warn' }) {
  const max = Math.max(...data);
  const H = 28, barW = 6, gap = 2;
  const color = tone === 'pos' ? '#16A34A' : tone === 'neg' ? '#DC2626' : '#D97706';
  return (
    <Svg width={data.length * (barW + gap)} height={H}>
      {data.map((v, i) => {
        const h = (v / max) * H;
        return (
          <Rect
            key={i}
            x={i * (barW + gap)}
            y={H - h}
            width={barW}
            height={h}
            rx={1}
            fill={color}
          />
        );
      })}
    </Svg>
  );
}

function SparkLine({ data, color }: { data: number[]; color: string }) {
  const W = 80, H = 20;
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`)
    .join(' ');
  return (
    <Svg width={W} height={H}>
      <Polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function toneForStatus(status: FluxDrillRow['status']): 'pos' | 'neg' | 'warn' {
  if (status === 'Expansion') return 'pos';
  if (status === 'At Risk' || status === 'Churned') return 'neg';
  return 'warn';
}

const STATUS_STYLE = {
  Expansion: { bg: 'rgba(22,163,74,0.14)',  text: 'text-positive' },
  Healthy:   { bg: 'rgba(22,163,74,0.14)',  text: 'text-positive' },
  'At Risk': { bg: 'rgba(217,119,6,0.14)',  text: 'text-warning' },
  Churned:   { bg: 'rgba(220,38,38,0.14)',  text: 'text-negative' },
} as const;

// =======================================================================
// DRILL-DOWN — cards / table toggle
// =======================================================================
export function DrillDownView({
  rows,
  focusSegment,
}: {
  rows: FluxDrillRow[];
  focusSegment?: string | null;
}) {
  const [view, setView] = useState<'cards' | 'table'>('cards');
  return (
    <View>
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[13px] font-semibold text-ink">
          Segment Drill-Down · {rows.length} rows
        </Text>
        <View className="flex-row bg-surface-soft rounded-md p-0.5">
          {(['cards', 'table'] as const).map((v) => (
            <Pressable
              key={v}
              onPress={() => setView(v)}
              className={`px-2.5 py-1 rounded ${view === v ? 'bg-surface border border-rule' : ''}`}
            >
              <Text
                className={`text-[11px] capitalize ${
                  view === v ? 'text-brand font-semibold' : 'text-muted'
                }`}
              >
                {v}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {view === 'cards' ? (
        <View className="flex-row flex-wrap -mx-1">
          {rows.map((r) => {
            const focused = focusSegment && r.customer === focusSegment;
            return <DrillCard key={r.id} row={r} focused={!!focused} />;
          })}
        </View>
      ) : (
        <DrillTable rows={rows} />
      )}
    </View>
  );
}

function DrillCard({ row, focused }: { row: FluxDrillRow; focused: boolean }) {
  const tone = toneForStatus(row.status);
  const statusStyle = STATUS_STYLE[row.status];
  return (
    <View className="px-1 mb-2" style={{ width: '50%' }}>
      <View
        className={`bg-surface border rounded-lg p-3 ${focused ? 'border-brand' : 'border-rule'}`}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[13px] font-semibold text-ink flex-1" numberOfLines={1}>
            {row.customer}
          </Text>
          <View
            className="px-1.5 py-0.5 rounded"
            style={{ backgroundColor: statusStyle.bg }}
          >
            <Text className={`text-[9px] font-bold uppercase tracking-wider ${statusStyle.text}`}>
              {row.status}
            </Text>
          </View>
        </View>
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-[10px] uppercase tracking-wider text-faint">Volume</Text>
            <Text className="text-[14px] font-semibold text-ink">{fmtCompact(row.arr)}</Text>
          </View>
          <View>
            <Text className="text-[10px] uppercase tracking-wider text-faint">vs Plan</Text>
            <Text
              className={`text-[13px] font-semibold ${
                tone === 'pos' ? 'text-positive' : tone === 'neg' ? 'text-negative' : 'text-warning'
              }`}
            >
              {row.tripsVsPlan}
            </Text>
          </View>
          <SparkBars data={row.spark} tone={tone} />
        </View>
        <Text className="text-[10.5px] text-muted mt-2" numberOfLines={1}>
          {row.lastActivity}
        </Text>
      </View>
    </View>
  );
}

function DrillTable({ rows }: { rows: FluxDrillRow[] }) {
  return (
    <View className="bg-surface border border-rule rounded-lg overflow-hidden">
      <View className="flex-row px-3 py-2 border-b border-rule bg-surface-soft">
        <Text className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-faint">Segment</Text>
        <Text className="w-[80px] text-[10px] font-semibold uppercase tracking-wider text-faint text-right">Volume</Text>
        <Text className="w-[70px] text-[10px] font-semibold uppercase tracking-wider text-faint text-right">Plan Δ</Text>
        <Text className="w-[70px] text-[10px] font-semibold uppercase tracking-wider text-faint text-right">Status</Text>
      </View>
      {rows.map((r) => {
        const tone = toneForStatus(r.status);
        return (
          <View key={r.id} className="flex-row items-center px-3 py-2 border-b border-rule">
            <Text className="flex-1 text-[12px] text-ink" numberOfLines={1}>{r.customer}</Text>
            <Text className="w-[80px] text-[12px] text-muted text-right">{fmtCompact(r.arr)}</Text>
            <Text
              className={`w-[70px] text-[12px] font-medium text-right ${
                tone === 'pos' ? 'text-positive' : tone === 'neg' ? 'text-negative' : 'text-warning'
              }`}
            >
              {r.tripsVsPlan}
            </Text>
            <Text className={`w-[70px] text-[11px] text-right ${STATUS_STYLE[r.status].text}`}>{r.status}</Text>
          </View>
        );
      })}
    </View>
  );
}

// =======================================================================
// EXCEPTIONS — compact rows with 6x6 severity icon (no Critical/Warning/
// Positive label — severity is discoverable via color + tooltip).
// =======================================================================
const SEV_COLOR = {
  critical: '#DC2626',
  warning:  '#D97706',
  positive: '#16A34A',
};

export function ExceptionsView({ items }: { items: FluxExceptionItem[] }) {
  return (
    <View className="bg-surface border border-rule rounded-lg">
      {items.map((e, i) => (
        <View
          key={e.id}
          className={`flex-row items-start p-3 ${i < items.length - 1 ? 'border-b border-rule' : ''}`}
        >
          <View
            className="w-6 h-6 rounded-full items-center justify-center mt-0.5 mr-3"
            style={{ backgroundColor: `${SEV_COLOR[e.severity]}22` }}
          >
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: SEV_COLOR[e.severity] }}
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-0.5">
              <Text className="text-[13px] font-semibold text-ink flex-1" numberOfLines={1}>
                {e.title}
              </Text>
              <Text
                className={`text-[12px] font-semibold ${
                  e.severity === 'critical' ? 'text-negative'
                    : e.severity === 'warning' ? 'text-warning'
                    : 'text-positive'
                }`}
              >
                {e.impact}
              </Text>
            </View>
            <Text className="text-[11px] text-muted mb-1">{e.entity} · {e.age}</Text>
            <Text className="text-[11.5px] text-ink leading-5">{e.driver}</Text>
            <Text className="text-[10.5px] text-faint mt-1">Owner: {e.owner}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// =======================================================================
// SIGNALS — ML confidence + horizon rows
// =======================================================================
export function SignalsView({ items }: { items: FluxSignalItem[] }) {
  return (
    <View>
      {items.map((s) => (
        <View key={s.id} className="bg-surface border border-rule rounded-lg p-3 mb-2">
          <View className="flex-row items-start justify-between mb-1">
            <Text className="text-[13px] font-semibold text-ink flex-1" numberOfLines={1}>
              {s.title}
            </Text>
            <View className="flex-row items-center gap-1.5 ml-2">
              <Text className="text-[11px] font-semibold text-brand">{s.confidence}%</Text>
              <Text className="text-[10px] text-faint">conf</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2 mb-1.5">
            <View className="px-1.5 py-0.5 rounded bg-surface-soft">
              <Text className="text-[9.5px] uppercase tracking-wider text-muted">{s.horizon}</Text>
            </View>
            <View className={`px-1.5 py-0.5 rounded ${s.direction === 'up' ? 'bg-positive-weak' : 'bg-negative-weak'}`}>
              <Text
                className={`text-[9.5px] font-bold uppercase tracking-wider ${
                  s.direction === 'up' ? 'text-positive' : 'text-negative'
                }`}
              >
                {s.direction === 'up' ? '▲ Up' : '▼ Down'}
              </Text>
            </View>
            <Text className="text-[10px] text-faint">· {s.model}</Text>
          </View>
          <Text className="text-[11.5px] text-muted leading-5 mb-1.5">{s.body}</Text>
          <Text className="text-[11px] text-brand">→ {s.suggestedAction}</Text>
        </View>
      ))}
    </View>
  );
}

// =======================================================================
// HISTORY — rolling-period table with sparklines
// =======================================================================
export function HistoryView({ rows }: { rows: FluxHistoryRow[] }) {
  return (
    <View className="bg-surface border border-rule rounded-lg overflow-hidden">
      <View className="flex-row px-3 py-2 border-b border-rule bg-surface-soft">
        <Text className="w-[80px] text-[10px] font-semibold uppercase tracking-wider text-faint">Period</Text>
        <Text className="w-[70px] text-[10px] font-semibold uppercase tracking-wider text-faint text-right">Actual</Text>
        <Text className="w-[70px] text-[10px] font-semibold uppercase tracking-wider text-faint text-right">Plan</Text>
        <Text className="w-[70px] text-[10px] font-semibold uppercase tracking-wider text-faint text-right">Var</Text>
        <Text className="w-[85px] text-[10px] font-semibold uppercase tracking-wider text-faint text-right">Trend</Text>
        <Text className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-faint ml-3">Notes</Text>
      </View>
      {rows.map((r, i) => {
        const tone = r.variance > 0 ? 'pos' : r.variance < 0 ? 'neg' : 'warn';
        const color = tone === 'pos' ? '#16A34A' : tone === 'neg' ? '#DC2626' : '#D97706';
        return (
          <View key={i} className="flex-row items-center px-3 py-2 border-b border-rule">
            <Text className="w-[80px] text-[12px] font-semibold text-ink">{r.period}</Text>
            <Text className="w-[70px] text-[12px] text-muted text-right">{r.revenue}</Text>
            <Text className="w-[70px] text-[12px] text-muted text-right">{r.plan}</Text>
            <Text
              className={`w-[70px] text-[12px] font-medium text-right ${
                tone === 'pos' ? 'text-positive' : tone === 'neg' ? 'text-negative' : 'text-warning'
              }`}
            >
              {r.variance > 0 ? '+' : ''}{r.variance}
            </Text>
            <View className="w-[85px] items-end">
              <SparkLine data={r.spark} color={color} />
            </View>
            <Text className="flex-1 text-[11px] text-muted ml-3" numberOfLines={1}>{r.annotations}</Text>
          </View>
        );
      })}
    </View>
  );
}
