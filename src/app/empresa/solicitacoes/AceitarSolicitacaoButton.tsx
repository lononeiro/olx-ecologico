"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AceitarSolicitacaoButton({ solicitacaoId }: { solicitacaoId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleAceitar() {
    if (!confirm("Deseja aceitar esta solicitação de coleta?")) return;
    setLoading(true); setErro("");
    const res = await fetch("/api/empresa/coletas", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ solicitacaoId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(data.error ?? "Erro ao aceitar solicitação."); return; }
    router.push(`/empresa/coletas/${data.id}`);
    router.refresh();
  }

  return (
    <div>
      {erro && (
        <p style={{ fontSize: ".82rem", color: "var(--red)", marginBottom: ".5rem" }}>{erro}</p>
      )}
      <button onClick={handleAceitar} disabled={loading} className="btn btn-blue">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/>
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M14 2H6"/>
        </svg>
        {loading ? "Aceitando..." : "Aceitar esta coleta"}
      </button>
    </div>
  );
}