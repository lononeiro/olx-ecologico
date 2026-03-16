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
  a_caminho: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M14 2H6"/></svg>,
  em_coleta: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  concluida: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>,
  cancelada: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>,
};

interface Props { coletaId: number; statusAtual: string; }

export function AtualizarStatusColetaForm({ coletaId, statusAtual }: Props) {
  const router = useRouter();
  const [novoStatus, setNovoStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");
  const opcoes = STATUS_FLUXO[statusAtual] ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!novoStatus) return;
    if (!confirm(`Atualizar status para "${STATUS_COLETA_LABEL[novoStatus]}"?`)) return;
    setLoading(true);
    const res = await fetch(`/api/empresa/coletas/${coletaId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    setLoading(false);
    if (res.ok) {
      setResultado(`Status atualizado para "${STATUS_COLETA_LABEL[novoStatus]}".`);
      router.refresh();
    } else {
      const data = await res.json();
      setResultado(data.error ?? "Erro ao atualizar.");
    }
  }

  if (opcoes.length === 0) return null;

  return (
    <div>
      {resultado && (
        <div style={{
          padding: ".75rem 1rem", borderRadius: "var(--radius-sm)",
          background: "rgba(45,138,62,.08)", border: "1px solid rgba(45,138,62,.2)",
          color: "var(--green-dark)", fontSize: ".85rem", marginBottom: "1rem",
        }}>
          {resultado}
        </div>
      )}

      {/* Status option cards */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: ".6rem", marginBottom: "1rem" }}>
          {opcoes.map(s => (
            <button key={s} type="button"
              onClick={() => setNovoStatus(s)}
              style={{
                padding: ".55rem 1rem", borderRadius: "var(--radius-sm)",
                border: `1.5px solid ${novoStatus === s ? "var(--green)" : "var(--border)"}`,
                background: novoStatus === s ? "rgba(45,138,62,.07)" : "var(--surface)",
                color: novoStatus === s ? "var(--green-dark)" : "var(--text-muted)",
                fontFamily: "var(--font)", fontSize: ".85rem", fontWeight: novoStatus === s ? 600 : 400,
                cursor: "pointer", transition: "var(--transition)",
                display: "flex", alignItems: "center", gap: ".4rem",
              }}>
              {STATUS_ICONS[s]}
              {STATUS_COLETA_LABEL[s]}
            </button>
          ))}
        </div>
        <button type="submit" disabled={loading || !novoStatus} className="btn btn-primary">
          {loading ? "Atualizando..." : "Confirmar atualização"}
        </button>
      </form>
    </div>
  );
}