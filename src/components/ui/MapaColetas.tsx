"use client";

import { useEffect, useRef, useState } from "react";

export interface MapaColetaItem {
  id: number;
  titulo: string;
  materialNome: string;
  quantidade: string;
  endereco: string;
  imagemUrl?: string | null;
}

interface GeoPonto {
  lat: number;
  lon: number;
}

/** Cor + emoji do marcador por tipo de material reciclável. */
function materialVisual(nome: string): { categoria: string; color: string; emoji: string } {
  const v = (nome ?? "").toLowerCase();
  if (v.includes("papel") || v.includes("papelao") || v.includes("papelão") || v.includes("cartao"))
    return { categoria: "Papel / Papelão", color: "#A3A05B", emoji: "📄" };
  if (v.includes("plast") || v.includes("pet"))
    return { categoria: "Plástico", color: "#3B82F6", emoji: "🧴" };
  if (v.includes("metal") || v.includes("alumin") || v.includes("lata"))
    return { categoria: "Metal / Alumínio", color: "#6B7280", emoji: "🥫" };
  if (v.includes("vidro"))
    return { categoria: "Vidro", color: "#10B981", emoji: "🍾" };
  if (v.includes("eletr") || v.includes("e-lixo"))
    return { categoria: "Eletrônico", color: "#8B5CF6", emoji: "🔌" };
  if (v.includes("organ") || v.includes("compost"))
    return { categoria: "Orgânico", color: "#84CC16", emoji: "🍃" };
  if (v.includes("oleo") || v.includes("óleo"))
    return { categoria: "Óleo", color: "#D97706", emoji: "🛢️" };
  if (v.includes("text") || v.includes("roupa") || v.includes("tecido"))
    return { categoria: "Têxtil", color: "#EC4899", emoji: "🧵" };
  if (v.includes("madeira"))
    return { categoria: "Madeira", color: "#92400E", emoji: "🪵" };
  if (v.includes("borracha") || v.includes("pneu"))
    return { categoria: "Borracha / Pneu", color: "#334155", emoji: "🛞" };
  return { categoria: "Outro", color: "#2F8D47", emoji: "♻️" };
}

const CACHE_PREFIX = "geo:v1:";

/** Lê o cache de geocodificação (localStorage). null explícito = já falhou antes. */
function lerCache(endereco: string): GeoPonto | null | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + endereco);
    if (raw === null) return undefined; // nunca buscado
    return JSON.parse(raw) as GeoPonto | null;
  } catch {
    return undefined;
  }
}

function gravarCache(endereco: string, ponto: GeoPonto | null) {
  try {
    localStorage.setItem(CACHE_PREFIX + endereco, JSON.stringify(ponto));
  } catch {
    // localStorage cheio/indisponível — segue sem cache
  }
}

