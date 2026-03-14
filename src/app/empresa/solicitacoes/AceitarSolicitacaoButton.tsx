"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AceitarSolicitacaoButton({ solicitacaoId }: { solicitacaoId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleAceitar() {
    if (!confirm("Deseja aceitar esta solicitação de coleta?")) return;
    setLoading(true);
    setErro("");

    const res = await fetch("/api/empresa/coletas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ solicitacaoId }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErro(data.error ?? "Erro ao aceitar solicitação.");
      return;
    }

    router.push(`/empresa/coletas/${data.id}`);
    router.refresh();
  }

  return (
    <div>
      {erro && (
        <p className="text-red-600 text-sm mb-2">{erro}</p>
      )}
      <button
        onClick={handleAceitar}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? "Aceitando..." : "🚛 Aceitar Coleta"}
      </button>
    </div>
  );
}
