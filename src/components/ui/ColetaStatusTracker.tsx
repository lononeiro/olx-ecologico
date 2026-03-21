"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_COLETA_LABEL } from "@/types";

const STEPS = [
  {
    key: "aceita",
    label: "Aceita",
    desc: "Empresa confirmou a coleta",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>,
  },
  {
    key: "a_caminho",
    label: "A Caminho",
    desc: "Equipe a caminho do endereco",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>,
  },
  {
    key: "em_coleta",
    label: "Em Coleta",
    desc: "Material sendo coletado agora",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 12 20 22 4 22 4 12"/><rect width="20" height="5" x="2" y="7"/><line x1="12" x2="12" y1="22" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  },
  {
    key: "concluida",
    label: "Concluida",
    desc: "Coleta finalizada com sucesso",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  },
];

const FLUXO: Record<string, string[]> = {
  aceita:    ["a_caminho", "cancelada"],
  a_caminho: ["em_coleta", "cancelada"],
  em_coleta: ["concluida", "cancelada"],
};

interface Props {
  coletaId: number;
  statusAtual: string;
  isEmpresa?: boolean;
}

export function ColetaStatusTracker({ coletaId, statusAtual, isEmpresa }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; msg: string } | null>(null);
  // Para a etapa de conclusão — input do código
  const [codigoInput, setCodigoInput] = useState("");
  const [codigoErro, setCodigoErro] = useState("");

  const isCancelada = statusAtual === "cancelada";
  const isConcluida = statusAtual === "concluida";
  const isDone = isCancelada || isConcluida;

  const currentIdx = STEPS.findIndex(s => s.key === statusAtual);
  const proximosStatus = FLUXO[statusAtual] ?? [];
  const proximoPrincipal = proximosStatus.find(s => s !== "cancelada");
  const proximoEhConclusao = proximoPrincipal === "concluida";

  async function avancar() {
    if (!proximoPrincipal) return;

    // Se for concluir, valida o código antes de enviar
    if (proximoEhConclusao) {
      if (!codigoInput.trim()) {
        setCodigoErro("Insira o codigo de confirmacao do usuario.");
        return;
      }
      setCodigoErro("");
    } else {
      if (!confirm(`Atualizar para "${STATUS_COLETA_LABEL[proximoPrincipal]}"?`)) return;
    }

    setLoading(true);
    setResultado(null);

    const body: Record<string, string> = { status: proximoPrincipal };
    if (proximoEhConclusao) body.codigoConfirmacao = codigoInput.trim().toUpperCase();

    const res = await fetch(`/api/empresa/coletas/${coletaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);

    if (res.ok) {
      setResultado({ ok: true, msg: `Status atualizado para "${STATUS_COLETA_LABEL[proximoPrincipal]}".` });
      setCodigoInput("");
      router.refresh();
    } else {
      const data = await res.json();
      const msg = data.error ?? "Erro ao atualizar.";
      setResultado({ ok: false, msg });
      if (proximoEhConclusao) setCodigoErro(msg);
    }
  }

  async function cancelar() {
    if (!confirm("Tem certeza que deseja cancelar esta coleta?")) return;
    setLoading(true);
    setResultado(null);
    const res = await fetch(`/api/empresa/coletas/${coletaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelada" }),
    });
    setLoading(false);
    if (res.ok) {
      setResultado({ ok: true, msg: "Coleta cancelada." });
      router.refresh();
    } else {
      const data = await res.json();
      setResultado({ ok: false, msg: data.error ?? "Erro ao cancelar." });
    }
  }

  return (
    <div>
      {/* ── Trilha ── */}
      {isCancelada ? (
        <div style={{
          display: "flex", alignItems: "center", gap: ".75rem",
          padding: "1rem 1.25rem",
          background: "var(--red-light)", borderRadius: "var(--radius-sm)",
          border: "1.5px solid rgba(184,50,40,.18)",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, color: "var(--red)", fontSize: ".9rem" }}>Coleta cancelada</p>
            <p style={{ fontSize: ".78rem", color: "var(--red-mid)", marginTop: ".1rem" }}>
              Esta coleta foi encerrada antes da conclusao.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          {/* Linha de fundo */}
          <div style={{
            position: "absolute", top: 18, left: 18, right: 18,
            height: 2, background: "var(--border)", zIndex: 0,
          }} />
          {/* Linha de progresso */}
          <div style={{
            position: "absolute", top: 18, left: 18, height: 2,
            background: isConcluida ? "var(--green)" : "linear-gradient(90deg, var(--green), var(--green-mid))",
            zIndex: 1, transition: "width .5s var(--ease)",
            width: currentIdx <= 0 ? "0%" :
                   currentIdx === 1 ? "33%" :
                   currentIdx === 2 ? "66%" : "calc(100% - 36px)",
          }} />

          <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
            {STEPS.map((step, idx) => {
              const done = idx < currentIdx;
              const active = idx === currentIdx;
              const future = idx > currentIdx;
              return (
                <div key={step.key} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: ".5rem", flex: 1,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    background: done || active ? "var(--green)" : "var(--surface)",
                    border: future ? "2px solid var(--border)" : "2px solid var(--green)",
                    color: done || active ? "#fff" : "var(--text-faint)",
                    transition: "all .3s var(--ease)",
                    boxShadow: active ? "0 0 0 4px rgba(30,122,50,.15)" : "none",
                  }}>
                    {done
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                      : step.icon}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{
                      fontSize: ".72rem", fontWeight: active ? 700 : done ? 600 : 400,
                      color: active ? "var(--green-dark)" : done ? "var(--green)" : "var(--text-faint)",
                      lineHeight: 1.2, whiteSpace: "nowrap",
                    }}>
                      {step.label}
                    </p>
                    {active && (
                      <p style={{
                        fontSize: ".65rem", color: "var(--text-faint)",
                        marginTop: ".15rem", lineHeight: 1.3, maxWidth: 72, textAlign: "center",
                      }}>
                        {step.desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Feedback ── */}
      {resultado && !codigoErro && (
        <div style={{
          marginTop: "1rem", padding: ".65rem 1rem", borderRadius: "var(--radius-sm)",
          background: resultado.ok ? "rgba(30,122,50,.07)" : "var(--red-light)",
          border: `1.5px solid ${resultado.ok ? "rgba(30,122,50,.2)" : "rgba(184,50,40,.2)"}`,
          color: resultado.ok ? "var(--green-dark)" : "var(--red)",
          fontSize: ".83rem", fontWeight: 500,
          display: "flex", alignItems: "center", gap: ".5rem",
        }}>
          {resultado.ok
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          }
          {resultado.msg}
        </div>
      )}

      {/* ── Acoes (so empresa, status nao finalizado) ── */}
      {isEmpresa && !isDone && proximoPrincipal && (
        <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: ".75rem" }}>

          {/* Input de codigo quando for concluir */}
          {proximoEhConclusao && (
            <div style={{
              padding: "1rem 1.25rem",
              background: "var(--surface-2)",
              borderRadius: "var(--radius-sm)",
              border: `1.5px solid ${codigoErro ? "var(--red)" : "var(--border)"}`,
            }}>
              <p style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--text)", marginBottom: ".5rem", display: "flex", alignItems: "center", gap: ".4rem" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Codigo de confirmacao do usuario
              </p>
              <p style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: ".75rem" }}>
                Solicite ao usuario o codigo exibido na tela dele para confirmar a conclusao da coleta.
              </p>
              <div style={{ display: "flex", gap: ".5rem" }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ex: A3F9"
                  value={codigoInput}
                  onChange={e => { setCodigoInput(e.target.value.toUpperCase()); setCodigoErro(""); }}
                  maxLength={8}
                  style={{
                    fontFamily: "monospace", fontWeight: 700, fontSize: "1rem",
                    letterSpacing: "3px", textTransform: "uppercase",
                    borderColor: codigoErro ? "var(--red)" : undefined,
                    flex: 1,
                  }}
                />
              </div>
              {codigoErro && (
                <p style={{ fontSize: ".75rem", color: "var(--red)", marginTop: ".4rem" }}>{codigoErro}</p>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: ".6rem", flexWrap: "wrap" }}>
            <button
              onClick={avancar}
              disabled={loading || (proximoEhConclusao && !codigoInput.trim())}
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: "center", minWidth: 140 }}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 14, height: 14 }} /> Atualizando...</>
              ) : (
                <>
                  {STEPS.find(s => s.key === proximoPrincipal)?.icon}
                  {proximoEhConclusao ? "Confirmar conclusao" : `Avancar para ${STATUS_COLETA_LABEL[proximoPrincipal]}`}
                </>
              )}
            </button>
            <button
              onClick={cancelar}
              disabled={loading}
              className="btn btn-danger"
              style={{ flexShrink: 0 }}
            >
              Cancelar coleta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}