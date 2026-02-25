"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { ZoomIn, ZoomOut, X } from "lucide-react";

const DistrictDetailLeafletMap = dynamic(
  () =>
    import("@/components/revenue-leakage/DistrictDetailLeafletMap").then(
      (m) => m.DistrictDetailLeafletMap
    ),
  { ssr: false }
);

export interface DistrictMapData {
  name: string;
  avgDrr?: number;
  hotspotCount?: number;
  sroCount?: number;
  transactionCount?: number;
  estimatedLoss?: number;
  cases?: number;
  totalGap?: number;
  /** MV contribution percent — how much of district growth was MV-driven */
  mvChangePercent?: number;
}

/** Per-location item for the district detail drill-down */
export interface DistrictAreaItem {
  sroCode: string;
  sroName: string;
  locationLabel: string;
  locationType: string;
  drr: number;
  severity: string;
  transactionCount: number;
  estimatedLoss: number;
  status: string;
}

/** Recursive hierarchy node for MV growth drill-down (district → SRO → mandal → village) */
export interface MVHierarchyItem {
  code: string;
  name: string;
  revenue: number;
  mvDriven: number;
  volumeDriven: number;
  docCount: number;
  children?: MVHierarchyItem[];
}

/** MV revision info for a district */
export interface MVRevisionEntry {
  avgMVIncrease: number;
  date: string;
  revenueImpact: number;
  documentImpact: number;
}

interface AndhraPradeshChoroplethMapProps {
  districtData?: DistrictMapData[];
  formatShort?: (value: number) => string;
  geojsonUrl?: string;
  baseFill?: string;
  hoverFill?: string;
  strokeColor?: string;
  className?: string;
  /** Callback fired when a district polygon is clicked. Receives the data-layer name (alias-resolved). */
  onDistrictClick?: (districtName: string) => void;
  /** Externally-controlled active district — highlighted with a ring on the map. Use data-layer names. */
  activeDistrict?: string | null;
  /** Per-district area detail items, keyed by district data-layer name. Shown in the drill-down panel. */
  areaDetails?: Record<string, DistrictAreaItem[]>;
  /** MV hierarchy data for drill-down in mvChange mode. Keyed by district data-layer name. */
  mvHierarchy?: Record<string, MVHierarchyItem>;
  /** MV revision info per district. Keyed by district data-layer name. */
  mvRevisionInfo?: Record<string, MVRevisionEntry>;
}

export type HeatmapMode = "drr" | "loss" | "mvChange";

const DEFAULT_FILL = "#cbd5e1";
const HOVER_FILL = "#94a3b8";
const STROKE = "#475569";
const CHOROPLETH_LOW = "#dcfce7";
const CHOROPLETH_MID = "#fef9c3";
const CHOROPLETH_HIGH = "#fee2e2";

// Loss-mode color stops (low → high)
const LOSS_NONE = "#f0fdf4";    // green-50
const LOSS_LOW = "#bbf7d0";     // green-200
const LOSS_MED = "#fde68a";     // amber-200
const LOSS_HIGH = "#fdba74";    // orange-300
const LOSS_CRITICAL = "#fca5a5"; // red-300

// MV Change mode color stops (low → high growth, blue scale)
const MV_NONE = "#f0f9ff";     // sky-50
const MV_LOW = "#bae6fd";      // sky-200
const MV_MED = "#7dd3fc";      // sky-300
const MV_HIGH = "#38bdf8";     // sky-400
const MV_CRITICAL = "#0284c7"; // sky-600

const MAP_WIDTH = 800;
const MAP_HEIGHT = 520;

const DISTRICT_PASTELS = [
  "#dbeafe",
  "#fce7f3",
  "#d1fae5",
  "#fef3c7",
  "#e0e7ff",
  "#fecdd3",
  "#ccfbf1",
  "#fde68a",
  "#e9d5ff",
  "#fed7aa",
  "#bfdbfe",
  "#fbcfe8",
  "#a7f3d0",
];

