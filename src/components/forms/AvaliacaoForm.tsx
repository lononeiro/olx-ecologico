"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RatingStars } from "@/components/ui/RatingStars";

interface AvaliacaoFormProps {
  coletaId: number;
  avaliacaoExistente?: { nota: number; comentario?: string | null } | null;
}

export function AvaliacaoForm({ coletaId, avaliacaoExistente }: AvaliacaoFormProps) {
  const router = useRouter();
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);

  if (avaliacaoExistente || enviado) {
    const n = avaliacaoExistente?.nota ?? nota;
    const c = avaliacaoExistente?.comentario ?? comentario;
    return (
      <div>
        <RatingStars mode="display" value={n} size={22} />
        {c && (
          <p style={{ marginTop: ".6rem", fontSize: ".875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            {c}
          </p>
        )}
        <p style={{ marginTop: ".75rem", fontSize: ".78rem", color: "var(--text-faint)", fontStyle: "italic" }}>
          Você já avaliou esta coleta.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nota === 0) {
      setErro("Selecione uma nota de 1 a 5.");
      return;
    }
    setLoading(true);
    setErro("");

    const res = await fetch("/api/avaliacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coletaId, nota, comentario: comentario || undefined }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErro(data.error ?? "Erro ao enviar avaliação.");
      return;
    }

    setEnviado(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <RatingStars mode="input" value={nota} onChange={setNota} size={28} />

      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        placeholder="Comentário opcional..."
        rows={3}
        maxLength={500}
        className="input-field"
        style={{ marginTop: ".75rem", width: "100%", resize: "vertical", fontSize: ".875rem" }}
      />

      {erro && (
        <p style={{ marginTop: ".5rem", fontSize: ".82rem", color: "var(--red, #ef4444)" }}>{erro}</p>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        style={{ marginTop: ".75rem" }}
      >
        {loading ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
