"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MVHotspotItem, MVSeverity } from "@/lib/revenue-leakage/types";
import { APDistrictMap, DistrictData } from "@/components/revenue-leakage/ap-district-map";
import { getMVLocationsForSro } from "@/lib/revenue-leakage/mvTrendsData";
import { formatShort, severityBadge, drrText, drrColor, drrSeverity } from "../constants";
import type { MapViewMode } from "../types";

interface MapViewProps {
  mapView: MapViewMode;
  setMapView: (v: MapViewMode) => void;
  selectedDistrict: string | null;
  setSelectedDistrict: (v: string | null) => void;
  selectedSro: string | null;
  setSelectedSro: (v: string | null) => void;
  sroTiles: {
    sro_code: string;
    sro_name: string;
    district: string;
    avg_drr: number;
    hotspot_count: number;
    transaction_count: number;
    estimated_loss: number;
  }[];
  hotspots: MVHotspotItem[];
  districtDataList: DistrictData[];
  openHotspot: (item: MVHotspotItem) => void;
}

function SroCard({
  tile,
  onClick,
}: {
  tile: { sro_code: string; sro_name: string; avg_drr: number; hotspot_count: number; transaction_count: number; estimated_loss: number };
  onClick: () => void;
}) {
  const color = drrColor(tile.avg_drr);
  const sev = drrSeverity(tile.avg_drr);
  return (
    <div
      className="rounded-lg bg-white border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex">
        <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 p-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">{tile.sro_code}</p>
              <p className="text-xs text-slate-500">{tile.sro_name}</p>
            </div>
            {sev !== "Normal" && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${severityBadge[sev as MVSeverity]}`}
              >
                {sev}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-slate-500">DRR</span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(tile.avg_drr, 1) * 100}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <span className={`text-xs font-bold ${drrText(tile.avg_drr)}`}>
              {tile.avg_drr.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
            <span>{tile.hotspot_count} hotspots</span>
            <span>{tile.transaction_count} txns</span>
            <span>Loss {formatShort(tile.estimated_loss)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MapView({
  mapView,
  setMapView,
  selectedDistrict,
  setSelectedDistrict,
  selectedSro,
  setSelectedSro,
  sroTiles,
  hotspots,
  districtDataList,
  openHotspot,
}: MapViewProps) {
  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setMapView("state");
            setSelectedDistrict(null);
            setSelectedSro(null);
          }}
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${mapView === "state" && !selectedDistrict && !selectedSro ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200"}`}
        >
          State View
        </button>
        <button
          onClick={() => {
            setMapView("district");
            setSelectedSro(null);
          }}
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${mapView === "district" ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200"}`}
        >
          District View
        </button>
        <div className="ml-auto text-xs text-slate-500 flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-red-600 rounded-full" /> DRR &lt; 0.7
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-500 rounded-full" /> 0.7-0.85
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-amber-400 rounded-full" /> 0.85-1.0
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" /> &gt; 1.0
          </span>
        </div>
      </div>

      {/* Breadcrumb */}
      {(selectedDistrict || selectedSro) && (
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <button
            className="text-blue-600 hover:underline"
            onClick={() => {
              setSelectedDistrict(null);
              setSelectedSro(null);
            }}
          >
            All Districts
          </button>
          {selectedDistrict && (
            <>
              <span>&gt;</span>
              <button
                className={
                  selectedSro ? "text-blue-600 hover:underline" : "text-slate-700 font-medium"
                }
                onClick={() => setSelectedSro(null)}
              >
                {selectedDistrict}
              </button>
            </>
          )}
          {selectedSro && (
            <>
              <span>&gt;</span>
              <span className="text-slate-700 font-medium">{selectedSro}</span>
            </>
          )}
        </div>
      )}

      {/* SRO drilldown */}
      {selectedSro ? (
        (() => {
          const locations = getMVLocationsForSro(selectedSro);
          const sroInfo = sroTiles.find((t) => t.sro_code === selectedSro);
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedSro(null)}>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                </Button>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {sroInfo?.sro_name || selectedSro}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locations.length} locations monitored
                  </p>
                </div>
                {sroInfo && (
                  <div className="ml-auto flex items-center gap-3 text-xs text-slate-600">
                    <span>
                      Avg DRR{" "}
                      <span className={`font-bold ${drrText(sroInfo.avg_drr)}`}>
                        {sroInfo.avg_drr.toFixed(2)}
                      </span>
                    </span>
                    <span>
                      Hotspots{" "}
                      <span className="font-bold text-slate-900">{sroInfo.hotspot_count}</span>
                    </span>
                    <span>
                      Loss{" "}
                      <span className="font-bold text-red-600">
                        {formatShort(sroInfo.estimated_loss)}
                      </span>
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {locations.map((loc) => {
                  const hotspot = hotspots.find(
                    (h) => h.sro_code === selectedSro && h.location_label === loc.location_label
                  );
                  const color = drrColor(loc.drr);
                  const sev = drrSeverity(loc.drr);
                  return (
                    <div
                      key={`${loc.sro_code}-${loc.location_label}`}
                      className={`rounded-lg bg-white border border-slate-200 overflow-hidden hover:shadow-md transition-shadow ${hotspot ? "cursor-pointer" : "opacity-60"}`}
                      onClick={() => {
                        if (hotspot) openHotspot(hotspot);
                      }}
                    >
                      <div className="flex">
                        <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
                        <div className="flex-1 p-3">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-bold text-slate-900 leading-tight">
                              {loc.location_label}
                            </p>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${loc.location_type === "URBAN" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}
                              >
                                {loc.location_type}
                              </span>
                              {sev !== "Normal" && (
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${severityBadge[sev as MVSeverity]}`}
                                >
                                  {sev}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-slate-500">DRR</span>
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(loc.drr, 1) * 100}%`,
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                            <span className={`text-xs font-bold ${drrText(loc.drr)}`}>
                              {loc.drr.toFixed(2)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                            <span>{loc.transaction_count} txns</span>
                            <span>Loss {formatShort(loc.estimated_loss)}</span>
                            {loc.hotspot_count > 0 && (
                              <span className="text-red-600 font-semibold">Hotspot</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      ) : selectedDistrict ? (
        (() => {
          const districtSros = sroTiles.filter((t) => t.district === selectedDistrict);
          const districtInfo = districtDataList.find((d) => d.name === selectedDistrict);
          return (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setSelectedDistrict(null)}>
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
                </Button>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedDistrict} District
                  </h3>
                  <p className="text-xs text-slate-500">{districtSros.length} SROs</p>
                </div>
                {districtInfo && (
                  <div className="ml-auto flex items-center gap-3 text-xs text-slate-600">
                    <span>
                      Avg DRR{" "}
                      <span className={`font-bold ${drrText(districtInfo.avgDrr)}`}>
                        {districtInfo.avgDrr.toFixed(2)}
                      </span>
                    </span>
                    <span>
                      Hotspots{" "}
                      <span className="font-bold text-slate-900">
                        {districtInfo.hotspotCount}
                      </span>
                    </span>
                    <span>
                      Loss{" "}
                      <span className="font-bold text-red-600">
                        {formatShort(districtInfo.estimatedLoss)}
                      </span>
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {districtSros.map((tile) => (
                  <SroCard
                    key={tile.sro_code}
                    tile={tile}
                    onClick={() => setSelectedSro(tile.sro_code)}
                  />
                ))}
              </div>
            </div>
          );
        })()
      ) : mapView === "district" ? (
        <div className="space-y-4">
          {Object.entries(
            sroTiles.reduce<Record<string, typeof sroTiles>>((acc, tile) => {
              acc[tile.district] = acc[tile.district] || [];
              acc[tile.district].push(tile);
              return acc;
            }, {})
          ).map(([district, tiles]) => {
            const distInfo = districtDataList.find((d) => d.name === district);
            return (
              <div key={district}>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    className="text-xs font-semibold text-blue-600 hover:underline"
                    onClick={() => setSelectedDistrict(district)}
                  >
                    {district}
                  </button>
                  {distInfo && (
                    <span className="text-[10px] text-slate-400">
                      DRR {distInfo.avgDrr.toFixed(2)} | {distInfo.hotspotCount} hotspots |{" "}
                      {formatShort(distInfo.estimatedLoss)}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {tiles.map((tile) => (
                    <SroCard
                      key={tile.sro_code}
                      tile={tile}
                      onClick={() => {
                        setSelectedDistrict(district);
                        setSelectedSro(tile.sro_code);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Card className="p-3 border-t-2 border-t-red-500">
              <p className="text-[11px] text-slate-500">Total Hotspots</p>
              <p className="text-lg font-bold text-slate-900">
                {districtDataList.reduce((s, d) => s + d.hotspotCount, 0)}
              </p>
            </Card>
            <Card className="p-3 border-t-2 border-t-orange-500">
              <p className="text-[11px] text-slate-500">Critical Districts</p>
              <p className="text-lg font-bold text-slate-900">
                {districtDataList.filter((d) => d.avgDrr < 0.85).length} of{" "}
                {districtDataList.length}
              </p>
            </Card>
            <Card className="p-3 border-t-2 border-t-emerald-500">
              <p className="text-[11px] text-slate-500">Total Est. Loss</p>
              <p className="text-lg font-bold text-red-600">
                {formatShort(districtDataList.reduce((s, d) => s + d.estimatedLoss, 0))}
              </p>
            </Card>
          </div>
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Andhra Pradesh - District Hotspot Map
            </h3>
            <p className="text-xs text-slate-500 mb-3">Click a district to view SROs</p>
            <APDistrictMap
              districts={districtDataList}
              onDistrictClick={(name) => setSelectedDistrict(name)}
              formatShort={formatShort}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
