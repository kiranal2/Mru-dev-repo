"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type GeoCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, unknown>>;

function FitBounds({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();

  useEffect(() => {
    if (!bounds || !bounds.isValid()) return;
    map.fitBounds(bounds, { maxZoom: 14, padding: [20, 20] });
  }, [map, bounds]);

  return null;
}

function getBounds(geoJson: GeoCollection): L.LatLngBounds | null {
  try {
    const layer = L.geoJSON(geoJson as GeoJSON.GeoJsonObject);
    const b = layer.getBounds();
    return b.isValid() ? b : null;
  } catch {
    return null;
  }
}

export function DistrictDetailLeafletMap({
  districtGeoJson,
  fill,
  strokeColor,
}: {
  districtGeoJson: GeoCollection | null;
  fill: string;
  strokeColor: string;
}) {
  if (!districtGeoJson?.features?.length) {
    return (
      <div className="flex items-center justify-center bg-slate-100 p-8 text-sm text-slate-500">
        No map data for this district
      </div>
    );
  }

  const bounds = getBounds(districtGeoJson);
  const center: [number, number] = bounds
    ? [bounds.getCenter().lat, bounds.getCenter().lng]
    : [16.5, 80.5];

  return (
    <div className="relative w-full rounded-b-lg overflow-hidden" style={{ minHeight: 320 }}>
      <MapContainer
        center={center}
        zoom={9}
        className="h-[320px] w-full rounded-b-lg z-0"
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          data={districtGeoJson as GeoJSON.GeoJsonObject}
          style={{
            fillColor: fill,
            fillOpacity: 0.35,
            color: strokeColor,
            weight: 2,
          }}
        />
        <FitBounds bounds={bounds} />
      </MapContainer>
    </div>
  );
}
