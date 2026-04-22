import { useMemo } from 'react';

export interface BridgeDriver {
  /** Short label, e.g. "Enterprise" */
  label: string;
  /** Signed $ in millions, e.g. -2.1 or +0.5 */
  valueM: number;
}

/**
 * Compact SVG waterfall bridge:
 *
 *   [Plan $X.XM] ─ bar ─ bar ─ bar ─ bar ─ [Actual $Y.YM]
 *
 * Rendered with preserveAspectRatio so it scales with the card width.
 * Driver bars sit above or below the zero/base line depending on sign;
 * bar height is proportional to |valueM| relative to the largest driver.
 *
 * Click any bar to drill in (optional `onDrill`).
 */
export function VarianceBridge({
  planM,
  actualM,
  drivers,
  subtitle,
  onDrill,
}: {
  planM: number;
  actualM: number;
  drivers: BridgeDriver[];
  subtitle?: string;
  onDrill?: (label: string) => void;
}) {
  const totalVarM = actualM - planM;
  const totalVarStr = (totalVarM >= 0 ? '+' : '') + '$' + totalVarM.toFixed(1) + 'M';

  // Bar layout — 1 plan + N drivers + 1 actual, evenly spaced
  const { bars } = useMemo(() => {
    const maxAbs = Math.max(1, ...drivers.map(d => Math.abs(d.valueM)));
    const baseY = 50; // zero line (in a 0..104 viewBox)
    const maxBarH = 32;

    const bars = drivers.map(d => {
      const h = Math.max(6, (Math.abs(d.valueM) / maxAbs) * maxBarH);
      const y = d.valueM < 0 ? baseY : baseY - h;
      const tone = d.valueM < 0 ? 'neg' : 'pos';
      return { ...d, h, y, tone };
    });
    return { bars };
  }, [drivers]);

  // Positions — we'll place bars 80px wide, 32px gap
  const COL_W = 80;
  const COL_GAP = 32;
  const PLAN_W = 48;
  const PLAN_X = 18;
  const DRIVER_X0 = PLAN_X + PLAN_W + 20;

  const VIEW_W = DRIVER_X0 + drivers.length * (COL_W + COL_GAP) + PLAN_W + 20;

  const planH = 64;
  const planY = 18;
  const actualH = 56;
  const actualY = 26;
  const actualX = DRIVER_X0 + drivers.length * (COL_W + COL_GAP);

  return (
    <div className="bg-surface border border-rule rounded-xl shadow-e1 p-4 mb-3">
      <div className="flex justify-between items-start mb-1.5">
        <div>
          <div className="text-[13px] font-semibold text-ink tracking-tight">
            Variance bridge ·{' '}
            <span className="text-faint font-normal">where the</span>{' '}
            <span className={totalVarM < 0 ? 'text-negative' : 'text-positive'}>{totalVarStr}</span>{' '}
            <span className="text-faint font-normal">came from</span>
          </div>
          {subtitle && (
            <div className="text-[10.5px] text-muted mt-0.5">{subtitle}</div>
          )}
        </div>
        <div className="text-[10.5px] text-faint">Click any bar to drill →</div>
      </div>

      <svg viewBox={`0 0 ${VIEW_W} 108`} preserveAspectRatio="none" className="w-full h-[104px]">
        {/* baseline */}
        <line
          x1={PLAN_X + PLAN_W}
          y1={50}
          x2={actualX}
          y2={50}
          stroke="var(--rule)"
          strokeWidth={1}
        />

        {/* Plan pillar — uses surface-soft fill + rule stroke */}
        <rect
          x={PLAN_X}
          y={planY}
          width={PLAN_W}
          height={planH}
          rx={2}
          fill="var(--surface-soft)"
          stroke="var(--rule)"
        />
        <text
          x={PLAN_X + PLAN_W / 2}
          y={14}
          fontSize={9.5}
          fontWeight={600}
          fill="var(--ink)"
          textAnchor="middle"
        >
          ${planM.toFixed(1)}M
        </text>
        <text
          x={PLAN_X + PLAN_W / 2}
          y={100}
          fontSize={9}
          fill="var(--text-muted)"
          textAnchor="middle"
        >
          Plan
        </text>

        {/* Driver bars — flat fills from the design tokens (no gradients).
            Value label ALWAYS sits just above the bar — for negatives that's
            just above the zero line, for positives just above the bar top.
            This keeps the category label band (y=100) free so values never
            collide with "Enterprise", "Mid-Market" etc. */}
        {bars.map((b, i) => {
          const x = DRIVER_X0 + i * (COL_W + COL_GAP);
          const valueY = b.valueM < 0 ? 46 : b.y - 4;
          const fill = b.tone === 'neg' ? 'var(--negative)' : 'var(--positive)';
          return (
            <g
              key={b.label}
              style={{ cursor: onDrill ? 'pointer' : 'default' }}
              onClick={() => onDrill?.(b.label)}
            >
              <rect x={x} y={b.y} width={COL_W} height={b.h} rx={2} fill={fill} />
              <text
                x={x + COL_W / 2}
                y={valueY}
                fontSize={9.5}
                fontWeight={700}
                fill={fill}
                textAnchor="middle"
              >
                {(b.valueM >= 0 ? '+' : '') + '$' + Math.abs(b.valueM).toFixed(1) + 'M'}
              </text>
              <text
                x={x + COL_W / 2}
                y={100}
                fontSize={9}
                fill="var(--text-muted)"
                textAnchor="middle"
              >
                {b.label}
              </text>
            </g>
          );
        })}

        {/* Actual pillar — uses ink token so it tracks dark-mode */}
        <rect
          x={actualX}
          y={actualY}
          width={PLAN_W}
          height={actualH}
          rx={2}
          fill="var(--ink)"
        />
        <text
          x={actualX + PLAN_W / 2}
          y={14}
          fontSize={9.5}
          fontWeight={600}
          fill="var(--ink)"
          textAnchor="middle"
        >
          ${actualM.toFixed(1)}M
        </text>
        <text
          x={actualX + PLAN_W / 2}
          y={100}
          fontSize={9}
          fill="var(--text-muted)"
          textAnchor="middle"
        >
          Actual
        </text>
      </svg>
    </div>
  );
}
