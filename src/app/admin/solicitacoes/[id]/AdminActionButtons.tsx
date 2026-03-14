"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminActionButtons({ solicitacaoId }: { solicitacaoId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"aprovar" | "rejeitar" | null>(null);
  const [mensagem, setMensagem] = useState("");

  async function handleAction(aprovado: boolean) {
    const acao = aprovado ? "aprovar" : "rejeitar";
    setLoading(acao);

    const res = await fetch(`/api/admin/solicitacoes/${solicitacaoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aprovado }),
    });

    setLoading(null);

    if (res.ok) {
      setMensagem(aprovado ? "✅ Solicitação aprovada com sucesso!" : "❌ Solicitação rejeitada.");
      setTimeout(() => router.push("/admin/solicitacoes"), 1500);
    } else {
      const data = await res.json();
      setMensagem(`Erro: ${data.error}`);
    }
  }

  if (mensagem) {
    return (
      <div className={`rounded-lg p-4 text-sm font-medium ${
        mensagem.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
      }`}>
        {mensagem}
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => handleAction(true)}
        disabled={!!loading}
        className="btn-primary flex-1"
      >
        {loading === "aprovar" ? "Aprovando..." : "✅ Aprovar Solicitação"}
      </button>
      <button
        onClick={() => handleAction(false)}
        disabled={!!loading}
        className="btn-danger flex-1"
      >
        {loading === "rejeitar" ? "Rejeitando..." : "❌ Rejeitar Solicitação"}
      </button>
    </div>
  );
}
