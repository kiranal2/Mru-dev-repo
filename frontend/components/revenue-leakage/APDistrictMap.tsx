"use client";

import { useState } from "react";

export interface DistrictData {
  name: string;
  avgDrr: number;
  hotspotCount: number;
  sroCount: number;
  transactionCount: number;
  estimatedLoss: number;
}

interface APDistrictMapProps {
  districts: DistrictData[];
  onDistrictClick: (districtName: string) => void;
  formatShort: (value: number) => string;
}

const districtPositions: Record<string, { x: number; y: number; w: number; h: number }> = {
  Srikakulam: { x: 310, y: 10, w: 140, h: 70 },
  Vizianagaram: { x: 270, y: 95, w: 140, h: 70 },
  Visakhapatnam: { x: 230, y: 180, w: 150, h: 70 },
  "East Godavari": { x: 210, y: 265, w: 150, h: 70 },
  "West Godavari": { x: 170, y: 350, w: 150, h: 70 },
  Krishna: { x: 200, y: 435, w: 140, h: 70 },
  Guntur: { x: 180, y: 520, w: 140, h: 70 },
  Prakasam: { x: 170, y: 605, w: 140, h: 70 },
  Nellore: { x: 180, y: 690, w: 140, h: 70 },
  Kurnool: { x: 30, y: 350, w: 130, h: 70 },
  Anantapur: { x: 20, y: 435, w: 140, h: 70 },
  "YSR Kadapa": { x: 40, y: 520, w: 140, h: 70 },
  Chittoor: { x: 60, y: 690, w: 130, h: 70 },
};

const colorFromDrr = (drr: number) => {
  if (drr < 0.7) return { fill: "#fef2f2", border: "#dc2626", text: "#991b1b", badge: "#dc2626" };
  if (drr < 0.85) return { fill: "#fff7ed", border: "#f97316", text: "#9a3412", badge: "#f97316" };
  if (drr < 1.0) return { fill: "#fffbeb", border: "#f59e0b", text: "#92400e", badge: "#f59e0b" };
  return { fill: "#f0fdf4", border: "#22c55e", text: "#166534", badge: "#22c55e" };
};

const severityLabel = (drr: number) => {
  if (drr < 0.5) return "Critical";
  if (drr < 0.7) return "High";
  if (drr < 0.85) return "Medium";
  if (drr < 0.95) return "Watch";
  return "Normal";
};

