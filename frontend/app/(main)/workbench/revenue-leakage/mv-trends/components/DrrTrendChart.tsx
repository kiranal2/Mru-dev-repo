"use client";

import { Card } from "@/components/ui/card";
import { useChartTooltip } from "../hooks/useMVTrends";
import { ChartTooltip } from "./ChartTooltip";
import { formatShort } from "../constants";

export function DrrTrendChart({
  data,
}: {
  data: { quarter: string; avg_drr: number; hotspot_count: number; loss: number }[];
}) {
  const { tooltip, containerRef, showTooltip, hideTooltip } = useChartTooltip();
  const threshold = 0.85;
  const yMin = 0.7;
  const yMax = 1.05;
  const yRange = yMax - yMin;
  const left = 14;
  const right = 96;
  const top = 6;
  const bottom = 52;
  const chartW = right - left;
  const chartH = bottom - top;
  const yTicks = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0];
  const toY = (drr: number) => bottom - ((drr - yMin) / yRange) * chartH;
  const toX = (i: number) => left + (i / Math.max(data.length - 1, 1)) * chartW;
  const threshY = toY(threshold);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">DRR Trend Over Time</h3>
          <p className="text-xs text-slate-500">Average DRR per quarter</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-600">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-red-600 rounded" /> Avg DRR
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 border-t border-dashed border-slate-400" />{" "}
            Threshold (0.85)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 bg-green-50 border border-green-200 rounded-sm" />{" "}
            Above
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 bg-red-50 border border-red-200 rounded-sm" />{" "}
            Below
          </span>
        </div>
      </div>
      <div ref={containerRef} className="relative" style={{ height: 220 }}>
        <ChartTooltip tooltip={tooltip} />
        <svg viewBox="0 0 100 62" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Background zones */}
          <rect x={left} y={top} width={chartW} height={threshY - top} fill="#dcfce7" opacity="0.30" />
          <rect x={left} y={threshY} width={chartW} height={bottom - threshY} fill="#fee2e2" opacity="0.30" />

          {/* Y-axis gridlines and labels */}
          {yTicks.map((tick) => {
            const y = toY(tick);
            return (
              <g key={tick}>
                <line
                  x1={left}
                  y1={y}
                  x2={right}
                  y2={y}
                  stroke={tick === threshold ? "#94a3b8" : "#e2e8f0"}
                  strokeWidth={tick === threshold ? 0.5 : 0.3}
                  strokeDasharray={tick === threshold ? "2 1.5" : "none"}
                />
                <text
                  x={left - 1.5}
                  y={y + 1}
                  textAnchor="end"
                  fontSize="3"
                  fill={tick === threshold ? "#64748b" : "#94a3b8"}
                  fontWeight={tick === threshold ? 600 : 400}
                >
                  {tick.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Threshold label */}
          <text x={right + 0.5} y={threshY + 1} fontSize="2.8" fill="#64748b" fontWeight={600}>
            Threshold
          </text>

          {/* Data line */}
          <polyline
            points={data.map((d, i) => `${toX(i)},${toY(d.avg_drr)}`).join(" ")}
            fill="none"
            stroke="#dc2626"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />

          {/* Data points with DRR value labels */}
          {data.map((d, i) => {
            const x = toX(i);
            const y = toY(d.avg_drr);
            return (
              <g key={d.quarter}>
                <circle cx={x} cy={y} r={1.6} fill="#dc2626" stroke="#fff" strokeWidth="0.5" />
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseMove={(e) =>
                    showTooltip(
                      e,
                      <div>
                        <div className="font-semibold mb-0.5">{d.quarter}</div>
                        <div>Avg DRR: {d.avg_drr.toFixed(2)}</div>
                        <div className="text-slate-300">Hotspots: {d.hotspot_count}</div>
                        <div className="text-slate-300">Est. Loss: {formatShort(d.loss)}</div>
                      </div>
                    )
                  }
                  onMouseLeave={hideTooltip}
                />
                <text x={x} y={y - 2.5} textAnchor="middle" fontSize="2.8" fill="#dc2626" fontWeight={600}>
                  {d.avg_drr.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {data.map((d, i) => (
            <text key={d.quarter} x={toX(i)} y={bottom + 4} textAnchor="middle" fontSize="2.8" fill="#64748b">
              {d.quarter}
            </text>
          ))}

          {/* Axes */}
          <line x1={left} y1={top} x2={left} y2={bottom} stroke="#cbd5e1" strokeWidth="0.3" />
          <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="#cbd5e1" strokeWidth="0.3" />
        </svg>
      </div>
    </Card>
  );
}
