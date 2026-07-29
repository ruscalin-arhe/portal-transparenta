"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  LayersControl,
  CircleMarker,
} from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

export type ProiectMap = {
  id: string;
  nume: string;
  status: string;
  progres: number;
  localitate: string;
  lat?: number | null;
  lng?: number | null;
  zileIntarziere?: number | null;
  depasireBugetMil?: number | null;
  risc?: string | null;
};

const iconDefault = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function MapController({
  points,
  focusId,
}: {
  points: (ProiectMap & { lat: number; lng: number })[];
  focusId?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t = window.setTimeout(() => map.invalidateSize(), 200);
    return () => window.clearTimeout(t);
  }, [map, points.length, focusId]);

  useEffect(() => {
    if (!points.length) return;

    if (focusId) {
      const p = points.find((x) => x.id === focusId);
      if (p) {
        map.flyTo([p.lat, p.lng], 13, { duration: 0.8 });
        return;
      }
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 11);
      return;
    }

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
  }, [map, points, focusId]);

  return null;
}

function riscColor(risc?: string | null) {
  const r = (risc || "").toLowerCase();
  if (r.includes("ridicat")) return "#dc2626";
  if (r.includes("mediu")) return "#f59e0b";
  if (r.includes("scazut") || r.includes("scăzut")) return "#16a34a";
  return "#2563eb";
}

export default function LeafletMap({
  proiecte,
  focusId,
}: {
  proiecte: ProiectMap[];
  focusId?: string | null;
}) {
  const points = useMemo(
    () =>
      proiecte.filter(
        (p): p is ProiectMap & { lat: number; lng: number } =>
          typeof p.lat === "number" &&
          typeof p.lng === "number" &&
          !Number.isNaN(p.lat) &&
          !Number.isNaN(p.lng)
      ),
    [proiecte]
  );

  const center: [number, number] = points.length
    ? [points[0].lat, points[0].lng]
    : [45.94, 24.96];

  return (
    <div className="h-[min(70vh,560px)] w-full rounded-lg overflow-hidden border relative z-0">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satelit">
            <TileLayer
              attribution="Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapController points={points} focusId={focusId} />

        {points.map((p) => {
          const focused = focusId === p.id;
          return (
            <span key={p.id}>
              <CircleMarker
                center={[p.lat, p.lng]}
                radius={focused ? 14 : 8}
                pathOptions={{
                  color: focused ? "#0f172a" : riscColor(p.risc),
                  fillColor: riscColor(p.risc),
                  fillOpacity: focused ? 0.9 : 0.65,
                  weight: focused ? 3 : 2,
                }}
              />
              <Marker position={[p.lat, p.lng]} icon={iconDefault}>
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <strong>{p.nume}</strong>
                    <br />
                    {p.localitate} · {p.status}
                    <br />
                    Progres: {p.progres}%
                    {p.zileIntarziere != null && p.zileIntarziere > 0 && (
                      <>
                        <br />
                        <span style={{ color: "#b45309" }}>
                          Intarziere: {p.zileIntarziere} zile
                        </span>
                      </>
                    )}
                    {p.depasireBugetMil != null && p.depasireBugetMil > 0 && (
                      <>
                        <br />
                        <span style={{ color: "#b91c1c" }}>
                          Depasire buget: +{p.depasireBugetMil} mil. RON
                        </span>
                      </>
                    )}
                    {p.risc && (
                      <>
                        <br />
                        Risc: {p.risc}
                      </>
                    )}
                    <br />
                    <Link href={`/proiecte/${p.id}`}>Detalii proiect</Link>
                  </div>
                </Popup>
              </Marker>
            </span>
          );
        })}
      </MapContainer>
    </div>
  );
}
