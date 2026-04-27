import React, { useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, Pattern, Path } from 'react-native-svg';
import type { ChartBar } from '../types';
import { useTheme } from '../theme';

const TONE_COLORS = {
  neg:  '#DC2626',
  pos:  '#16A34A',
  warn: '#D97706',
  blue: '#FE9519',
} as const;

// Chart scaffolding hexes (baseline, plan bars, labels) picked per theme so
// SVG renders correctly on both light and dark surfaces. RN SVG props take
// raw color strings, not Tailwind classes, so we switch explicitly here.
const SCAFFOLD = {
  light: { baseline: '#E2E8F0', plan: '#E2E8F0', xlabel: '#94A3B8', value: '#475569' },
  dark:  { baseline: '#262626', plan: '#262626', xlabel: '#737373', value: '#A3A3A3' },
} as const;

export function VarianceChart({ title, bars }: { title: string; bars: ChartBar[] }) {
  const { theme } = useTheme();
  const s = SCAFFOLD[theme];
  // Measure container width via onLayout so the chart scales to whatever
  // column it's rendered into — inside WorkbenchShell the main column is
  // narrower than window width.
  const [layoutW, setLayoutW] = useState<number>(Dimensions.get('window').width - 56);
  const w = layoutW;
  const H = 180;
  const pad = 28;
  const max = Math.max(...bars.map(b => Math.abs(b.a)), ...bars.map(b => Math.abs(b.p)));
  const slot = (w - pad * 2) / bars.length;
  const bw = Math.min(26, slot * 0.4);
  const mid = H - pad;
  const usableH = H - pad - 26;

  return (
    <View
      className="bg-surface border border-rule rounded-2xl p-4 mb-3"
      onLayout={(e) => setLayoutW(e.nativeEvent.layout.width - 32)}
    >
      <Text className="text-[13px] font-semibold text-ink mb-2">{title}</Text>
      <Svg width={w - 32} height={H + 12}>
        <Defs>
          {bars.map((b, i) =>
            b.forecast ? (
              <Pattern key={i} id={`fx-${i}`} width={4} height={4} patternUnits="userSpaceOnUse">
                <Rect width={4} height={4} fill={TONE_COLORS[b.tone]} opacity={0.35} />
                <Path d="M0 4 L4 0" stroke={TONE_COLORS[b.tone]} strokeWidth={1} />
              </Pattern>
            ) : null
          )}
        </Defs>
        <Line x1={pad} y1={mid} x2={w - pad - 32} y2={mid} stroke={s.baseline} strokeWidth={1} />
        {bars.map((b, i) => {
          const x = pad + slot * i + slot / 2;
          const ha = (Math.abs(b.a) / max) * usableH;
          const hp = (Math.abs(b.p) / max) * usableH;
          const aY = mid - ha;
          const pY = mid - hp;
          const fill = b.forecast ? `url(#fx-${i})` : TONE_COLORS[b.tone];
          return (
            <React.Fragment key={i}>
              {b.p !== 0 && (
                <Rect x={x - bw - 1} y={pY} width={bw} height={hp} fill={s.plan} rx={2} opacity={0.6} />
              )}
              <Rect x={x - 1} y={aY} width={bw} height={ha} fill={fill} rx={2} />
              <SvgText x={x - 1 + bw / 2} y={H - 6} textAnchor="middle" fontSize={10} fill={s.xlabel}>
                {b.w}
              </SvgText>
              <SvgText x={x - 1 + bw / 2} y={aY - 5} textAnchor="middle" fontSize={9} fill={s.value}>
                {b.a}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
