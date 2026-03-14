"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_COLETA_LABEL } from "@/types";

const STATUS_FLUXO: Record<string, string[]> = {
  aceita:     ["a_caminho", "cancelada"],
  a_caminho:  ["em_coleta", "cancelada"],
  em_coleta:  ["concluida", "cancelada"],
};

interface Props {
  coletaId: number;
  statusAtual: string;
}

export function AtualizarStatusColetaForm({ coletaId, statusAtual }: Props) {
  const router = useRouter();
  const [novoStatus, setNovoStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const opcoes = STATUS_FLUXO[statusAtual] ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!novoStatus) return;

    const label = STATUS_COLETA_LABEL[novoStatus];
    if (!confirm(`Confirmar atualização do status para "${label}"?`)) return;

    setLoading(true);
    const res = await fetch(`/api/empresa/coletas/${coletaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });

    setLoading(false);

    if (res.ok) {
      setMensagem(`✅ Status atualizado para "${label}"`);
      router.refresh();
    } else {
      const data = await res.json();
      setMensagem(`Erro: ${data.error}`);
    }
  }

  if (opcoes.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1">
        <label className="block text-xs text-gray-500 mb-1">Novo status</label>
        <select
          className="input-field"
          value={novoStatus}
          onChange={(e) => setNovoStatus(e.target.value)}
          required
        >
          <option value="">Selecione...</option>
          {opcoes.map((s) => (
            <option key={s} value={s}>
              {STATUS_COLETA_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={loading || !novoStatus} className="btn-primary">
        {loading ? "Atualizando..." : "Atualizar"}
      </button>

      {mensagem && (
        <div
          className={`text-sm mt-2 ${
            mensagem.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {mensagem}
        </div>
      )}
    </form>
  );
}