function getFillForDrr(drr: number | undefined): string {
  if (drr == null) return DEFAULT_FILL;
  if (drr < 0.7) return CHOROPLETH_HIGH;
  if (drr < 0.9) return CHOROPLETH_MID;
  return CHOROPLETH_LOW;
}

function getFillForLoss(loss: number | undefined, maxLoss: number): string {
  if (loss == null || maxLoss <= 0) return DEFAULT_FILL;
  const ratio = loss / maxLoss;
  if (ratio < 0.1) return LOSS_NONE;
  if (ratio < 0.3) return LOSS_LOW;
  if (ratio < 0.55) return LOSS_MED;
  if (ratio < 0.8) return LOSS_HIGH;
  return LOSS_CRITICAL;
}

function getFillForMvChange(pct: number | undefined): string {
  if (pct == null) return DEFAULT_FILL;
  if (pct < 55) return MV_NONE;
  if (pct < 59) return MV_LOW;
  if (pct < 62) return MV_MED;
  if (pct < 64) return MV_HIGH;
  return MV_CRITICAL;
}

function getDistrictName(properties: Record<string, unknown> | undefined): string {
  if (!properties) return "";
  const name = (properties.district_name ?? properties.NEW_DIST ?? "") as string;
  return String(name).trim();
}

const REAL_GEOJSON_URL =
  "https://raw.githubusercontent.com/satishvmadala/andhrapradesh_opendata_locations/main/AndhraPradesh_Districts.geojson";

// Maps GeoJSON official names → common/legacy names used in data
const DISTRICT_NAME_ALIASES: Record<string, string> = {
  "Ananthapuramu": "Anantapur",
  "Sri Potti Sriramulu Nellore": "Nellore",
};

type GeoFeature = GeoJSON.Feature<GeoJSON.Geometry, Record<string, unknown>>;
type GeoCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>>;

// Builds a reverse alias map: data name → GeoJSON name(s)
const REVERSE_ALIASES: Record<string, string[]> = {};
for (const [geoName, dataName] of Object.entries(DISTRICT_NAME_ALIASES)) {
  if (!REVERSE_ALIASES[dataName]) REVERSE_ALIASES[dataName] = [];
  REVERSE_ALIASES[dataName].push(geoName);
}

/** Resolve a data-layer district name to the set of GeoJSON names it could match */
function resolveToGeoNames(dataName: string): string[] {
  return [dataName, ...(REVERSE_ALIASES[dataName] ?? [])];
}

/** Resolve a GeoJSON name to its data-layer alias (or itself) */
function resolveToDataName(geoName: string): string {
  return DISTRICT_NAME_ALIASES[geoName] ?? geoName;
}

