"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Portal } from "@/components/ui/Portal";

interface Props {
  solicitacaoId: number;
  statusSolicitacao: string;
  statusColeta?: string | null;
}

export function CancelarSolicitacaoButton({ solicitacaoId, statusSolicitacao, statusColeta }: Props) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const naoPermitido =
    statusSolicitacao === "rejeitada" ||
    statusSolicitacao === "cancelada" ||
    statusColeta === "em_coleta" ||
    statusColeta === "concluida" ||
    statusColeta === "cancelada";

  if (naoPermitido) return null;

  const temColetaAtiva = statusColeta === "aceita" || statusColeta === "a_caminho";

  async function handleCancelar() {
    setLoading(true);
    setErro("");

    const res = await fetch(`/api/solicitacoes/${solicitacaoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancelar" }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErro(data.error ?? "Erro ao cancelar solicitação.");
      return;
    }

    setModalAberto(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalAberto(true)}
        className="btn btn-ghost"
        style={{ color: "var(--red, #ef4444)", borderColor: "var(--red, #ef4444)", fontSize: ".82rem" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
        Cancelar solicitação
      </button>

      {modalAberto && (
        <Portal>
          <style>{`
            .cancelar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
            .cancelar-modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 1.75rem; max-width: 440px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,.25); }
          `}</style>
          <div className="cancelar-overlay" onClick={() => !loading && setModalAberto(false)}>
            <div className="cancelar-modal" onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: ".5rem" }}>
                {temColetaAtiva ? "Cancelar com coleta em andamento" : "Cancelar solicitação"}
              </h2>

              {temColetaAtiva && (
                <div style={{
                  padding: ".75rem 1rem",
                  borderRadius: 12,
                  background: "rgba(234,179,8,.1)",
                  border: "1px solid rgba(234,179,8,.35)",
                  marginBottom: ".75rem",
                  fontSize: ".84rem",
                  color: "var(--text)",
                  lineHeight: 1.55,
                }}>
                  <strong>Uma empresa já aceitou esta solicitação.</strong> Ao cancelar, a coleta também será cancelada.
                </div>
              )}

              <p style={{ fontSize: ".875rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "1.25rem" }}>
                {temColetaAtiva
                  ? "Esta ação é irreversível. Confirme apenas se necessário."
                  : "A solicitação será removida da fila e nenhuma empresa poderá aceitá-la."}
              </p>

              {erro && (
                <p style={{ fontSize: ".82rem", color: "var(--red, #ef4444)", marginBottom: ".75rem" }}>{erro}</p>
              )}

              <div style={{ display: "flex", gap: ".65rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setModalAberto(false)}
                  disabled={loading}
                  style={{ fontSize: ".85rem" }}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleCancelar}
                  disabled={loading}
                  className="btn"
                  style={{
                    fontSize: ".85rem",
                    background: "var(--red, #ef4444)",
                    color: "#fff",
                    border: "none",
                  }}
                >
                  {loading ? "Cancelando..." : temColetaAtiva ? "Confirmar cancelamento" : "Sim, cancelar"}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}
