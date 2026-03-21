"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_COLETA_LABEL } from "@/types";

const STATUS_FLUXO: Record<string, string[]> = {
  aceita:    ["a_caminho", "cancelada"],
  a_caminho: ["em_coleta", "cancelada"],
  em_coleta: ["concluida", "cancelada"],
};

const STATUS_ICONS: Record<string, JSX.Element> = {
  a_caminho: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>,
  em_coleta: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  concluida: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>,
  cancelada: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>,
};

const STATUS_STYLE: Record<string, { border: string; bg: string; color: string; activeBg: string; activeBorder: string; activeColor: string }> = {
  a_caminho: {
    border: "var(--border)", bg: "var(--surface)", color: "var(--text-muted)",
    activeBorder: "var(--yellow)", activeBg: "var(--yellow-light)", activeColor: "var(--yellow)",
  },
  em_coleta: {
    border: "var(--border)", bg: "var(--surface)", color: "var(--text-muted)",
    activeBorder: "var(--blue)", activeBg: "var(--blue-light)", activeColor: "var(--blue)",
  },
  concluida: {
    border: "var(--border)", bg: "var(--surface)", color: "var(--text-muted)",
    activeBorder: "var(--green)", activeBg: "var(--surface-2)", activeColor: "var(--green)",
  },
  cancelada: {
    border: "var(--border)", bg: "var(--surface)", color: "var(--text-muted)",
    activeBorder: "var(--red)", activeBg: "var(--red-light)", activeColor: "var(--red)",
  },
};

interface Props { coletaId: number; statusAtual: string; }

export function AtualizarStatusColetaForm({ coletaId, statusAtual }: Props) {
  const router = useRouter();
  const [novoStatus, setNovoStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);
  const opcoes = STATUS_FLUXO[statusAtual] ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!novoStatus) return;
    if (!confirm(`Atualizar status para "${STATUS_COLETA_LABEL[novoStatus]}"?`)) return;
    setLoading(true);
    setResultado(null);
    const res = await fetch(`/api/empresa/coletas/${coletaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    setLoading(false);
    if (res.ok) {
      setResultado({ ok: true, msg: `Status atualizado para "${STATUS_COLETA_LABEL[novoStatus]}".` });
      setNovoStatus("");
      router.refresh();
    } else {
      const data = await res.json();
      setResultado({ ok: false, msg: data.error ?? "Erro ao atualizar." });
    }
  }

  if (opcoes.length === 0) return null;

  return (
    <div>
      {resultado && (
        <div style={{
          padding: ".75rem 1rem",
          borderRadius: "var(--radius-sm)",
          background: resultado.ok ? "rgba(30,122,50,.08)" : "var(--red-light)",
          border: `1px solid ${resultado.ok ? "rgba(30,122,50,.2)" : "rgba(184,50,40,.2)"}`,
          color: resultado.ok ? "var(--green-dark)" : "var(--red)",
          fontSize: ".85rem",
          marginBottom: "1rem",
          display: "flex", alignItems: "center", gap: ".5rem",
        }}>
          {resultado.ok
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          }
          {resultado.msg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Status option cards */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem", marginBottom: "1rem" }}>
          {opcoes.map(s => {
            const style = STATUS_STYLE[s] ?? STATUS_STYLE.cancelada;
            const active = novoStatus === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setNovoStatus(s)}
                style={{
                  padding: ".55rem 1rem",
                  borderRadius: "var(--radius-sm)",
                  border: `1.5px solid ${active ? style.activeBorder : style.border}`,
                  background: active ? style.activeBg : style.bg,
                  color: active ? style.activeColor : style.color,
                  fontFamily: "var(--font)",
                  fontSize: ".85rem",
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  transition: "var(--transition)",
                  display: "flex", alignItems: "center", gap: ".4rem",
                }}
              >
                {STATUS_ICONS[s]}
                {STATUS_COLETA_LABEL[s]}
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={loading || !novoStatus}
          className="btn btn-primary"
          style={{ minWidth: 180 }}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 15, height: 15 }} />
              Atualizando...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              Confirmar atualizacao
            </>
          )}
        </button>
      </form>
    </div>
  );
}