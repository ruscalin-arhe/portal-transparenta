"use client";

import { useEffect, useMemo, memo } from "react";
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
import { riscColor, normalizeRisc } from "@/lib/risc-colors";

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

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

type Point = ProiectMap & { lat: number; lng: number };

function MapController({
  points,
  focusId,
}: {
  points: Point[];
  focusId?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    const id = window.requestAnimationFrame(() => map.invalidateSize());
    return () => window.cancelAnimationFrame(id);
  }, [map]);

  useEffect(() => {
    if (!points.length) return;

    if (focusId) {
      const p = points.find((x) => x.id === focusId);
      if (p) {
        map.flyTo([p.lat, p.lng], 15, { duration: 0.7 });
        return;
      }
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15);
      return;
    }

    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, points, focusId]);

  return null;
}

const ProjectMarker = memo(function ProjectMarker({
  p,
  focused,
}: {
  p: Point;
  focused: boolean;
}) {
  const color = riscColor(p.risc);
  const nivel = normalizeRisc(p.risc);

  return (
    <>
      <CircleMarker
        center={[p.lat, p.lng]}
        radius={focused ? 16 : 10}
        pathOptions={{
          color: focused ? "#ffffff" : color,
          fillColor: color,
          fillOpacity: focused ? 0.95 : 0.8,
          weight: focused ? 3 : 2,
        }}
      />
      <Marker position={[p.lat, p.lng]} icon={markerIcon}>
        <Popup>
          <div style={{ minWidth: 200 }}>
            <strong style={{ color }}>{p.nume}</strong>
            <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.45 }}>
              <div>
                {p.localitate} · {p.status}
              </div>
              <div>Progres: {p.progres}%</div>
              <div style={{ color, fontWeight: 600, marginTop: 4 }}>
                Risc: {p.risc || nivel}
              </div>
              {p.zileIntarziere != null && p.zileIntarziere > 0 ? (
                <div style={{ color }}>Intarziere: {p.zileIntarziere} zile</div>
              ) : null}
              {p.depasireBugetMil != null && p.depasireBugetMil > 0 ? (
                <div style={{ color }}>
                  Depasire buget: +{p.depasireBugetMil} mil. RON
                </div>
              ) : null}
            </div>
            <div style={{ marginTop: 8 }}>
              <Link
                href={`/proiecte/${p.id}`}
                style={{ color, fontWeight: 600, textDecoration: "underline" }}
              >
                Detalii →
              </Link>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
});

export default function LeafletMap({
  proiecte,
  focusId,
}: {
  proiecte: ProiectMap[];
  focusId?: string | null;
}) {
  const points = useMemo(() => {
    const out: Point[] = [];
    for (const p of proiecte) {
      if (
        typeof p.lat === "number" &&
        typeof p.lng === "number" &&
        !Number.isNaN(p.lat) &&
        !Number.isNaN(p.lng)
      ) {
        out.push(p as Point);
      }
    }
    return out;
  }, [proiecte]);

  const center = useMemo((): [number, number] => {
    if (!points.length) return [45.94, 24.96];
    if (focusId) {
      const f = points.find((p) => p.id === focusId);
      if (f) return [f.lat, f.lng];
    }
    return [points[0].lat, points[0].lng];
  }, [points, focusId]);

  return (
    <div className="h-[min(70vh,560px)] w-full rounded-lg overflow-hidden border relative z-0">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Satelit">
            <TileLayer
              attribution="Esri World Imagery"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              updateWhenZooming={false}
              keepBuffer={2}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="OpenStreetMap">
            <TileLayer
              attribution="OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              updateWhenZooming={false}
              keepBuffer={2}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapController points={points} focusId={focusId} />

        {points.map((p) => (
          <ProjectMarker key={p.id} p={p} focused={focusId === p.id} />
        ))}
      </MapContainer>
    </div>
  );
}
