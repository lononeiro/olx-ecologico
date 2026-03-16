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
  return (
    <div className="card card-hover anim-fade-up" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>

        {/* Imagem ou placeholder */}
        <div style={{
          width: 56, height: 56, borderRadius: 10, flexShrink: 0, overflow: "hidden",
          background: "var(--surface-2)", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {s.imagens[0] ? (
            <img src={s.imagens[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.5">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap", marginBottom: ".35rem" }}>
            {href ? (
              <Link href={href} style={{
                fontWeight: 600, fontSize: ".95rem", color: "var(--text)",
                textDecoration: "none", transition: "color .15s",
              }}
                onMouseOver={e => e.currentTarget.style.color = "var(--green)"}
                onMouseOut={e => e.currentTarget.style.color = "var(--text)"}
              >
                {s.titulo}
              </Link>
            ) : (
              <span style={{ fontWeight: 600, fontSize: ".95rem", color: "var(--text)" }}>{s.titulo}</span>
            )}
            <SolicitacaoBadge status={s.status} />
            {s.coleta && <ColetaBadge status={s.coleta.status} />}
          </div>

          <div style={{
            display: "flex", flexWrap: "wrap", gap: ".2rem .9rem",
            fontSize: ".82rem", color: "var(--text-muted)",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              {s.material.nome}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              {s.quantidade}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: ".3rem" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              {s.endereco}
            </span>
          </div>

          <p style={{ fontSize: ".75rem", color: "var(--text-faint)", marginTop: ".4rem" }}>
            {new Date(s.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      {actions && (
        <div style={{
          marginTop: "1rem", paddingTop: "1rem",
          borderTop: "1px solid var(--border)",
          display: "flex", gap: ".5rem",
        }}>
          {actions}
        </div>
      )}
    </div>
  );
}