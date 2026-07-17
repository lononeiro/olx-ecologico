"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminActionButtons({ solicitacaoId }: { solicitacaoId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleRemover() {
    if (!confirm("Remover esta solicitação? Ela deixará de ficar visível para as empresas.")) return;

    setLoading(true);

    const res = await fetch(`/api/admin/solicitacoes/${solicitacaoId}`, {
      method: "DELETE",
    });

    setLoading(false);

    if (res.ok) {
      setResultado({ ok: true, msg: "Solicitação removida com sucesso." });
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
    <button onClick={handleRemover} disabled={loading} className="btn btn-danger" style={{ width: "100%", justifyContent: "center" }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" x2="6" y1="6" y2="18" />
        <line x1="6" x2="18" y1="6" y2="18" />
      </svg>
      {loading ? "Removendo..." : "Remover solicitação"}
    </button>
  );
}