export function APDistrictMap({ districts, onDistrictClick, formatShort }: APDistrictMapProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const districtMap = new Map(districts.map((d) => [d.name, d]));
  const hoveredData = hoveredDistrict ? districtMap.get(hoveredDistrict) : null;

  return (
    <div className="relative">
      <svg viewBox="0 0 470 780" className="w-full" style={{ maxHeight: "680px" }}>
        {/* AP state outline - simplified path */}
        <path
          d="M 460,30 C 440,20 420,15 400,10 L 310,5 C 280,8 250,30 230,60
             C 210,90 190,130 180,170 C 170,210 165,240 160,260
             C 155,280 150,310 140,340 C 130,370 120,390 110,410
             C 100,430 80,460 60,480 C 40,500 20,520 15,550
             C 10,580 15,610 20,640 C 30,670 50,700 60,720
             C 70,740 90,755 110,760 C 130,765 160,760 190,750
             C 220,740 240,720 250,700 C 260,680 270,650 280,630
             C 290,610 300,580 310,560 C 320,540 330,510 340,490
             C 350,470 360,440 370,420 C 380,400 390,370 395,340
             C 400,310 410,280 420,250 C 430,220 440,190 450,160
             C 460,130 465,100 465,70 Z"
          fill="#f1f5f9"
          stroke="#cbd5e1"
          strokeWidth="1.5"
          opacity="0.5"
        />

        {/* District tiles */}
        {Object.entries(districtPositions).map(([name, pos]) => {
          const data = districtMap.get(name);
          if (!data) return null;
          const colors = colorFromDrr(data.avgDrr);
          const isHovered = hoveredDistrict === name;
          const severity = severityLabel(data.avgDrr);

          return (
            <g
              key={name}
              className="cursor-pointer"
              onClick={() => onDistrictClick(name)}
              onMouseEnter={(e) => {
                setHoveredDistrict(name);
                const svgEl = e.currentTarget.closest("svg");
                if (svgEl) {
                  const rect = svgEl.getBoundingClientRect();
                  const svgW = rect.width;
                  const svgH = rect.height;
                  setTooltipPos({
                    x: ((pos.x + pos.w / 2) / 470) * svgW,
                    y: (pos.y / 780) * svgH,
                  });
                }
              }}
              onMouseLeave={() => setHoveredDistrict(null)}
            >
              <rect
                x={pos.x}
                y={pos.y}
                width={pos.w}
                height={pos.h}
                rx={8}
                fill={colors.fill}
                stroke={colors.border}
                strokeWidth={isHovered ? 2.5 : 1.5}
                filter={isHovered ? "url(#shadow)" : undefined}
              />
              {/* Left accent bar */}
              <rect x={pos.x} y={pos.y} width={5} height={pos.h} rx={3} fill={colors.badge} />
              {/* District name */}
              <text x={pos.x + 12} y={pos.y + 18} fontSize="11" fontWeight="700" fill={colors.text}>
                {name}
              </text>
              {/* DRR value */}
              <text x={pos.x + 12} y={pos.y + 34} fontSize="10" fill={colors.text} opacity="0.8">
                DRR {data.avgDrr.toFixed(2)}
              </text>
              {/* DRR gauge bar */}
              <rect
                x={pos.x + 12}
                y={pos.y + 40}
                width={pos.w - 24}
                height={4}
                rx={2}
                fill="#e2e8f0"
              />
              <rect
                x={pos.x + 12}
                y={pos.y + 40}
                width={Math.min(data.avgDrr, 1.0) * (pos.w - 24)}
                height={4}
                rx={2}
                fill={colors.badge}
              />
              {/* Metrics row */}
              <text x={pos.x + 12} y={pos.y + 58} fontSize="9" fill="#64748b">
                {data.hotspotCount} hotspots
              </text>
              <text
                x={pos.x + pos.w - 12}
                y={pos.y + 58}
                fontSize="9"
                fill="#64748b"
                textAnchor="end"
              >
                {formatShort(data.estimatedLoss)}
              </text>
              {/* Severity badge */}
              {(severity === "Critical" || severity === "High") && (
                <>
                  <rect
                    x={pos.x + pos.w - 50}
                    y={pos.y + 6}
                    width={42}
                    height={16}
                    rx={4}
                    fill={colors.badge}
                  />
                  <text
                    x={pos.x + pos.w - 29}
                    y={pos.y + 17}
                    fontSize="8"
                    fontWeight="700"
                    fill="white"
                    textAnchor="middle"
                  >
                    {severity}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Shadow filter for hover */}
        <defs>
          <filter id="shadow" x="-4%" y="-4%" width="108%" height="108%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.15" />
          </filter>
        </defs>
      </svg>

      {/* Tooltip */}
      {hoveredData && hoveredDistrict && (
        <div
          className="absolute z-50 bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 pointer-events-none"
          style={{
            left: tooltipPos.x,
            top: tooltipPos.y - 10,
            transform: "translate(-50%, -100%)",
            minWidth: 200,
          }}
        >
          <p className="text-sm font-bold text-slate-900">{hoveredDistrict}</p>
          <div className="mt-1.5 space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Avg DRR</span>
              <span className="font-semibold">{hoveredData.avgDrr.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Hotspots</span>
              <span className="font-semibold">{hoveredData.hotspotCount}</span>
            </div>
            <div className="flex justify-between">
              <span>SROs</span>
              <span className="font-semibold">{hoveredData.sroCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Transactions</span>
              <span className="font-semibold">
                {hoveredData.transactionCount.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Est. Loss</span>
              <span className="font-semibold text-red-600">
                {formatShort(hoveredData.estimatedLoss)}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Click to view SROs</p>
        </div>
      )}
    </div>
  );
}
