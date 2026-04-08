"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminActionButtons({ solicitacaoId }: { solicitacaoId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"aprovar" | "rejeitar" | null>(null);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleAction(aprovado: boolean) {
    const acao = aprovado ? "aprovar" : "rejeitar";
    if (!confirm(aprovado ? "Aprovar esta solicitação?" : "Rejeitar esta solicitação?")) return;

    setLoading(acao);

    const res = await fetch(`/api/admin/solicitacoes/${solicitacaoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aprovado }),
    });

    setLoading(null);

    if (res.ok) {
      setResultado({
        ok: true,
        msg: aprovado ? "Solicitação aprovada com sucesso." : "Solicitação rejeitada.",
      });
      setTimeout(() => router.push("/admin/solicitacoes"), 1800);
    } else {
      const data = await res.json();
      setResultado({ ok: false, msg: data.error ?? "Erro ao processar." });
    }
  }

  if (resultado) {
    return (
      <div
        style={{
          padding: "1rem 1.25rem",
          borderRadius: "var(--radius-sm)",
          background: resultado.ok ? "rgba(45,138,62,.08)" : "var(--red-light)",
          border: `1px solid ${resultado.ok ? "rgba(45,138,62,.2)" : "rgba(192,57,43,.2)"}`,
          color: resultado.ok ? "var(--green-dark)" : "var(--red)",
          fontSize: ".9rem",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: ".5rem",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          {resultado.ok ? (
            <path d="M20 6 9 17l-5-5" />
          ) : (
            <>
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </>
          )}
        </svg>
        {resultado.msg}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
      <button onClick={() => handleAction(true)} disabled={!!loading} className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        {loading === "aprovar" ? "Aprovando..." : "Aprovar solicitação"}
      </button>
      <button onClick={() => handleAction(false)} disabled={!!loading} className="btn btn-danger" style={{ flex: 1, justifyContent: "center" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" x2="6" y1="6" y2="18" />
          <line x1="6" x2="18" y1="6" y2="18" />
        </svg>
        {loading === "rejeitar" ? "Rejeitando..." : "Rejeitar solicitação"}
      </button>
    </div>
  );
}