export function AndhraPradeshChoroplethMap({
  districtData = [],
  formatShort = (v) => `₹${(v / 1e5).toFixed(1)}L`,
  geojsonUrl = REAL_GEOJSON_URL,
  baseFill = DEFAULT_FILL,
  hoverFill = HOVER_FILL,
  strokeColor = STROKE,
  className = "",
  onDistrictClick,
  activeDistrict,
  areaDetails,
  mvHierarchy,
  mvRevisionInfo,
}: AndhraPradeshChoroplethMapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const zoomGroupRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [geoData, setGeoData] = useState<GeoCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    data?: DistrictMapData;
  } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>("drr");

  // Max loss across all districts — used for loss-mode color scaling
  const maxLoss = useMemo(
    () => Math.max(...districtData.map((d) => d.estimatedLoss ?? 0), 1),
    [districtData]
  );

  // GeoJSON names that should show the active highlight ring
  const activeGeoNames = useMemo(() => {
    if (!activeDistrict) return new Set<string>();
    return new Set(resolveToGeoNames(activeDistrict));
  }, [activeDistrict]);

  const districtMap = useRef(new Map<string, DistrictMapData>());
  districtMap.current = useMemo(() => {
    const m = new Map(districtData.map((d) => [d.name, d]));
    // Add reverse aliases so GeoJSON official names resolve to data entries
    for (const [geoName, dataName] of Object.entries(DISTRICT_NAME_ALIASES)) {
      const data = m.get(dataName);
      if (data && !m.has(geoName)) m.set(geoName, data);
    }
    return m;
  }, [districtData]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(geojsonUrl)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load map"))))
      .then((data: GeoCollection) => {
        setGeoData(data);
      })
      .catch((e) => setError(e?.message ?? "Failed to load map"))
      .finally(() => setLoading(false));
  }, [geojsonUrl]);

  const pathEntries = useMemo(() => {
    if (!geoData?.features?.length) return [];
    const collection = geoData as GeoCollection;
    const projection = d3.geoMercator().fitSize([MAP_WIDTH, MAP_HEIGHT], collection);
    const pathGen = d3.geoPath().projection(projection);
    const entries: { id: string; name: string; pathD: string; centroid: [number, number] }[] = [];
    geoData.features.forEach((f, i) => {
      const name = getDistrictName((f as GeoFeature).properties);
      const displayName = name || `District ${i + 1}`;
      const pathD = pathGen(f as GeoFeature);
      const centroid = pathGen.centroid(f as GeoFeature);
      if (pathD && centroid && isFinite(centroid[0]) && isFinite(centroid[1])) {
        const id = `${displayName}-${i}`;
        entries.push({ id, name: displayName, pathD, centroid });
      }
    });
    return entries;
  }, [geoData]);

  // Compute a single centroid per district (average if multi-polygon)
  const districtCentroids = useMemo(() => {
    const acc: Record<string, { sx: number; sy: number; n: number }> = {};
    for (const { name, centroid } of pathEntries) {
      if (!acc[name]) acc[name] = { sx: 0, sy: 0, n: 0 };
      acc[name].sx += centroid[0];
      acc[name].sy += centroid[1];
      acc[name].n += 1;
    }
    const result: Record<string, [number, number]> = {};
    for (const [name, { sx, sy, n }] of Object.entries(acc)) {
      result[name] = [sx / n, sy / n];
    }
    return result;
  }, [pathEntries]);

  // Top 3 districts — lowest DRR (drr), highest loss (loss), or highest MV contribution (mvChange)
  const top3Worst = useMemo(() => {
    const items = Object.keys(districtCentroids)
      .map((name) => ({ name, data: districtMap.current.get(name) }))
      .filter((d): d is { name: string; data: DistrictMapData } => d.data != null);
    if (heatmapMode === "loss") {
      items.sort((a, b) => (b.data.estimatedLoss ?? 0) - (a.data.estimatedLoss ?? 0));
    } else if (heatmapMode === "mvChange") {
      items.sort((a, b) => (b.data.mvChangePercent ?? 0) - (a.data.mvChangePercent ?? 0));
    } else {
      items.sort((a, b) => (a.data.avgDrr ?? 1) - (b.data.avgDrr ?? 1));
    }
    return new Set(items.slice(0, 3).map((d) => d.name));
  }, [districtCentroids, districtData, heatmapMode]);

  const districtToColor = useMemo(() => {
    const names = Array.from(new Set(pathEntries.map((e) => e.name)));
    const m = new Map<string, string>();
    names.forEach((name, i) => {
      m.set(name, DISTRICT_PASTELS[i % DISTRICT_PASTELS.length]);
    });
    return m;
  }, [pathEntries]);

  const detailDistrictGeoJson = useMemo((): GeoCollection | null => {
    if (!selectedDistrict || !geoData?.features?.length) return null;
    const districtFeatures = geoData.features.filter(
      (f) => getDistrictName((f as GeoFeature).properties) === selectedDistrict
    );
    if (!districtFeatures.length) return null;
    return { type: "FeatureCollection", features: districtFeatures };
  }, [selectedDistrict, geoData]);

  useEffect(() => {
    const g = zoomGroupRef.current;
    const svg = g?.closest("svg");
    if (!g || !svg) return;

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 6])
      .on("zoom", (event) => {
        d3.select(g).attr("transform", event.transform);
      });

    zoomRef.current = zoom;
    d3.select(svg).call(zoom);
    return () => {
      d3.select(svg).on(".zoom", null);
      zoomRef.current = null;
    };
  }, [pathEntries.length]);

  const handleZoomIn = useCallback(() => {
    const svg = zoomGroupRef.current?.closest("svg");
    if (!svg || !zoomRef.current) return;
    d3.select(svg).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
  }, []);

  const handleZoomOut = useCallback(() => {
    const svg = zoomGroupRef.current?.closest("svg");
    if (!svg || !zoomRef.current) return;
    d3.select(svg).transition().duration(300).call(zoomRef.current.scaleBy, 0.77);
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent, name: string) => {
    setHoveredDistrict(name);
    const rect = wrapperRef.current?.getBoundingClientRect();
    setTooltip({
      x: rect ? e.clientX - rect.left : e.clientX,
      y: rect ? e.clientY - rect.top : e.clientY,
      name,
      data: districtMap.current.get(name),
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltip((t) => {
      if (!t || !wrapperRef.current) return t;
      const rect = wrapperRef.current.getBoundingClientRect();
      return { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top };
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredDistrict(null);
    setTooltip(null);
  }, []);

  const selectedData = selectedDistrict ? districtMap.current.get(selectedDistrict) : undefined;

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 ${className}`}
        style={{ minHeight: 420 }}
      >
        <p className="text-sm text-slate-500">Loading Andhra Pradesh map…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="block w-full touch-none"
          style={{ minHeight: 420, maxHeight: 560 }}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <filter id="ap-drop-shadow" x="-6%" y="-6%" width="112%" height="112%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.15" />
            </filter>
            <filter id="ap-active-glow" x="-8%" y="-8%" width="116%" height="116%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#1e40af" floodOpacity="0.5" />
            </filter>
          </defs>
          <g ref={zoomGroupRef}>
            {/* District polygons */}
            {pathEntries.map(({ id, name, pathD }) => {
              const data = districtMap.current.get(name);
              const isActive = activeGeoNames.has(name);
              const isHovered = hoveredDistrict === name;
              const dataFill = data != null
                ? heatmapMode === "loss"
                  ? getFillForLoss(data.estimatedLoss, maxLoss)
                  : heatmapMode === "mvChange"
                    ? getFillForMvChange(data.mvChangePercent)
                    : getFillForDrr(data.avgDrr)
                : (districtToColor.get(name) ?? baseFill);
              const fillColor = isHovered ? hoverFill : dataFill;
              return (
                <path
                  key={id}
                  d={pathD}
                  fill={fillColor}
                  stroke={isActive ? "#1e40af" : strokeColor}
                  strokeWidth={isActive ? 3 : isHovered ? 2 : 0.8}
                  filter={isActive ? "url(#ap-active-glow)" : isHovered ? "url(#ap-drop-shadow)" : undefined}
                  style={{ cursor: "pointer", transition: "fill 0.15s ease, stroke 0.15s ease, stroke-width 0.15s ease" }}
                  onMouseEnter={(e) => handleMouseEnter(e, name)}
                  onClick={() => {
                    setSelectedDistrict(name);
                    onDistrictClick?.(resolveToDataName(name));
                  }}
                />
              );
            })}

            {/* District name labels */}
            {Object.entries(districtCentroids).map(([name, [cx, cy]]) => {
              const isTop3 = top3Worst.has(name);
              const labelY = isTop3 ? cy - 8 : cy;
              return (
                <text
                  key={`label-${name}`}
                  x={cx}
                  y={labelY}
                  textAnchor="middle"
                  fontSize="7.5"
                  fontWeight="600"
                  fill="#334155"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {resolveToDataName(name)}
                </text>
              );
            })}

            {/* Top 3 worst district badges */}
            {Object.entries(districtCentroids)
              .filter(([name]) => top3Worst.has(name))
              .map(([name, [cx, cy]], i) => {
                const data = districtMap.current.get(name);
                const badgeY = cy + 2;
                const label = heatmapMode === "loss"
                  ? `#${i + 1} ${data?.estimatedLoss != null ? formatShort(data.estimatedLoss) : "—"}`
                  : heatmapMode === "mvChange"
                    ? `#${i + 1} MV ${data?.mvChangePercent != null ? data.mvChangePercent.toFixed(1) + "%" : "—"}`
                    : `#${i + 1} DRR ${data?.avgDrr != null ? data.avgDrr.toFixed(2) : "—"}`;
                const badgeW = heatmapMode === "mvChange" ? 64 : heatmapMode === "loss" ? 62 : 56;
                const badgeFill = heatmapMode === "mvChange" ? "#0369a1" : heatmapMode === "loss" ? "#b91c1c" : "#dc2626";
                return (
                  <g key={`badge-${name}`} style={{ pointerEvents: "none" }}>
                    <rect
                      x={cx - badgeW / 2}
                      y={badgeY}
                      width={badgeW}
                      height={15}
                      rx={4}
                      fill={badgeFill}
                      opacity={0.9}
                    />
                    <text
                      x={cx}
                      y={badgeY + 10.5}
                      textAnchor="middle"
                      fontSize="7"
                      fontWeight="700"
                      fill="white"
                      style={{ userSelect: "none" }}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
          </g>
        </svg>
        {/* Heatmap mode toggle */}
        <div className="absolute top-3 left-3 flex items-center rounded-md border border-slate-200 bg-white/95 shadow-sm text-xs">
          <button
            type="button"
            onClick={() => setHeatmapMode("drr")}
            className={`px-2.5 py-1.5 rounded-l-md font-medium transition-colors ${
              heatmapMode === "drr"
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            DRR Severity
          </button>
          <button
            type="button"
            onClick={() => setHeatmapMode("loss")}
            className={`px-2.5 py-1.5 font-medium transition-colors ${
              heatmapMode === "loss"
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Est. Loss
          </button>
          <button
            type="button"
            onClick={() => setHeatmapMode("mvChange")}
            className={`px-2.5 py-1.5 rounded-r-md font-medium transition-colors ${
              heatmapMode === "mvChange"
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            MV Growth
          </button>
        </div>

        {/* Inline legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md border border-slate-200 bg-white/95 px-2.5 py-1.5 shadow-sm text-[10px] text-slate-500">
          {heatmapMode === "drr" ? (
            <>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: CHOROPLETH_HIGH }} />
                &lt;0.70
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: CHOROPLETH_MID }} />
                0.70–0.90
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: CHOROPLETH_LOW }} />
                &gt;0.90
              </span>
            </>
          ) : heatmapMode === "loss" ? (
            <>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: LOSS_NONE }} />
                Low
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: LOSS_MED }} />
                Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: LOSS_HIGH }} />
                High
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: LOSS_CRITICAL }} />
                Critical
              </span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: MV_NONE }} />
                &lt;55%
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: MV_LOW }} />
                55–59%
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: MV_MED }} />
                59–62%
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: MV_HIGH }} />
                62–64%
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: MV_CRITICAL }} />
                &gt;64%
              </span>
            </>
          )}
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 rounded-md border border-slate-200 bg-white/95 p-1 shadow-sm">
          <button
            type="button"
            onClick={handleZoomIn}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(12px, -50%)",
          }}
        >
          <p className="text-sm font-bold text-slate-900">{tooltip.name}</p>
          {tooltip.data && (
            <div className="mt-1.5 space-y-1 text-xs text-slate-600">
              {tooltip.data.avgDrr != null && (
                <div className="flex justify-between gap-4">
                  <span>Avg DRR</span>
                  <span className="font-medium">{tooltip.data.avgDrr.toFixed(2)}</span>
                </div>
              )}
              {tooltip.data.hotspotCount != null && (
                <div className="flex justify-between gap-4">
                  <span>Hotspots</span>
                  <span className="font-medium">{tooltip.data.hotspotCount}</span>
                </div>
              )}
              {tooltip.data.sroCount != null && (
                <div className="flex justify-between gap-4">
                  <span>SROs</span>
                  <span className="font-medium">{tooltip.data.sroCount}</span>
                </div>
              )}
              {tooltip.data.estimatedLoss != null && (
                <div className="flex justify-between gap-4">
                  <span>Est. Loss</span>
                  <span className="font-medium text-red-600">
                    {formatShort(tooltip.data.estimatedLoss)}
                  </span>
                </div>
              )}
              {tooltip.data.mvChangePercent != null && (
                <div className="flex justify-between gap-4">
                  <span>MV-Driven Growth</span>
                  <span className="font-medium text-sky-700">
                    {tooltip.data.mvChangePercent.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}
          <p className="mt-1 text-[10px] text-slate-400">Click for details</p>
        </div>
      )}

      {selectedDistrict && (
        <div
          className="absolute inset-0 z-40 flex items-stretch justify-end rounded-lg bg-black/20"
          role="presentation"
          onClick={() => setSelectedDistrict(null)}
        >
          <div
            className="w-full max-w-lg overflow-auto rounded-l-lg border border-slate-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
              <h3 className="text-base font-bold text-slate-900">{selectedDistrict}</h3>
              <button
                type="button"
                onClick={() => setSelectedDistrict(null)}
                className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <p className="text-xs font-medium text-slate-500 px-2 py-1.5 border-b border-slate-200 bg-slate-50">
                  District map — zoom in to see cities, roads & places (scroll to zoom, drag to pan)
                </p>
                <DistrictDetailLeafletMap
                  districtGeoJson={detailDistrictGeoJson}
                  fill={
                    heatmapMode === "loss"
                      ? getFillForLoss(selectedData?.estimatedLoss, maxLoss)
                      : heatmapMode === "mvChange"
                        ? getFillForMvChange(selectedData?.mvChangePercent)
                        : (getFillForDrr(selectedData?.avgDrr) ?? baseFill)
                  }
                  strokeColor={strokeColor}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Details
                </p>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {selectedData?.avgDrr != null && (
                    <>
                      <dt className="text-slate-500">Avg DRR</dt>
                      <dd className="font-medium text-slate-900">
                        {selectedData.avgDrr.toFixed(2)}
                      </dd>
                    </>
                  )}
                  {selectedData?.hotspotCount != null && (
                    <>
                      <dt className="text-slate-500">Hotspots</dt>
                      <dd className="font-medium text-slate-900">{selectedData.hotspotCount}</dd>
                    </>
                  )}
                  {selectedData?.sroCount != null && (
                    <>
                      <dt className="text-slate-500">SROs</dt>
                      <dd className="font-medium text-slate-900">{selectedData.sroCount}</dd>
                    </>
                  )}
                  {selectedData?.transactionCount != null && (
                    <>
                      <dt className="text-slate-500">Transactions</dt>
                      <dd className="font-medium text-slate-900">
                        {selectedData.transactionCount.toLocaleString("en-IN")}
                      </dd>
                    </>
                  )}
                  {selectedData?.estimatedLoss != null && (
                    <>
                      <dt className="text-slate-500">Est. Loss</dt>
                      <dd className="font-medium text-red-600">
                        {formatShort(selectedData.estimatedLoss)}
                      </dd>
                    </>
                  )}
                </dl>
                {!selectedData && (
                  <p className="text-xs text-slate-400">No metrics available for this district.</p>
                )}
              </div>

              {/* MV Growth Details (shown in mvChange mode or when data exists) */}
              {(() => {
                const dName = resolveToDataName(selectedDistrict);
                const revision = mvRevisionInfo?.[dName];
                const hierarchy = mvHierarchy?.[dName];
                if (!revision && !hierarchy && selectedData?.mvChangePercent == null) return null;

                return (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      MV Growth Attribution
                    </p>

                    {/* MV summary cards */}
                    <div className="grid grid-cols-2 gap-2">
                      {selectedData?.mvChangePercent != null && (
                        <div className="rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-center">
                          <p className="text-[10px] text-slate-500">MV-Driven</p>
                          <p className="text-lg font-bold text-sky-700">{selectedData.mvChangePercent.toFixed(1)}%</p>
                          <p className="text-[10px] text-slate-400">of total growth</p>
                        </div>
                      )}
                      {revision && (
                        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2.5 text-center">
                          <p className="text-[10px] text-slate-500">Avg MV Increase</p>
                          <p className="text-lg font-bold text-indigo-700">{revision.avgMVIncrease.toFixed(1)}%</p>
                          <p className="text-[10px] text-slate-400">Revised {revision.date}</p>
                        </div>
                      )}
                    </div>

                    {revision && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded bg-slate-50 px-2 py-1.5">
                          <p className="text-[10px] text-slate-500">Revenue Impact</p>
                          <p className="font-medium text-slate-900">{formatShort(revision.revenueImpact)}</p>
                        </div>
                        <div className="rounded bg-slate-50 px-2 py-1.5">
                          <p className="text-[10px] text-slate-500">Doc Volume Impact</p>
                          <p className="font-medium text-slate-900">{revision.documentImpact > 0 ? "+" : ""}{revision.documentImpact.toFixed(1)}%</p>
                        </div>
                      </div>
                    )}

                    {/* Hierarchy drill-down: SRO → Mandal → Village */}
                    {hierarchy?.children && hierarchy.children.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-slate-600">
                          Area Breakdown — {hierarchy.children.length} SROs
                        </p>
                        {hierarchy.children.map((sro) => {
                          const mvPct = sro.revenue > 0 ? (sro.mvDriven / sro.revenue) * 100 : 0;
                          return (
                            <div key={sro.code} className="rounded-lg border border-sky-100 bg-sky-50/50 p-2.5">
                              <div className="flex items-center justify-between mb-1.5">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{sro.name}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">{sro.code} · {sro.docCount.toLocaleString("en-IN")} docs</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-sky-700">{mvPct.toFixed(1)}%</p>
                                  <p className="text-[10px] text-slate-400">MV-driven</p>
                                </div>
                              </div>

                              {/* MV vs Volume bar */}
                              <div className="flex h-2 rounded-full overflow-hidden bg-slate-200 mb-2">
                                <div
                                  className="bg-sky-500 transition-all"
                                  style={{ width: `${mvPct}%` }}
                                  title={`MV-driven: ${formatShort(sro.mvDriven)}`}
                                />
                                <div
                                  className="bg-emerald-400 transition-all"
                                  style={{ width: `${100 - mvPct}%` }}
                                  title={`Volume-driven: ${formatShort(sro.volumeDriven)}`}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-500 mb-2">
                                <span>MV: {formatShort(sro.mvDriven)}</span>
                                <span>Vol: {formatShort(sro.volumeDriven)}</span>
                              </div>

                              {/* Mandals under SRO */}
                              {sro.children && sro.children.length > 0 && (
                                <div className="space-y-1">
                                  {sro.children.map((mandal) => {
                                    const mPct = mandal.revenue > 0 ? (mandal.mvDriven / mandal.revenue) * 100 : 0;
                                    return (
                                      <div key={mandal.code} className="rounded bg-white/80 px-2 py-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                          <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-800 truncate">{mandal.name}</p>
                                            <p className="text-[10px] text-slate-400">{mandal.docCount.toLocaleString("en-IN")} docs · Rev: {formatShort(mandal.revenue)}</p>
                                          </div>
                                          <div className="text-right ml-3 shrink-0">
                                            <p className="font-bold text-sky-700">{mPct.toFixed(1)}%</p>
                                            <p className="text-[10px] text-slate-400">MV-driven</p>
                                          </div>
                                        </div>
                                        {/* Mini bar for mandal */}
                                        <div className="flex h-1 rounded-full overflow-hidden bg-slate-200 mt-1">
                                          <div className="bg-sky-400" style={{ width: `${mPct}%` }} />
                                          <div className="bg-emerald-300" style={{ width: `${100 - mPct}%` }} />
                                        </div>

                                        {/* Villages under mandal */}
                                        {mandal.children && mandal.children.length > 0 && (
                                          <div className="mt-1.5 ml-2 space-y-0.5">
                                            {mandal.children.map((village) => {
                                              const vPct = village.revenue > 0 ? (village.mvDriven / village.revenue) * 100 : 0;
                                              return (
                                                <div key={village.code} className="flex items-center justify-between text-[10px] text-slate-600 px-1.5 py-0.5 rounded bg-slate-50">
                                                  <span className="truncate">{village.name}</span>
                                                  <span className="font-semibold text-sky-600 ml-2 shrink-0">{vPct.toFixed(0)}% MV</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Area-wise SRO Breakdown */}
              {(() => {
                const districtName = resolveToDataName(selectedDistrict);
                const areas = areaDetails?.[districtName];
                if (!areas?.length) return null;

                // Group by SRO
                const sroGroups: Record<string, { sroName: string; items: DistrictAreaItem[] }> = {};
                for (const item of areas) {
                  if (!sroGroups[item.sroCode]) {
                    sroGroups[item.sroCode] = { sroName: item.sroName, items: [] };
                  }
                  sroGroups[item.sroCode].items.push(item);
                }

                return (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      SRO-wise Breakdown ({Object.keys(sroGroups).length} SROs, {areas.length} locations)
                    </p>

                    {Object.entries(sroGroups).map(([sroCode, { sroName, items }]) => {
                      const avgDrr = items.reduce((s, i) => s + i.drr, 0) / items.length;
                      const totalLoss = items.reduce((s, i) => s + i.estimatedLoss, 0);
                      const totalTxn = items.reduce((s, i) => s + i.transactionCount, 0);
                      const drrColor = avgDrr < 0.7 ? "text-red-600" : avgDrr < 0.85 ? "text-orange-600" : avgDrr < 0.95 ? "text-amber-600" : "text-green-600";
                      const drrBg = avgDrr < 0.7 ? "bg-red-50 border-red-200" : avgDrr < 0.85 ? "bg-orange-50 border-orange-200" : avgDrr < 0.95 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200";

                      return (
                        <div key={sroCode} className={`rounded-lg border p-3 ${drrBg}`}>
                          {/* SRO Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{sroName}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{sroCode}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${drrColor}`}>{avgDrr.toFixed(2)}</p>
                              <p className="text-[10px] text-slate-500">Avg DRR</p>
                            </div>
                          </div>

                          {/* SRO Summary */}
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <div className="rounded bg-white/70 px-2 py-1 text-center">
                              <p className="text-xs text-slate-500">Locations</p>
                              <p className="text-sm font-bold">{items.length}</p>
                            </div>
                            <div className="rounded bg-white/70 px-2 py-1 text-center">
                              <p className="text-xs text-slate-500">Transactions</p>
                              <p className="text-sm font-bold">{totalTxn.toLocaleString("en-IN")}</p>
                            </div>
                            <div className="rounded bg-white/70 px-2 py-1 text-center">
                              <p className="text-xs text-slate-500">Est. Loss</p>
                              <p className="text-sm font-bold text-red-600">{formatShort(totalLoss)}</p>
                            </div>
                          </div>

                          {/* Location rows */}
                          <div className="space-y-1">
                            {items
                              .sort((a, b) => a.drr - b.drr)
                              .map((item, idx) => {
                                const sevColor =
                                  item.severity === "Critical" ? "bg-red-100 text-red-700"
                                    : item.severity === "High" ? "bg-orange-100 text-orange-700"
                                    : item.severity === "Medium" ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700";
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between rounded bg-white/80 px-2 py-1.5 text-xs"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-slate-800 truncate">{item.locationLabel}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${sevColor}`}>
                                          {item.severity}
                                        </span>
                                        <span className="text-slate-400">{item.locationType}</span>
                                        <span className="text-slate-400">{item.transactionCount} txn</span>
                                      </div>
                                    </div>
                                    <div className="text-right ml-3 shrink-0">
                                      <p className={`font-bold ${item.drr < 0.7 ? "text-red-600" : item.drr < 0.85 ? "text-orange-600" : "text-slate-700"}`}>
                                        {item.drr.toFixed(2)}
                                      </p>
                                      <p className="text-red-500 text-[10px]">{formatShort(item.estimatedLoss)}</p>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
