"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  endereco: string;
  /**
   * Quando true, o mapa "vaza" até a borda do card que o envolve,
   * cancelando o padding lateral de 1rem herdado do container pai e
   * removendo a borda/raio próprios do mapa. Evita o "quadro branco duplo"
   * (fundo do card + padding + borda do próprio mapa) — mais visível no
   * tema claro, onde o contraste com as tiles coloridas do OSM é maior.
   */
  bleed?: boolean;
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

  // Ex.: buildAddressString() gera "..., CEP 01305-000" — a palavra "CEP"
  // (não só os dígitos) precisa ser removida, senão o Nominatim não acha
  // nada e a busca cai pro fallback de rua+número sem cidade, que pode
  // resolver pra outro município com rua de mesmo nome.
  const semCep = endereco.replace(/,?\s*(CEP\s*)?\d{5}-?\d{3}/i, "").trim();

  // Só endereço completo e sem CEP. Cair pra "rua + número" (sem cidade) pode
  // casar com uma rua de mesmo nome em outro município, e "só cidade + estado"
  // é vago demais pra ajudar quem vai buscar o material — nesses casos é
  // melhor assumir "não encontrado" e deixar o usuário abrir no Google Maps.
  const tentativas = [endereco, semCep].filter((v, i, arr) => v && arr.indexOf(v) === i);

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

export function MapaEndereco({ endereco, bleed = false }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const removeWheelRef = useRef<(() => void) | null>(null);
  const dicaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"carregando" | "ok" | "aproximado" | "erro">("carregando");
  const [dicaZoom, setDicaZoom] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      // 1. Injeta o CSS do Leaflet no <head> se ainda não estiver lá
      //    Sem isso as tiles ficam fora de posição (blocos brancos)
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id   = "leaflet-css";
        link.rel  = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
        // Aguarda o CSS carregar antes de inicializar
        await new Promise<void>(resolve => {
          link.onload = () => resolve();
          link.onerror = () => resolve(); // continua mesmo se falhar
          setTimeout(resolve, 1500);      // timeout de segurança
        });
      }

      // 2. Carrega Leaflet dinamicamente
      const L = (await import("leaflet" as any)).default;
      if (!isMounted || !mapRef.current) return;

      // 3. Corrige ícones padrão do Leaflet (problema conhecido com bundlers)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // 4. Evita re-inicializar se já existir instância
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

      // 5. Força recálculo de tamanho (necessário quando o mapa está dentro de modal)
      setTimeout(() => { if (isMounted) map.invalidateSize(); }, 100);
      setTimeout(() => { if (isMounted) map.invalidateSize(); }, 400);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Zoom só com Ctrl + scroll: sem Ctrl a página (ou o modal) rola normalmente
      // e mostramos uma dica. Com Ctrl, dá/tira zoom em torno do ponto sob o cursor.
      const container = mapRef.current;
      const onWheel = (e: WheelEvent) => {
        if (!e.ctrlKey) {
          setDicaZoom(true);
          if (dicaTimeoutRef.current) clearTimeout(dicaTimeoutRef.current);
          dicaTimeoutRef.current = setTimeout(() => setDicaZoom(false), 1400);
          return;
        }
        e.preventDefault();
        setDicaZoom(false);
        const rect = container.getBoundingClientRect();
        const point = L.point(e.clientX - rect.left, e.clientY - rect.top);
        const latlng = map.containerPointToLatLng(point);
        map.setZoomAround(latlng, map.getZoom() + (e.deltaY < 0 ? 1 : -1));
      };
      container.addEventListener("wheel", onWheel, { passive: false });
      removeWheelRef.current = () => container.removeEventListener("wheel", onWheel);

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
    return () => {
      isMounted = false;
      removeWheelRef.current?.();
      removeWheelRef.current = null;
      if (dicaTimeoutRef.current) clearTimeout(dicaTimeoutRef.current);
    };
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
        <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
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
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ justifyContent: "center" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            Abrir no Google Maps
          </a>
        </div>
      )}

      {/* Mapa */}
      {status !== "erro" && (
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            ...(bleed
              ? { margin: "0 -1rem" }
              : { borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)" }),
          }}
        >
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
            .leaflet-container { font-family: var(--font); background: var(--surface-2); }
            .leaflet-popup-content-wrapper { border-radius: 10px; box-shadow: var(--shadow); }
            .leaflet-popup-content { font-size: .82rem; font-weight: 600; color: var(--text); margin: .5rem .75rem; }

            /* No tema escuro as tiles claras do OSM viravam um "quadro branco".
               Inverte/reajusta as tiles para um mapa escuro e adapta os
               controles, popup e atribuição do Leaflet ao tema. */
            html.dark .leaflet-tile {
              filter: invert(1) hue-rotate(180deg) brightness(.95) contrast(.9);
            }
            html.dark .leaflet-container { background: var(--surface-3); }
            html.dark .leaflet-popup-content-wrapper,
            html.dark .leaflet-popup-tip {
              background: var(--surface);
              color: var(--text);
            }
            html.dark .leaflet-bar a,
            html.dark .leaflet-bar a:hover {
              background: var(--surface);
              color: var(--text);
              border-color: var(--border);
            }
            html.dark .leaflet-control-attribution {
              background: rgba(12,19,15,.75) !important;
              color: var(--text-muted);
            }
            html.dark .leaflet-control-attribution a { color: var(--green); }
          `}</style>
          <div ref={mapRef} style={{ height: 340, width: "100%" }} />
          {dicaZoom && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(15,23,42,.35)",
                backdropFilter: "blur(1px)",
                pointerEvents: "none",
                transition: "opacity .2s ease",
              }}
            >
              <span
                style={{
                  background: "rgba(15,23,42,.82)",
                  color: "#fff",
                  fontSize: ".85rem",
                  fontWeight: 600,
                  padding: ".55rem .95rem",
                  borderRadius: 999,
                  boxShadow: "0 4px 16px rgba(0,0,0,.3)",
                }}
              >
                Use Ctrl + scroll para dar zoom
              </span>
            </div>
          )}
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