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
}

const DEFAULT_FILL = "#cbd5e1";
const HOVER_FILL = "#94a3b8";
const STROKE = "#475569";
const CHOROPLETH_LOW = "#dcfce7";
const CHOROPLETH_MID = "#fef9c3";
const CHOROPLETH_HIGH = "#fee2e2";

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

  // Top 3 worst districts by avgDrr (lowest DRR = worst)
  const top3Worst = useMemo(() => {
    const withDrr = Object.keys(districtCentroids)
      .map((name) => ({ name, data: districtMap.current.get(name) }))
      .filter((d): d is { name: string; data: DistrictMapData } => d.data?.avgDrr != null);
    withDrr.sort((a, b) => (a.data.avgDrr ?? 1) - (b.data.avgDrr ?? 1));
    return new Set(withDrr.slice(0, 3).map((d) => d.name));
  }, [districtCentroids, districtData]);

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
              const fillColor =
                isHovered
                  ? hoverFill
                  : data != null
                    ? getFillForDrr(data.avgDrr)
                    : (districtToColor.get(name) ?? baseFill);
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
                const drr = data?.avgDrr;
                const badgeY = cy + 2;
                return (
                  <g key={`badge-${name}`} style={{ pointerEvents: "none" }}>
                    <rect
                      x={cx - 28}
                      y={badgeY}
                      width={56}
                      height={15}
                      rx={4}
                      fill="#dc2626"
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
                      #{i + 1} DRR {drr != null ? drr.toFixed(2) : "—"}
                    </text>
                  </g>
                );
              })}
          </g>
        </svg>
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
                  fill={getFillForDrr(selectedData?.avgDrr) ?? baseFill}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
