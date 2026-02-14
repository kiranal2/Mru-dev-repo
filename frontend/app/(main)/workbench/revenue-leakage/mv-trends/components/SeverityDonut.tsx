"use client";

import { Card } from "@/components/ui/card";
import { useChartTooltip } from "../hooks/useMVTrends";
import { ChartTooltip } from "./ChartTooltip";

export function SeverityDonut({ data }: { data: { label: string; count: number; color: string }[] }) {
  const { tooltip, containerRef, showTooltip, hideTooltip } = useChartTooltip();
  const total = data.reduce((sum, item) => sum + item.count, 0) || 1;
  let angle = 0;
  const slices = data.map((d) => {
    const pct = d.count / total;
    const start = angle;
    angle += pct * 360;
    return { ...d, start, end: angle };
  });
  const describeArc = (cx: number, cy: number, r: number, startDeg: number, endDeg: number) => {
    const rad = (d: number) => (d - 90) * (Math.PI / 180);
    const s = { x: cx + r * Math.cos(rad(startDeg)), y: cy + r * Math.sin(rad(startDeg)) };
    const e = { x: cx + r * Math.cos(rad(endDeg)), y: cy + r * Math.sin(rad(endDeg)) };
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-slate-900">Severity Distribution</h3>
      <p className="text-xs text-slate-500 mb-3">Hotspot count by severity</p>
      <div ref={containerRef} className="relative flex items-center gap-4">
        <ChartTooltip tooltip={tooltip} />
        <div className="relative" style={{ width: 140, height: 140 }}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {slices.map((s) => (
              <path
                key={s.label}
                d={describeArc(50, 50, 38, s.start, Math.min(s.end, s.start + 359.9))}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeLinecap="butt"
                className="cursor-pointer"
                onMouseMove={(e) =>
                  showTooltip(
                    e,
                    <div>
                      <div className="font-semibold mb-0.5">{s.label}</div>
                      <div>{s.count} hotspots</div>
                      <div className="text-slate-300">
                        {Math.round((s.count / total) * 100)}% of total
                      </div>
                    </div>
                  )
                }
                onMouseLeave={hideTooltip}
              />
            ))}
            <text x="50" y="47" textAnchor="middle" fontSize="8" fill="#1e293b" fontWeight="700">
              {total}
            </text>
            <text x="50" y="56" textAnchor="middle" fontSize="4" fill="#64748b">
              Hotspots
            </text>
          </svg>
        </div>
        <div className="flex-1 space-y-1.5">
          {slices.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-xs">
              <span
                className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: s.color }}
              />
              <span className="text-slate-600 flex-1 truncate">{s.label}</span>
              <span className="font-medium text-slate-800">
                {s.count} ({Math.round((s.count / total) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
