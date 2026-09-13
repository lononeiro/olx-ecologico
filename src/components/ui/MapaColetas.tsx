"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMapaFocus } from "./MapaFocusContext";

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

/** Conteúdo interno (paths) de ícones de traço 24x24 por categoria de material. */
const ICONES = {
  papel:
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/>',
  plastico:
    '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
  metal:
    '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14a8 3 0 0 0 16 0V5"/><path d="M4 12a8 3 0 0 0 16 0"/>',
  vidro:
    '<path d="M8 22h8"/><path d="M12 15v7"/><path d="M12 15a5 5 0 0 0 5-5c0-2-.5-4-5-8-4.5 4-5 6-5 8a5 5 0 0 0 5 5Z"/>',
  eletronico:
    '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>',
  organico:
    '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
  oleo:
    '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 4.9 7 2.05C6.71 4.9 5.85 6.13 4.71 7.06 3.57 8 3 9.1 3 10.26c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A11 11 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a7 7 0 0 1-11.91 4.97"/>',
  textil:
    '<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  madeira:
    '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>',
  borracha:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
  recicla:
    '<path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/><path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/><path d="m13.378 9.633 4.096 1.098 1.097-4.096"/>',
} as const;

/** Monta um SVG de traço a partir do conteúdo interno de um ícone. */
function iconSvg(inner: string, color: string, size: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

/** Cor + ícone do marcador por tipo de material reciclável. */
function materialVisual(nome: string): { categoria: string; color: string; icon: string } {
  const v = (nome ?? "").toLowerCase();
  if (v.includes("papel") || v.includes("papelao") || v.includes("papelão") || v.includes("cartao"))
    return { categoria: "Papel / Papelão", color: "#A3A05B", icon: ICONES.papel };
  if (v.includes("plast") || v.includes("pet"))
    return { categoria: "Plástico", color: "#3B82F6", icon: ICONES.plastico };
  if (v.includes("metal") || v.includes("alumin") || v.includes("lata"))
    return { categoria: "Metal / Alumínio", color: "#6B7280", icon: ICONES.metal };
  if (v.includes("vidro"))
    return { categoria: "Vidro", color: "#10B981", icon: ICONES.vidro };
  if (v.includes("eletr") || v.includes("e-lixo"))
    return { categoria: "Eletrônico", color: "#8B5CF6", icon: ICONES.eletronico };
  if (v.includes("organ") || v.includes("compost"))
    return { categoria: "Orgânico", color: "#84CC16", icon: ICONES.organico };
  if (v.includes("oleo") || v.includes("óleo"))
    return { categoria: "Óleo", color: "#D97706", icon: ICONES.oleo };
  if (v.includes("text") || v.includes("roupa") || v.includes("tecido"))
    return { categoria: "Têxtil", color: "#EC4899", icon: ICONES.textil };
  if (v.includes("madeira"))
    return { categoria: "Madeira", color: "#92400E", icon: ICONES.madeira };
  if (v.includes("borracha") || v.includes("pneu"))
    return { categoria: "Borracha / Pneu", color: "#334155", icon: ICONES.borracha };
  return { categoria: "Outro", color: "#2F8D47", icon: ICONES.recicla };
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

/**
 * Localização do dispositivo (mesmo comportamento do mobile). Resolve para null
 * se o usuário negar a permissão ou a busca demorar demais, sem travar o mapa.
 */
function obterLocalizacao(): Promise<GeoPonto | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);

    let feito = false;
    const finalizar = (v: GeoPonto | null) => {
      if (feito) return;
      feito = true;
      resolve(v);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => finalizar({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => finalizar(null),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 }
    );
    // Rede/GPS lentos não devem travar o mapa: cai no enquadramento padrão.
    setTimeout(() => finalizar(null), 6000);
  });
}

