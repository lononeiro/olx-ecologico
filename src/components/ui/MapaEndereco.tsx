"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  endereco: string;
}

interface GeoResult {
  lat: number;
  lon: number;
  display_name: string;
  precisao: "exata" | "aproximada" | "nao_encontrada";
}

// Tenta geocodificar em níveis de detalhe decrescentes
async function geocodificar(endereco: string): Promise<GeoResult | null> {
  const base = "https://nominatim.openstreetmap.org/search";
  const headers = { "Accept-Language": "pt-BR", "User-Agent": "ReciclaFacil/1.0" };

  const tentativas = [
    endereco,                                          // endereço completo
    endereco.replace(/,?\s*\d{5}-?\d{3}/, "").trim(), // sem CEP
    endereco.split(",").slice(0, 2).join(",").trim(),  // só rua + número
    endereco.split(",").slice(-2).join(",").trim(),    // só cidade + estado
  ].filter((v, i, arr) => arr.indexOf(v) === i);      // deduplica

  for (let i = 0; i < tentativas.length; i++) {
    const q = encodeURIComponent(tentativas[i]);
    try {
      const res = await fetch(`${base}?q=${q}&format=json&limit=1&countrycodes=br`, { headers });
      const data = await res.json();
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          display_name: data[0].display_name,
          precisao: i === 0 ? "exata" : "aproximada",
        };
      }
    } catch {
      // tenta próxima
    }
  }
  return null;
}

export function MapaEndereco({ endereco }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [status, setStatus] = useState<"carregando" | "ok" | "aproximado" | "erro">("carregando");

  useEffect(() => {
    let isMounted = true;

    async function init() {
      // Carrega Leaflet dinamicamente
      const L = (await import("leaflet" as any)).default;
      if (!isMounted || !mapRef.current) return;

      // Corrige ícones padrão do Leaflet (problema conhecido com bundlers)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Evita re-inicializar se já existir instância
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const result = await geocodificar(endereco);

      if (!isMounted || !mapRef.current) return;

      if (!result) {
        setStatus("erro");
        return;
      }

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(
        [result.lat, result.lon],
        result.precisao === "exata" ? 16 : 13
      );
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Ícone diferente para localização aproximada
      const icon = result.precisao === "aproximada"
        ? L.divIcon({
            html: `<div style="
              width:32px;height:32px;border-radius:50% 50% 50% 0;
              background:var(--yellow);border:3px solid #fff;
              transform:rotate(-45deg);
              box-shadow:0 2px 8px rgba(0,0,0,.3)">
            </div>`,
            iconSize: [32, 32], iconAnchor: [16, 32],
          })
        : L.divIcon({
            html: `<div style="
              width:32px;height:32px;border-radius:50% 50% 50% 0;
              background:var(--green);border:3px solid #fff;
              transform:rotate(-45deg);
              box-shadow:0 2px 8px rgba(0,0,0,.3)">
            </div>`,
            iconSize: [32, 32], iconAnchor: [16, 32],
          });

      L.marker([result.lat, result.lon], { icon })
        .addTo(map)
        .bindPopup(`<b>${endereco}</b>`)
        .openPopup();

      setStatus(result.precisao === "exata" ? "ok" : "aproximado");
    }

    init();
    return () => { isMounted = false; };
  }, [endereco]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
      {/* Aviso de precisão */}
      {status === "aproximado" && (
        <div style={{
          display: "flex", alignItems: "center", gap: ".5rem",
          padding: ".55rem .85rem",
          background: "var(--yellow-light)",
          border: "1.5px solid rgba(196,122,6,.25)",
          borderRadius: "var(--radius-xs)",
          fontSize: ".78rem", color: "var(--yellow)", fontWeight: 600,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
          </svg>
          Localizacao aproximada — confirme o endereco no texto abaixo
        </div>
      )}
      {status === "erro" && (
        <div style={{
          display: "flex", alignItems: "center", gap: ".5rem",
          padding: ".55rem .85rem",
          background: "var(--red-light)",
          border: "1.5px solid rgba(184,50,40,.2)",
          borderRadius: "var(--radius-xs)",
          fontSize: ".78rem", color: "var(--red)", fontWeight: 600,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
          </svg>
          Nao foi possivel localizar o endereco no mapa
        </div>
      )}

      {/* Mapa */}
      {status !== "erro" && (
        <div style={{ position: "relative", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1.5px solid var(--border)" }}>
          {status === "carregando" && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "var(--surface-2)",
            }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".75rem", color: "var(--text-faint)" }}>
                <span className="spinner spinner-green" style={{ width: 24, height: 24 }} />
                <span style={{ fontSize: ".8rem" }}>Carregando mapa...</span>
              </div>
            </div>
          )}
          {/* CSS do Leaflet injetado inline para evitar import global */}
          <style>{`
            .leaflet-container { font-family: var(--font); }
            .leaflet-popup-content-wrapper { border-radius: 10px; box-shadow: var(--shadow); }
            .leaflet-popup-content { font-size: .82rem; font-weight: 600; color: var(--text); margin: .5rem .75rem; }
          `}</style>
          <div ref={mapRef} style={{ height: 340, width: "100%" }} />
        </div>
      )}

      {/* Endereço em texto */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: ".4rem",
        fontSize: ".8rem", color: "var(--text-muted)",
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
        </svg>
        <span>{endereco}</span>
      </div>
    </div>
  );
}