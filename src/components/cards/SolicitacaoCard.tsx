"use client";
import Link from "next/link";
import { SolicitacaoBadge, ColetaBadge } from "@/components/ui/StatusBadge";

interface Props {
  solicitacao: {
    id: number;
    titulo: string;
    quantidade: string;
    endereco: string;
    status: string;
    createdAt: string | Date;
    material: { nome: string };
    imagens: { id: number; url: string }[];
    coleta?: { status: string } | null;
  };
  href?: string;
  actions?: React.ReactNode;
}

export function SolicitacaoCard({ solicitacao: s, href, actions }: Props) {
  const date = new Date(s.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric"
  });

  return (
    <div className="card card-hover" style={{ padding: "1.1rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>

        {/* Thumbnail */}
        <div style={{
          width: 52, height: 52, borderRadius: 12, flexShrink: 0, overflow: "hidden",
          background: "var(--surface-2)", border: "1.5px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {s.imagens[0] ? (
            <img src={s.imagens[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5">
              <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
              <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/>
              <path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/>
              <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/>
              <path d="m13.378 9.633 4.096 1.098 1.097-4.096"/>
            </svg>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title + badges */}
          <div style={{
            display: "flex", alignItems: "center", flexWrap: "wrap",
            gap: ".4rem", marginBottom: ".45rem",
          }}>
            {href ? (
              <Link href={href} style={{
                fontWeight: 700, fontSize: ".92rem", color: "var(--text)",
                textDecoration: "none", transition: "color .15s",
                lineHeight: 1.25,
              }}
                onMouseOver={e => e.currentTarget.style.color = "var(--green)"}
                onMouseOut={e => e.currentTarget.style.color = "var(--text)"}
              >
                {s.titulo}
              </Link>
            ) : (
              <span style={{ fontWeight: 700, fontSize: ".92rem", color: "var(--text)", lineHeight: 1.25 }}>
                {s.titulo}
              </span>
            )}
            <SolicitacaoBadge status={s.status} />
            {s.coleta && <ColetaBadge status={s.coleta.status} />}
          </div>

          {/* Meta */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: ".2rem .8rem",
            fontSize: ".78rem", color: "var(--text-muted)",
          }}>
            <MetaItem icon={
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
                <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/>
              </svg>
            } label={s.material.nome} />
            <MetaItem icon={
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            } label={s.quantidade} />
            <MetaItem icon={
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            } label={s.endereco} />
          </div>

          <p style={{ fontSize: ".72rem", color: "var(--text-faint)", marginTop: ".35rem" }}>
            {date}
          </p>
        </div>

        {/* Arrow hint */}
        {href && (
          <div style={{
            flexShrink: 0, color: "var(--text-faint)",
            alignSelf: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        )}
      </div>

      {actions && (
        <div style={{
          marginTop: ".9rem", paddingTop: ".9rem",
          borderTop: "1.5px solid var(--border)",
          display: "flex", gap: ".5rem", flexWrap: "wrap",
        }}>
          {actions}
        </div>
      )}
    </div>
  );
}

function MetaItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
      <span style={{ color: "var(--text-faint)", flexShrink: 0 }}>{icon}</span>
      {label}
    </span>
  );
}
