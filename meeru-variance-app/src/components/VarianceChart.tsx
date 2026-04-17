import type { ChartBar } from '../types';
import { Card } from './ui';

interface Props {
  title: string;
  bars: ChartBar[];
  valueSuffix?: string;
}

export function VarianceChart({ title, bars, valueSuffix = '' }: Props) {
  const W = 720, H = 170, pad = 32;
  const max = Math.max(...bars.map(b => Math.abs(b.a)), ...bars.map(b => Math.abs(b.p)));
  const hasNeg = bars.some(b => b.a < 0);
  const mid = hasNeg ? H / 2 : H - pad;
  const usableH = hasNeg ? (H / 2 - 20) : (H - pad - 20);
  const slot = (W - pad * 2) / bars.length;
  const bw = Math.min(26, slot * 0.38);

  const colorFor = (tone: ChartBar['tone']) =>
    tone === 'neg' ? 'var(--negative)' : tone === 'pos' ? 'var(--positive)' : tone === 'warn' ? 'var(--warning)' : 'var(--primary)';

  return (
    <Card className="p-3.5 mb-3">
      <div className="flex justify-between items-baseline mb-2">
        <div className="text-[13px] font-semibold text-ink">{title}</div>
        <div className="flex gap-3 text-[10px] text-muted">
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-brand" />Actual</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{ background: 'var(--rule)' }} />Plan</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm" style={{ backgroundImage: 'repeating-linear-gradient(45deg,var(--primary),var(--primary) 2px,transparent 2px,transparent 4px)' }} />Forecast</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[820px] h-[180px]">
        <defs>
          {bars.map((b, i) => b.forecast ? (
            <pattern key={i} id={`fx-${i}`} width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="4" fill={colorFor(b.tone)} opacity="0.35" />
              <path d="M0,4 L4,0" stroke={colorFor(b.tone)} strokeWidth="1" />
            </pattern>
          ) : null)}
        </defs>
        <line x1={pad} y1={mid} x2={W - pad} y2={mid} stroke="var(--rule)" strokeWidth="1" />
        {bars.map((b, i) => {
          const x = pad + slot * i + slot / 2;
          const ha = (Math.abs(b.a) / max) * usableH;
          const hp = (Math.abs(b.p) / max) * usableH;
          const aY = b.a >= 0 ? mid - ha : mid;
          const pY = b.p >= 0 ? mid - hp : mid;
          const fill = b.forecast ? `url(#fx-${i})` : colorFor(b.tone);
          const labelY = b.a >= 0 ? aY - 5 : aY + ha + 12;
          return (
            <g key={i}>
              {b.p !== 0 && <rect x={x - bw - 1} y={pY} width={bw} height={hp} fill="var(--rule)" rx={2} opacity={0.6} />}
              <rect x={x - 1} y={aY} width={bw} height={ha} fill={fill} rx={2} />
              <text x={x - 1 + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--text-faint)">{b.w}</text>
              <text x={x - 1 + bw / 2} y={labelY} textAnchor="middle" fontSize="9" fill="var(--text-muted)">{b.a}{valueSuffix}</text>
            </g>
          );
        })}
      </svg>
    </Card>
  );
}
