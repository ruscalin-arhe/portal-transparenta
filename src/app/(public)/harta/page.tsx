"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { proiecte, getProiectById } from "@/lib/data/proiecte";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

function HartaInner() {
  const searchParams = useSearchParams();
  const proiectId = searchParams.get("proiect");
  const focus = proiectId ? getProiectById(proiectId) : null;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // @ts-ignore
    import("leaflet/dist/leaflet.css");

    // Fix iconuri default Leaflet în Next.js
    import("leaflet").then((L) => {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
  }, []);

  if (!mounted) {
    return (
      <div className="h-[600px] flex items-center justify-center text-muted-foreground">
        Se încarcă harta...
      </div>
    );
  }

  const center: [number, number] = focus
    ? [focus.lat, focus.lng]
    : [46.5, 25.0];
  const zoom = focus ? 11 : 7;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hartă interactivă</h1>
          <p className="text-muted-foreground mt-1">
            {focus
              ? `Focus: ${focus.nume}`
              : "Localizarea proiectelor din coridor"}
          </p>
        </div>
        {focus && (
          <Link href="/harta">
            <Button variant="outline" size="sm">
              Vezi toate proiectele
            </Button>
          </Link>
        )}
      </div>

      <Card className="overflow-hidden border shadow-sm">
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <MapContainer
              center={center}
              zoom={zoom}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {proiecte.map((p) => (
                <Marker key={p.id} position={[p.lat, p.lng]}>
                  <Popup>
                    <div className="text-sm space-y-1 min-w-[180px]">
                      <strong className="block">{p.nume}</strong>
                      <span className="text-muted-foreground">{p.localitate}</span>
                      <br />
                      <Link
                        href={`/proiecte/${p.id}`}
                        className="text-blue-600 underline text-xs"
                      >
                        Vezi detalii →
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HartaPage() {
  return (
    <Suspense fallback={<div className="p-8">Se încarcă harta...</div>}>
      <HartaInner />
    </Suspense>
  );
}
