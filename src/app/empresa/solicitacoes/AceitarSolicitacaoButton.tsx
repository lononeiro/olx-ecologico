"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  imagens: { id: number; url: string }[];
}

export function AceitarSolicitacaoButton({
  solicitacaoId,
  titulo,
  descricao,
  quantidade,
  endereco,
  materialNome,
  imagens,
}: Props) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [dataPrevisaoColeta, setDataPrevisaoColeta] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const mostrarAnterior = () =>
    setLightboxIndex((i) => (i === null ? i : (i - 1 + imagens.length) % imagens.length));
  const mostrarProxima = () =>
    setLightboxIndex((i) => (i === null ? i : (i + 1) % imagens.length));

  // Navegação por teclado enquanto o lightbox está aberto.
  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      else if (e.key === "ArrowRight") mostrarProxima();
      else if (e.key === "ArrowLeft") mostrarAnterior();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxIndex, imagens.length]);

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
    <div style={{ display: "grid", gap: ".55rem" }}>
      <Link
        href={`/empresa/solicitacoes/${solicitacaoId}/conversa`}
        className="btn btn-secondary"
        style={{ width: "100%", justifyContent: "center" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Tirar dúvida
      </Link>
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
                  <InfoField label="Status" value={<SolicitacaoBadge status="aprovada" />} />
                  <InfoField label="Região aproximada" value={endereco} full />
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
                        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: ".7rem",
                      }}
                    >
                      {imagens.map((img, index) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setLightboxIndex(index)}
                          aria-label={`Ampliar foto ${index + 1} de ${imagens.length}`}
                          style={{
                            position: "relative",
                            display: "block",
                            padding: 0,
                            cursor: "zoom-in",
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
                              height: 128,
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                          <span
                            aria-hidden
                            style={{
                              position: "absolute",
                              right: 8,
                              bottom: 8,
                              width: 30,
                              height: 30,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 10,
                              background: "rgba(15,23,42,.55)",
                              color: "#fff",
                              backdropFilter: "blur(4px)",
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <circle cx="11" cy="11" r="7" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                              <line x1="11" y1="8" x2="11" y2="14" />
                              <line x1="8" y1="11" x2="14" y2="11" />
                            </svg>
                          </span>
                        </button>
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
                  Ao aceitar, a empresa receberá o endereço completo da coleta e poderá trocar mensagens com o solicitante.
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

      {lightboxIndex !== null && imagens[lightboxIndex] && (
        <Portal>
          <style>{`
            @keyframes lbFade { from { opacity: 0; } to { opacity: 1; } }
            .lb-overlay {
              position: fixed;
              inset: 0;
              z-index: 320;
              background: rgba(2, 6, 23, .9);
              backdrop-filter: blur(6px);
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              animation: lbFade .18s ease both;
            }
            .lb-img {
              max-width: 92vw;
              max-height: 84vh;
              object-fit: contain;
              border-radius: 12px;
              box-shadow: 0 24px 60px rgba(0,0,0,.5);
            }
            .lb-btn {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 48px;
              height: 48px;
              border-radius: 999px;
              border: 1px solid rgba(255,255,255,.18);
              background: rgba(255,255,255,.1);
              color: #fff;
              cursor: pointer;
              flex-shrink: 0;
              transition: background .15s;
            }
            .lb-btn:hover { background: rgba(255,255,255,.22); }
          `}</style>
          <div
            className="lb-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) setLightboxIndex(null);
            }}
          >
            <button
              onClick={() => setLightboxIndex(null)}
              className="lb-btn"
              aria-label="Fechar"
              style={{ position: "absolute", top: 18, right: 18 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", maxWidth: "100%" }}>
              {imagens.length > 1 && (
                <button onClick={mostrarAnterior} className="lb-btn" aria-label="Foto anterior">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
              )}

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: ".8rem", minWidth: 0 }}>
                <img src={imagens[lightboxIndex].url} alt="" className="lb-img" />
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  {imagens.length > 1 && (
                    <span style={{ color: "rgba(255,255,255,.85)", fontSize: ".85rem", fontWeight: 600 }}>
                      {lightboxIndex + 1} / {imagens.length}
                    </span>
                  )}
                  <a
                    href={imagens[lightboxIndex].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "rgba(255,255,255,.85)",
                      fontSize: ".82rem",
                      fontWeight: 600,
                      textDecoration: "underline",
                    }}
                  >
                    Abrir original
                  </a>
                </div>
              </div>

              {imagens.length > 1 && (
                <button onClick={mostrarProxima} className="lb-btn" aria-label="Próxima foto">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
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
