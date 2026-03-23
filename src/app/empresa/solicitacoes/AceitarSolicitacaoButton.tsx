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
  solicitacaoId, titulo, descricao, quantidade,
  endereco, materialNome, solicitanteNome, imagens,
}: Props) {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleAceitar() {
    setLoading(true);
    setErro("");
    const res = await fetch("/api/empresa/coletas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ solicitacaoId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setErro(data.error ?? "Erro ao aceitar solicitacao."); return; }
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
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        Ver localizacao e aceitar
      </button>

      {modalAberto && (
        <Portal>
          <style>{`
            @keyframes modalFadeIn {
              from { opacity: 0; transform: scale(.97); }
              to   { opacity: 1; transform: scale(1); }
            }
            @keyframes slideUpMobile {
              from { transform: translateY(100%); opacity: 0; }
              to   { transform: translateY(0);    opacity: 1; }
            }
            .modal-overlay {
              position: fixed;
              inset: 0;
              z-index: 200;
              background: rgba(10,25,12,.5);
              backdrop-filter: blur(3px);
              /* Centraliza o painel no desktop com flexbox */
              display: flex;
              align-items: flex-end;
              justify-content: center;
            }
            @media (min-width: 680px) {
              .modal-overlay {
                align-items: center;
              }
            }
            .modal-painel {
              position: relative;
              z-index: 201;
              width: 100%;
              max-height: 92vh;
              background: var(--surface);
              border-radius: 20px 20px 0 0;
              border: 1.5px solid var(--border);
              box-shadow: var(--shadow-lg);
              display: flex;
              flex-direction: column;
              overflow: hidden;
              animation: slideUpMobile .25s ease both;
            }
            @media (min-width: 680px) {
              .modal-painel {
                width: min(900px, 92vw);
                border-radius: 20px;
                animation: modalFadeIn .2s ease both;
              }
            }
          `}</style>

          {/* Overlay + Painel centralizados por flexbox */}
          <div
            className="modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget && !loading) setModalAberto(false); }}
          >

          {/* Painel */}
          <div className="modal-painel">

            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "1.1rem 1.25rem",
              borderBottom: "1.5px solid var(--border)",
              flexShrink: 0,
            }}>
              <div>
                <p className="section-label">Confirmar aceitacao</p>
                <p style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text)", lineHeight: 1.2 }}>
                  {titulo}
                </p>
              </div>
              <button
                onClick={() => !loading && setModalAberto(false)}
                className="btn-icon"
                aria-label="Fechar"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Conteúdo scrollável */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>

              {/* Mapa */}
              <div style={{ marginBottom: "1.25rem" }}>
                <p className="section-label" style={{ marginBottom: ".6rem" }}>Localizacao da coleta</p>
                <MapaEndereco endereco={endereco} />
              </div>

              {/* Detalhes */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: ".75rem", marginBottom: "1.25rem",
              }}>
                <InfoField label="Material" value={materialNome} />
                <InfoField label="Quantidade" value={quantidade} />
                <InfoField label="Solicitante" value={solicitanteNome} />
                <InfoField label="Status" value={<SolicitacaoBadge status="aprovada" />} />
                {descricao && <InfoField label="Descricao" value={descricao} full muted />}
              </div>

              {/* Imagens */}
              {imagens.length > 0 && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <p className="section-label" style={{ marginBottom: ".6rem" }}>Fotos do material</p>
                  <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                    {imagens.map(img => (
                      <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                        <img src={img.url} alt="" className="img-thumb" style={{
                          width: 72, height: 72, objectFit: "cover",
                          borderRadius: 10, border: "1.5px solid var(--border)",
                        }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Aviso */}
              <div style={{
                padding: ".75rem 1rem",
                background: "var(--blue-light)",
                border: "1.5px solid rgba(29,111,168,.18)",
                borderRadius: "var(--radius-sm)",
                fontSize: ".8rem", color: "var(--blue)", lineHeight: 1.55,
              }}>
                Ao aceitar, voce se compromete a realizar a coleta neste endereco. O solicitante sera notificado e voce podera trocar mensagens com ele.
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "1rem 1.25rem",
              borderTop: "1.5px solid var(--border)",
              display: "flex", flexDirection: "column", gap: ".6rem",
              flexShrink: 0,
            }}>
              {erro && (
                <p style={{
                  fontSize: ".8rem", color: "var(--red)",
                  padding: ".5rem .75rem", background: "var(--red-light)",
                  borderRadius: "var(--radius-xs)", border: "1px solid rgba(184,50,40,.15)",
                }}>
                  {erro}
                </p>
              )}
              <div style={{ display: "flex", gap: ".65rem" }}>
                <button
                  onClick={() => setModalAberto(false)}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAceitar}
                  disabled={loading}
                  className="btn btn-blue"
                  style={{ flex: 2, justifyContent: "center" }}
                >
                  {loading ? (
                    <><span className="spinner" style={{ width: 15, height: 15 }} /> Aceitando...</>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 6 9 17l-5-5"/>
                      </svg>
                      Confirmar aceitacao
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
          </div>{/* fim modal-overlay */}
        </Portal>
      )}
    </>
  );
}

function InfoField({ label, value, full, muted }: {
  label: string; value: React.ReactNode; full?: boolean; muted?: boolean;
}) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <p className="section-label">{label}</p>
      <div style={{
        fontSize: ".85rem", fontWeight: muted ? 400 : 600,
        color: muted ? "var(--text-muted)" : "var(--text)",
        marginTop: ".2rem", lineHeight: 1.5,
      }}>
        {value}
      </div>
    </div>
  );
}