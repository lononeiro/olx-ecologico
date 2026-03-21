"use client";
import { useState } from "react";
import Link from "next/link";
import { SolicitacaoBadge, ColetaBadge } from "@/components/ui/StatusBadge";

interface Props {
  id: number;
  titulo: string;
  descricao?: string;
  quantidade: string;
  endereco: string;
  status: string;
  createdAt: string | Date;
  material: { nome: string };
  imagens: { id: number; url: string }[];
  solicitanteNome?: string;
  coletaStatus?: string;
  coletaId?: number;
  dataAceite?: string | Date;
  dataConclusao?: string | Date;
  actions?: React.ReactNode;
  detailsHref?: string;
}

export function SolicitacaoCardVisual({
  id, titulo, descricao, quantidade, endereco, status,
  createdAt, material, imagens, solicitanteNome,
  coletaStatus, dataAceite, dataConclusao,
  actions, detailsHref,
}: Props) {
  const [imgIndex, setImgIndex] = useState(0);
  const hasImages = imagens.length > 0;
  const currentImg = imagens[imgIndex];

  const date = new Date(createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  });

  function prev(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setImgIndex(i => (i - 1 + imagens.length) % imagens.length);
  }
  function next(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setImgIndex(i => (i + 1) % imagens.length);
  }

  const Wrapper = detailsHref ? Link : "div";
  const wrapperProps = detailsHref ? { href: detailsHref } : {};

  return (
    <div className="card card-hover anim-fade-up" style={{
      padding: 0, overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      {/* ── Image area (polaroid) ── */}
      <div style={{
        position: "relative",
        background: "var(--surface-2)",
        aspectRatio: "16/9",
        overflow: "hidden",
        borderBottom: "1.5px solid var(--border)",
      }}>
        {hasImages ? (
          <>
            <img
              src={currentImg.url}
              alt={titulo}
              style={{
                width: "100%", height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "opacity .2s ease",
              }}
            />
            {/* dark gradient bottom */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,.35) 0%, transparent 50%)",
              pointerEvents: "none",
            }} />
            {/* navigation arrows */}
            {imagens.length > 1 && (
              <>
                <button onClick={prev} style={arrowStyle("left")} aria-label="Anterior">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button onClick={next} style={arrowStyle("right")} aria-label="Próxima">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                {/* dots */}
                <div style={{
                  position: "absolute", bottom: 10, left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex", gap: 5,
                }}>
                  {imagens.map((_, i) => (
                    <button key={i} onClick={e => { e.preventDefault(); e.stopPropagation(); setImgIndex(i); }}
                      style={{
                        width: i === imgIndex ? 16 : 6,
                        height: 6, borderRadius: 99,
                        background: i === imgIndex ? "#fff" : "rgba(255,255,255,.5)",
                        border: "none", cursor: "pointer", padding: 0,
                        transition: "all .2s ease",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
            {/* image count badge */}
            {imagens.length > 1 && (
              <div style={{
                position: "absolute", top: 10, right: 10,
                background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)",
                borderRadius: 99, padding: ".2rem .55rem",
                fontSize: ".7rem", fontWeight: 700, color: "#fff",
                letterSpacing: ".5px",
              }}>
                {imgIndex + 1}/{imagens.length}
              </div>
            )}
          </>
        ) : (
          /* No image placeholder */
          <div style={{
            width: "100%", height: "100%",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: ".5rem", color: "var(--text-faint)",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style={{ fontSize: ".75rem", fontWeight: 500 }}>Sem imagens</span>
          </div>
        )}
      </div>

      {/* ── Card body ── */}
      <div style={{ padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", gap: ".7rem", flex: 1 }}>
        {/* Badges + date row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: ".4rem" }}>
          <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
            <SolicitacaoBadge status={status} />
            {coletaStatus && <ColetaBadge status={coletaStatus} />}
          </div>
          <span style={{ fontSize: ".72rem", color: "var(--text-faint)", whiteSpace: "nowrap" }}>
            #{id} · {date}
          </span>
        </div>

        {/* Title */}
        {detailsHref ? (
          <Link href={detailsHref} style={{
            fontWeight: 700, fontSize: ".98rem",
            color: "var(--text)", textDecoration: "none",
            lineHeight: 1.3, transition: "color .15s",
          }}
            onMouseOver={e => e.currentTarget.style.color = "var(--green)"}
            onMouseOut={e => e.currentTarget.style.color = "var(--text)"}
          >
            {titulo}
          </Link>
        ) : (
          <p style={{ fontWeight: 700, fontSize: ".98rem", color: "var(--text)", lineHeight: 1.3 }}>
            {titulo}
          </p>
        )}

        {/* Description */}
        {descricao && (
          <p style={{
            fontSize: ".82rem", color: "var(--text-muted)",
            lineHeight: 1.55,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {descricao}
          </p>
        )}

        {/* Meta grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: ".35rem .6rem",
          paddingTop: ".6rem",
          borderTop: "1.5px solid var(--border)",
        }}>
          <MetaRow icon={<IconMaterial />} label="Material" value={material.nome} />
          <MetaRow icon={<IconWeight />} label="Quantidade" value={quantidade} />
          <MetaRow icon={<IconPin />} label="Endereco" value={endereco} full />
          {solicitanteNome && (
            <MetaRow icon={<IconUser />} label="Solicitante" value={solicitanteNome} />
          )}
          {dataAceite && (
            <MetaRow icon={<IconClock />} label="Aceita em"
              value={new Date(dataAceite).toLocaleDateString("pt-BR")} />
          )}
          {dataConclusao && (
            <MetaRow icon={<IconCheck />} label="Concluida em"
              value={new Date(dataConclusao).toLocaleDateString("pt-BR")} />
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap", paddingTop: ".5rem" }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ── */
function arrowStyle(side: "left" | "right"): React.CSSProperties {
  return {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    [side]: 10,
    width: 32, height: 32, borderRadius: "50%",
    background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)",
    border: "1.5px solid rgba(255,255,255,.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "background .15s",
    zIndex: 2,
  };
}

function MetaRow({ icon, label, value, full }: { icon: React.ReactNode; label: string; value: string; full?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: ".4rem",
      gridColumn: full ? "1 / -1" : undefined,
    }}>
      <span style={{ color: "var(--text-faint)", flexShrink: 0, marginTop: ".1rem" }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: ".67rem", fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", color: "var(--text-faint)", lineHeight: 1 }}>
          {label}
        </div>
        <div style={{
          fontSize: ".82rem", color: "var(--text)", fontWeight: 500, lineHeight: 1.3, marginTop: ".1rem",
          whiteSpace: full ? "normal" : "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function IconMaterial() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/></svg>;
}
function IconWeight() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
}
function IconPin() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function IconUser() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>;
}
function IconClock() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function IconCheck() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>;
}
