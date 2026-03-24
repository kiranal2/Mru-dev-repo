"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface FluxSensitivityPanelProps {
  priceSlider: number[];
  onPriceChange: (value: number[]) => void;
  volumeSlider: number[];
  onVolumeChange: (value: number[]) => void;
  fxSlider: number[];
  onFxChange: (value: number[]) => void;
  projectedDelta: number;
}

export function FluxSensitivityPanel({
  priceSlider,
  onPriceChange,
  volumeSlider,
  onVolumeChange,
  fxSlider,
  onFxChange,
  projectedDelta,
}: FluxSensitivityPanelProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-slate-900">Sensitivity Analysis</h3>
      </div>
      <div className="space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="text-xs text-slate-600">Price</Label>
            <span className="text-xs font-semibold text-slate-700">{priceSlider[0] >= 0 ? "+" : ""}{priceSlider[0].toFixed(1)}%</span>
          </div>
          <Slider value={priceSlider} onValueChange={onPriceChange} min={-5} max={5} step={0.5} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="text-xs text-slate-600">Volume</Label>
            <span className="text-xs font-semibold text-slate-700">{volumeSlider[0] >= 0 ? "+" : ""}{volumeSlider[0]}%</span>
          </div>
          <Slider value={volumeSlider} onValueChange={onVolumeChange} min={-10} max={10} step={1} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label className="text-xs text-slate-600">FX</Label>
            <span className="text-xs font-semibold text-slate-700">{fxSlider[0] >= 0 ? "+" : ""}{fxSlider[0].toFixed(1)}%</span>
          </div>
          <Slider value={fxSlider} onValueChange={onFxChange} min={-3} max={3} step={0.5} />
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="text-xs text-slate-600">Projected &Delta; Revenue</span>
          <span className={cn("text-sm font-bold", projectedDelta >= 0 ? "text-emerald-600" : "text-red-600")}>
            {projectedDelta >= 0 ? "+" : ""}${projectedDelta.toFixed(1)}M
          </span>
        </div>
      </div>
    </div>
  );
}
