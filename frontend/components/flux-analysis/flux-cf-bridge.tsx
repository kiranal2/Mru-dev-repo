"use client";

import { useCallback, useEffect, useRef } from "react";
import type { CfRow } from "@/lib/data/types/flux-analysis";
import { fmtMoney, signedMoney, drawRoundedRect } from "@/app/(main)/reports/analysis/flux-analysis/helpers";
import { cn } from "@/lib/utils";

interface FluxCfBridgeProps {
  cfData: CfRow[];
  cfTotal: number;
}

export function FluxCfBridge({ cfData, cfTotal }: FluxCfBridgeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawCFBridge = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const steps = cfData;
    const pad = 20;
    const barW = ((rect.width - pad * 2) / steps.length) * 0.7;
    const gap = (rect.width - pad * 2) / steps.length - barW;

    let min = 0;
    let max = 0;
    let cumulative = 0;

    steps.forEach((step) => {
      cumulative += step.val;
      min = Math.min(min, cumulative, step.val < 0 ? cumulative - step.val : cumulative);
      max = Math.max(max, cumulative);
    });

    const range = max - min || 1;
    const y = (value: number) => rect.height - 40 - ((value - min) / range) * (rect.height - 80);

    for (let i = 0; i < 4; i += 1) {
      const gy = 20 + ((rect.height - 80) / 3) * i;
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(16, gy);
      ctx.lineTo(rect.width - 16, gy);
      ctx.stroke();
    }

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, y(0));
    ctx.lineTo(rect.width - 16, y(0));
    ctx.stroke();

    cumulative = 0;
    let x = pad;
    const formatBridgeValue = (value: number) =>
      `${value >= 0 ? "+" : ""}$${Math.abs(value).toFixed(1)}M`;

    steps.forEach((step, idx) => {
      const from = cumulative;
      const to = cumulative + step.val;
      const top = Math.min(y(from), y(to));
      const height = Math.abs(y(from) - y(to));

      ctx.fillStyle = step.val >= 0 ? "#0f766e" : "#dc2626";
      drawRoundedRect(ctx, x, top, barW, height, 6);
      ctx.fill();

      const valueLabelY = step.val >= 0 ? top - 8 : top + height + 16;
      ctx.fillStyle = "#334155";
      ctx.font = "600 11px ui-sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(formatBridgeValue(step.val), x + barW / 2, valueLabelY);

      ctx.fillStyle = "#475569";
      ctx.font = "11px ui-sans-serif";
      ctx.fillText(step.label, x + barW / 2, rect.height - 16);

      if (idx < steps.length - 1) {
        const nextX = x + barW + gap;
        const connectorY = y(to);
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(x + barW + 2, connectorY);
        ctx.lineTo(nextX - 2, connectorY);
        ctx.stroke();
        ctx.restore();
      }

      cumulative = to;
      x += barW + gap;
    });
  }, [cfData]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => drawCFBridge());
    });
    return () => cancelAnimationFrame(raf);
  }, [drawCFBridge]);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Waterfall chart</span>
        <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          Operating CF: {signedMoney(cfTotal)}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="h-[280px] w-full rounded-lg border border-dashed border-slate-300 bg-gradient-to-b from-white to-slate-50"
      />
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Component</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Impact</th>
              <th className="px-3 py-2 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wide">Narrative</th>
            </tr>
          </thead>
          <tbody>
            {cfData.map((row) => (
              <tr key={row.label} className="border-b border-slate-100">
                <td className="px-3 py-2 text-xs text-slate-700">{row.label}</td>
                <td className={cn("px-3 py-2 text-xs font-semibold", row.val >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {row.val >= 0 ? "+" : ""}{fmtMoney(row.val)}
                </td>
                <td className="px-3 py-2 text-xs text-slate-600">
                  {row.val >= 0 ? "Positive contribution" : "Cash drag"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
