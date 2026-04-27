"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapaEndereco } from "@/components/ui/MapaEndereco";
import { SolicitacaoBadge } from "@/components/ui/StatusBadge";
import { Portal } from "@/components/ui/Portal";

interface Props {
  solicitacaoId: number;
  titulo: string;
  descricao: string;
  quantidade: string;
  endereco: string;
  materialNome: string;
  solicitanteNome: string;
  imagens: { id: number; url: string }[];
}

export function AceitarSolicitacaoButton({
  solicitacaoId,
  titulo,
  descricao,
  quantidade,
  endereco,
  materialNome,
  solicitanteNome,
  imagens,
}: Props) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [dataPrevisaoColeta, setDataPrevisaoColeta] = useState("");

  async function handleAceitar() {
    if (!dataPrevisaoColeta) {
      setErro("Informe a data prevista para a coleta.");
      return;
    }

    setLoading(true);
    setErro("");

    const res = await fetch("/api/empresa/coletas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ solicitacaoId, dataPrevisaoColeta }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErro(data.error ?? "Erro ao aceitar solicitação.");
      return;
    }

    setModalAberto(false);
    router.push(`/empresa/coletas/${data.id}`);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setModalAberto(true)}
        className="btn btn-blue"
        style={{ width: "100%", justifyContent: "center" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Ver localização e aceitar
      </button>

      {modalAberto && (
        <Portal>
          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; transform: translateY(10px) scale(.985); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes slideUpMobile {
              from { transform: translateY(100%); opacity: 0; }
              to   { transform: translateY(0); opacity: 1; }
            }
            .modal-overlay {
              position: fixed;
              inset: 0;
              z-index: 200;
              background: rgba(15, 23, 42, .48);
              backdrop-filter: blur(10px);
              display: flex;
              align-items: flex-end;
              justify-content: center;
            }
            @media (min-width: 680px) {
              .modal-overlay {
                align-items: center;
                padding: 20px;
              }
            }
            .modal-painel {
              position: relative;
              z-index: 201;
              width: 100%;
              max-height: 92vh;
              background: linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%);
              border-radius: 26px 26px 0 0;
              border: 1px solid var(--border);
              box-shadow: var(--shadow-lg);
              display: flex;
              flex-direction: column;
              overflow: hidden;
              animation: slideUpMobile .25s ease both;
            }
            @media (min-width: 680px) {
              .modal-painel {
                width: min(980px, 94vw);
                border-radius: 30px;
                animation: modalFadeIn .22s ease both;
              }
            }
          `}</style>

          <div
            className="modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget && !loading) setModalAberto(false);
            }}
          >
            <div className="modal-painel">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: "1.35rem 1.4rem 1.2rem",
                  borderBottom: "1px solid var(--border)",
                  flexShrink: 0,
                  background: "linear-gradient(180deg, var(--surface-3) 0%, var(--surface) 100%)",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: ".76rem",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      color: "rgba(30,122,50,.55)",
                      fontWeight: 800,
                      marginBottom: ".45rem",
                    }}
                  >
                    Confirmar aceitação
                  </p>
                  <p
                    style={{
                      fontWeight: 800,
                      fontSize: "1.2rem",
                      color: "var(--text)",
                      lineHeight: 1.2,
                      maxWidth: 620,
                    }}
                  >
                    {titulo}
                  </p>
                </div>

                <button
                  onClick={() => !loading && setModalAberto(false)}
                  className="btn-icon"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 16,
                    border: "1px solid var(--border)",
                    background: "var(--surface-overlay)",
                    color: "var(--text-muted)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                  aria-label="Fechar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.4rem 1.35rem" }}>
                <div
                  style={{
                    marginBottom: "1.2rem",
                    borderRadius: 24,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  <div style={{ padding: "1rem 1rem .8rem" }}>
                    <p
                      style={{
                        fontSize: ".72rem",
                        textTransform: "uppercase",
                        letterSpacing: "1.8px",
                        color: "var(--text-faint)",
                        fontWeight: 700,
                        marginBottom: ".45rem",
                      }}
                    >
                      Localização da coleta
                    </p>
                  </div>
                  <div style={{ padding: "0 1rem 1rem" }}>
                    <MapaEndereco endereco={endereco} />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: ".9rem",
                    marginBottom: "1.2rem",
                  }}
                >
                  <InfoField label="Material" value={materialNome} />
                  <InfoField label="Quantidade" value={quantidade} />
                  <InfoField label="Solicitante" value={solicitanteNome} />
                  <InfoField label="Status" value={<SolicitacaoBadge status="aprovada" />} />
                  <InfoField label="Endereço da coleta" value={endereco} full />
                  {descricao && <InfoField label="Descrição" value={descricao} full muted />}
                </div>

                <div
                  style={{
                    marginBottom: "1.2rem",
                    padding: "1rem 1.05rem",
                    borderRadius: 20,
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <label
                    htmlFor={`data-previsao-coleta-${solicitacaoId}`}
                    style={{
                      display: "block",
                      fontSize: ".7rem",
                      textTransform: "uppercase",
                      letterSpacing: "1.5px",
                      color: "var(--text-faint)",
                      fontWeight: 700,
                      marginBottom: ".5rem",
                    }}
                  >
                    Data prevista da coleta
                  </label>
                  <input
                    id={`data-previsao-coleta-${solicitacaoId}`}
                    type="datetime-local"
                    className="input-field"
                    value={dataPrevisaoColeta}
                    onChange={(event) => {
                      setDataPrevisaoColeta(event.target.value);
                      if (erro) setErro("");
                    }}
                    min={new Date().toISOString().slice(0, 16)}
                    disabled={loading}
                    required
                  />
                  <p style={{ marginTop: ".45rem", fontSize: ".78rem", color: "var(--text-muted)" }}>
                    {/* Essa previsão aparecerá no dashboard e ajuda a organizar as próximas  coletas. */}
                  </p>
                </div>

                {imagens.length > 0 && (
                  <div style={{ marginBottom: "1.2rem" }}>
                    <p
                      style={{
                        fontSize: ".72rem",
                        textTransform: "uppercase",
                        letterSpacing: "1.8px",
                        color: "var(--text-faint)",
                        fontWeight: 700,
                        marginBottom: ".7rem",
                      }}
                    >
                      Fotos do material
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))",
                        gap: ".7rem",
                      }}
                    >
                      {imagens.map((img) => (
                        <a
                          key={img.id}
                          href={img.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "block",
                            borderRadius: 18,
                            overflow: "hidden",
                            border: "1px solid var(--border)",
                            background: "var(--surface)",
                            boxShadow: "var(--shadow-xs)",
                          }}
                        >
                          <img
                            src={img.url}
                            alt=""
                            className="img-thumb"
                            style={{
                              width: "100%",
                              height: 96,
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    padding: ".9rem 1rem",
                    background: "var(--blue-light)",
                    border: "1px solid rgba(29,111,168,.18)",
                    borderRadius: 18,
                    fontSize: ".84rem",
                    color: "var(--blue)",
                    lineHeight: 1.6,
                  }}
                >
                  Ao aceitar, voce se compromete a realizar a coleta neste endereco. O solicitante sera notificado e voce podera trocar mensagens com ele.
                </div>
              </div>

              <div
                style={{
                  padding: "1rem 1.4rem 1.25rem",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: ".6rem",
                  flexShrink: 0,
                  background: "var(--surface-overlay)",
                  backdropFilter: "blur(10px)",
                }}
              >
                {erro && (
                  <p
                    style={{
                      fontSize: ".8rem",
                      color: "var(--red)",
                      padding: ".5rem .75rem",
                      background: "var(--red-light)",
                      borderRadius: "var(--radius-xs)",
                      border: "1px solid rgba(184,50,40,.15)",
                    }}
                  >
                    {erro}
                  </p>
                )}

                <div style={{ display: "flex", gap: ".65rem", flexWrap: "wrap" }}>
                  <button
                    onClick={() => setModalAberto(false)}
                    disabled={loading}
                    className="btn btn-secondary"
                    style={{ flex: "1 1 220px", minHeight: 50 }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAceitar}
                    disabled={loading}
                    className="btn btn-blue"
                    style={{ flex: "1.5 1 280px", justifyContent: "center", minHeight: 50 }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner" style={{ width: 15, height: 15 }} /> Aceitando...
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Confirmar aceitação
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

function InfoField({
  label,
  value,
  full,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  full?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        gridColumn: full ? "1 / -1" : undefined,
        padding: "1rem 1.05rem",
        borderRadius: 20,
        border: "1px solid var(--border)",
        background: muted ? "var(--surface-3)" : "var(--surface)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <p
        style={{
          fontSize: ".7rem",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: "var(--text-faint)",
          fontWeight: 700,
          marginBottom: ".42rem",
        }}
      >
        {label}
      </p>
      <div
        style={{
          fontSize: ".92rem",
          fontWeight: muted ? 400 : 600,
          color: muted ? "var(--text-muted)" : "var(--text)",
          lineHeight: 1.6,
        }}
      >
        {value}
      </div>
    </div>
  );
}