async function geocodificar(endereco: string): Promise<GeoPonto | null> {
  const base = "https://nominatim.openstreetmap.org/search";
  const tentativas = [
    endereco,
    endereco.replace(/,?\s*\d{5}-?\d{3}/, "").trim(),
    endereco.split(",").slice(0, 2).join(",").trim(),
    endereco.split(",").slice(-2).join(",").trim(),
  ].filter((v, i, arr) => v && arr.indexOf(v) === i);

  for (const tentativa of tentativas) {
    try {
      const q = encodeURIComponent(tentativa);
      const res = await fetch(`${base}?q=${q}&format=json&limit=1&countrycodes=br`, {
        headers: { "Accept-Language": "pt-BR" },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
    } catch {
      // tenta a próxima variação
    }
  }
  return null;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function MapaColetas({ items }: { items: MapaColetaItem[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [status, setStatus] = useState<"carregando" | "geocodificando" | "pronto">("carregando");
  const [progresso, setProgresso] = useState({ feitos: 0, total: items.length });
  const [localizadas, setLocalizadas] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
        await new Promise<void>((resolve) => {
          link.onload = () => resolve();
          link.onerror = () => resolve();
          setTimeout(resolve, 1500);
        });
      }

      const L = (await import("leaflet" as any)).default;
      if (!isMounted || !mapRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Centro inicial: Brasil. O fitBounds ajusta assim que houver marcadores.
      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(
        [-14.235, -51.925],
        4
      );
      mapInstanceRef.current = map;
      setTimeout(() => { if (isMounted) map.invalidateSize(); }, 120);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const grupo: any[] = [];
      setStatus(items.length > 0 ? "geocodificando" : "pronto");

      for (let i = 0; i < items.length; i++) {
        if (!isMounted) return;
        const item = items[i];

        let ponto = lerCache(item.endereco);
        if (ponto === undefined) {
          ponto = await geocodificar(item.endereco);
          gravarCache(item.endereco, ponto);
          // Respeita a política de uso do Nominatim (~1 req/s) só quando bateu na rede.
          if (isMounted) await wait(1100);
        }
        if (!isMounted) return;

        if (ponto) {
          const visual = materialVisual(item.materialNome);
          // Marcador em gota com a cor e o emoji do tipo de material.
          const icon = L.divIcon({
            className: "",
            html: `<div style="position:relative;width:34px;height:34px">
              <div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:${visual.color};border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>
              <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1">${visual.emoji}</span>
            </div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
          });

          const imagemHtml = item.imagemUrl
            ? `<img src="${escapeHtml(item.imagemUrl)}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:6px;display:block" />`
            : "";
          const popup = `
            <div style="min-width:190px;max-width:220px">
              ${imagemHtml}
              <strong style="font-size:.86rem">${escapeHtml(item.titulo)}</strong>
              <div style="font-size:.78rem;color:#555;margin-top:2px">${visual.emoji} ${escapeHtml(item.materialNome)} · ${escapeHtml(item.quantidade)}</div>
              <div style="font-size:.74rem;color:#777;margin-top:4px">${escapeHtml(item.endereco)}</div>
            </div>`;
          const marker = L.marker([ponto.lat, ponto.lon], { icon }).addTo(map).bindPopup(popup);
          grupo.push(marker);
          setLocalizadas((n) => n + 1);

          const bounds = L.featureGroup(grupo).getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.25), { maxZoom: 15 });
          }
        }

        setProgresso({ feitos: i + 1, total: items.length });
      }

      if (isMounted) setStatus("pronto");
    }

    init();
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const naoLocalizadas = status === "pronto" ? progresso.total - localizadas : 0;

  // Tipos de material presentes, para a legenda de cores/ícones.
  const legenda = Array.from(
    new Map(
      items.map((it) => {
        const v = materialVisual(it.materialNome);
        return [v.categoria, v] as const;
      })
    ).values()
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: ".75rem",
          flexWrap: "wrap",
          fontSize: ".8rem",
          color: "var(--text-muted)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: ".4rem" }}>
          <span style={{ width: 12, height: 12, borderRadius: "50% 50% 50% 0", background: "#2F8D47", transform: "rotate(-45deg)", display: "inline-block" }} />
          {localizadas} {localizadas === 1 ? "coleta localizada" : "coletas localizadas"} no mapa
        </span>
        {status === "geocodificando" && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: ".45rem" }}>
            <span className="spinner spinner-green" style={{ width: 14, height: 14 }} />
            Localizando {progresso.feitos} de {progresso.total}...
          </span>
        )}
        {status === "pronto" && naoLocalizadas > 0 && (
          <span style={{ color: "var(--text-faint)" }}>
            {naoLocalizadas} {naoLocalizadas === 1 ? "endereço não localizado" : "endereços não localizados"}
          </span>
        )}
      </div>

      {legenda.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem", fontSize: ".72rem" }}>
          {legenda.map((v) => (
            <span
              key={v.categoria}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: ".35rem",
                padding: ".2rem .55rem",
                borderRadius: 999,
                background: "var(--surface-2)",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: v.color, display: "inline-block" }} />
              {v.emoji} {v.categoria}
            </span>
          ))}
        </div>
      )}

      <div style={{ position: "relative", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1.5px solid var(--border)" }}>
        {status === "carregando" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--surface-2)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".75rem", color: "var(--text-faint)" }}>
              <span className="spinner spinner-green" style={{ width: 24, height: 24 }} />
              <span style={{ fontSize: ".8rem" }}>Carregando mapa...</span>
            </div>
          </div>
        )}
        <style>{`
          .leaflet-container { font-family: var(--font); }
          .leaflet-popup-content-wrapper { border-radius: 10px; box-shadow: var(--shadow); }
          .leaflet-popup-content { margin: .6rem .8rem; }
        `}</style>
        <div ref={mapRef} style={{ height: 420, width: "100%" }} />
      </div>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
