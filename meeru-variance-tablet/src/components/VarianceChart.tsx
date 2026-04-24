import React, { useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Defs, Pattern, Path } from 'react-native-svg';
import type { ChartBar } from '../types';

const COLORS = {
  neg:  '#DC2626',
  pos:  '#16A34A',
  warn: '#D97706',
  blue: '#1E40AF',
} as const;

export function VarianceChart({ title, bars }: { title: string; bars: ChartBar[] }) {
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
                <Rect width={4} height={4} fill={COLORS[b.tone]} opacity={0.35} />
                <Path d="M0 4 L4 0" stroke={COLORS[b.tone]} strokeWidth={1} />
              </Pattern>
            ) : null
          )}
        </Defs>
        <Line x1={pad} y1={mid} x2={w - pad - 32} y2={mid} stroke="#E2E8F0" strokeWidth={1} />
        {bars.map((b, i) => {
          const x = pad + slot * i + slot / 2;
          const ha = (Math.abs(b.a) / max) * usableH;
          const hp = (Math.abs(b.p) / max) * usableH;
          const aY = mid - ha;
          const pY = mid - hp;
          const fill = b.forecast ? `url(#fx-${i})` : COLORS[b.tone];
          return (
            <React.Fragment key={i}>
              {b.p !== 0 && (
                <Rect x={x - bw - 1} y={pY} width={bw} height={hp} fill="#E2E8F0" rx={2} opacity={0.6} />
              )}
              <Rect x={x - 1} y={aY} width={bw} height={ha} fill={fill} rx={2} />
              <SvgText x={x - 1 + bw / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="#94A3B8">
                {b.w}
              </SvgText>
              <SvgText x={x - 1 + bw / 2} y={aY - 5} textAnchor="middle" fontSize={9} fill="#475569">
                {b.a}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