export function MapaColetas({ items }: { items: MapaColetaItem[] }) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<number, any>>({});
  const removeWheelRef = useRef<(() => void) | null>(null);
  const dicaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focus = useMapaFocus();
  const [status, setStatus] = useState<"carregando" | "geocodificando" | "pronto">("carregando");
  const [progresso, setProgresso] = useState({ feitos: 0, total: items.length });
  const [localizadas, setLocalizadas] = useState(0);
  const [dicaZoom, setDicaZoom] = useState(false);

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

      // Centraliza na localização do dispositivo (igual ao mobile); sem ela,
      // parte do Brasil e o fitBounds ajusta assim que houver marcadores.
      const userLoc = await obterLocalizacao();
      if (!isMounted || !mapRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(
        userLoc ? [userLoc.lat, userLoc.lon] : [-14.235, -51.925],
        userLoc ? 13 : 4
      );
      mapInstanceRef.current = map;
      setTimeout(() => { if (isMounted) map.invalidateSize(); }, 120);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Zoom só com Ctrl + scroll: sem Ctrl a página rola normalmente e mostramos
      // uma dica. Com Ctrl, dá/tira zoom em torno do ponto sob o cursor.
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

      // Liga os botões de ação do popup (HTML) às ações React quando ele abre.
      map.on("popupopen", (e: any) => {
        const node: HTMLElement | null = e.popup?.getElement?.() ?? null;
        node?.querySelectorAll<HTMLElement>("[data-popup-acao]").forEach((btn) => {
          btn.onclick = (ev) => {
            ev.preventDefault();
            const id = Number(btn.getAttribute("data-popup-id"));
            const acao = btn.getAttribute("data-popup-acao");
            if (!id) return;
            if (acao === "mensagem") {
              router.push(`/empresa/solicitacoes/${id}/conversa`);
            } else if (acao === "aceitar") {
              // Reaproveita o modal de aceitação já renderizado no card abaixo.
              document.querySelector<HTMLElement>(`[data-aceitar-id="${id}"] .btn-blue`)?.click();
            } else if (acao === "detalhes") {
              const card = document.getElementById(`coleta-card-${id}`);
              if (!card) return;
              card.scrollIntoView({ behavior: "smooth", block: "center" });
              card.classList.add("coleta-card-destaque");
              setTimeout(() => card.classList.remove("coleta-card-destaque"), 1800);
            }
          };
        });
      });

      if (userLoc) {
        L.circleMarker([userLoc.lat, userLoc.lon], {
          radius: 8,
          color: "#1B4332",
          weight: 3,
          fillColor: "#2D6A4F",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup("Você está aqui");
      }

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
          // Marcador em gota com a cor e o ícone do tipo de material.
          const icon = L.divIcon({
            className: "",
            html: `<div style="position:relative;width:34px;height:34px">
              <div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:${visual.color};border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>
              <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;line-height:1">${iconSvg(visual.icon, "#fff", 16)}</span>
            </div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
          });

          const imagemHtml = item.imagemUrl
            ? `<img src="${escapeHtml(item.imagemUrl)}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:6px;display:block" />`
            : "";
          const btnBase =
            "display:flex;align-items:center;justify-content:center;gap:5px;width:100%;padding:7px 10px;border-radius:8px;font-size:.78rem;font-weight:700;cursor:pointer;line-height:1;";
          const btnSecundario = `${btnBase}border:1.5px solid #d9e0d5;background:#fff;color:#2b3a2e;`;
          const btnPrimario = `${btnBase}border:none;background:#1D6FA8;color:#fff;`;
          const iconOlho =
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
          const iconCheck =
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg>';
          const iconChat =
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
          const popup = `
            <div style="min-width:190px;max-width:220px">
              ${imagemHtml}
              <strong style="font-size:.86rem">${escapeHtml(item.titulo)}</strong>
              <div style="font-size:.78rem;color:#555;margin-top:2px;display:flex;align-items:center;gap:4px"><span style="display:inline-flex">${iconSvg(visual.icon, visual.color, 13)}</span>${escapeHtml(item.materialNome)} · ${escapeHtml(item.quantidade)}</div>
              <div style="font-size:.74rem;color:#777;margin-top:4px">${escapeHtml(item.endereco)}</div>
              <div style="display:flex;flex-direction:column;gap:6px;margin-top:10px">
                <button type="button" data-popup-acao="detalhes" data-popup-id="${item.id}" style="${btnSecundario}">${iconOlho} Ver detalhes</button>
                <button type="button" data-popup-acao="aceitar" data-popup-id="${item.id}" style="${btnPrimario}">${iconCheck} Aceitar coleta</button>
                <button type="button" data-popup-acao="mensagem" data-popup-id="${item.id}" style="${btnSecundario}">${iconChat} Mandar mensagem</button>
              </div>
            </div>`;
          const marker = L.marker([ponto.lat, ponto.lon], { icon }).addTo(map).bindPopup(popup);
          markersRef.current[item.id] = marker;
          grupo.push(marker);
          setLocalizadas((n) => n + 1);

          // Com localização do usuário, mantém o mapa centrado nele; sem ela,
          // ajusta o enquadramento aos marcadores conforme vão surgindo.
          if (!userLoc) {
            const bounds = L.featureGroup(grupo).getBounds();
            if (bounds.isValid()) {
              map.fitBounds(bounds.pad(0.25), { maxZoom: 15 });
            }
          }
        }

        setProgresso({ feitos: i + 1, total: items.length });
      }

      if (isMounted) setStatus("pronto");
    }

    init();
    return () => {
      isMounted = false;
      markersRef.current = {};
      removeWheelRef.current?.();
      removeWheelRef.current = null;
      if (dicaTimeoutRef.current) clearTimeout(dicaTimeoutRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Mostrar no mapa" (cards abaixo): centraliza no marcador e abre o popup.
  useEffect(() => {
    if (!focus?.target) return;
    const map = mapInstanceRef.current;
    const marker = markersRef.current[focus.target.id];
    if (!map || !marker) return;

    map.setView(marker.getLatLng(), Math.max(map.getZoom(), 15), { animate: true });
    marker.openPopup();
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focus?.target]);

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
              <span
                style={{ display: "inline-flex", color: v.color }}
                dangerouslySetInnerHTML={{ __html: iconSvg(v.icon, v.color, 13) }}
              />
              {v.categoria}
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
