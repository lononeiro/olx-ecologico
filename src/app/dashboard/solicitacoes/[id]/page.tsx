import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SolicitacaoBadge } from "@/components/ui/StatusBadge";
import { ColetaStatusTracker } from "@/components/ui/ColetaStatusTracker";
import { ChatBox } from "@/components/forms/ChatBox";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SolicitacaoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);
  const id = Number(params.id);

  const s = await prisma.solicitacaoColeta.findFirst({
    where: { id, userId },
    include: {
      material: true,
      imagens: true,
      coleta: {
        include: {
          company: { include: { user: { select: { id: true, nome: true } } } },
          mensagens: {
            include: { remetente: { select: { id: true, nome: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });
  if (!s) notFound();

  return (
    <div className="page-enter">
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
        <Link href="/dashboard/solicitacoes" className="btn btn-ghost" style={{ padding: ".35rem .65rem", fontSize: ".82rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </Link>
        <div style={{ flex: 1 }}>
          <p className="section-label">Solicitacao #{s.id}</p>
          <h1 style={{ fontSize: "clamp(1.1rem, 3vw, 1.4rem)", fontWeight: 800, color: "var(--text)", letterSpacing: "-.3px", lineHeight: 1.2 }}>
            {s.titulo}
          </h1>
        </div>
        <SolicitacaoBadge status={s.status} />
      </div>

      {/* ── Status tracker ── */}
      {s.coleta && (
        <div className="card anim-fade-up stagger-1" style={{ marginBottom: "1.25rem" }}>
          <p className="section-label" style={{ marginBottom: "1.25rem" }}>Progresso da Coleta</p>
          <ColetaStatusTracker coletaId={s.coleta.id} statusAtual={s.coleta.status} isEmpresa={false} />
        </div>
      )}

      {/* ── Sem coleta ── */}
      {!s.coleta && (
        <div className="card anim-fade-up stagger-1" style={{
          marginBottom: "1.25rem",
          background: s.status === "rejeitada" ? "var(--red-light)" : "var(--yellow-light)",
          border: `1.5px solid ${s.status === "rejeitada" ? "rgba(184,50,40,.2)" : "rgba(196,122,6,.2)"}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: s.status === "rejeitada" ? "var(--red)" : "var(--yellow)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {s.status === "rejeitada"
                ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              }
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: ".9rem", color: s.status === "rejeitada" ? "var(--red)" : "var(--yellow)", lineHeight: 1.2 }}>
                {s.status === "pendente" && "Aguardando aprovacao"}
                {s.status === "aprovada" && "Aguardando empresa"}
                {s.status === "rejeitada" && "Solicitacao rejeitada"}
              </p>
              <p style={{ fontSize: ".78rem", color: "var(--text-muted)", marginTop: ".15rem" }}>
                {s.status === "pendente" && "Sua solicitacao esta sendo analisada pelo administrador."}
                {s.status === "aprovada" && "Aprovada! Uma empresa ira aceitar a coleta em breve."}
                {s.status === "rejeitada" && "Entre em contato com o suporte para mais informacoes."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Grid responsivo ── */}
      <div className="detail-grid">

        {/* COLUNA ESQUERDA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Codigo de confirmacao */}
          {s.coleta && (
            <div className="card anim-fade-up stagger-2" style={{
              background: "linear-gradient(135deg, var(--green-dark), var(--green))",
              border: "none",
            }}>
              <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.6)", marginBottom: ".4rem" }}>
                Codigo de Confirmacao
              </p>
              <p style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "1.6rem", color: "#fff", letterSpacing: "4px", lineHeight: 1 }}>
                {s.coleta.codigoConfirmacao}
              </p>
              <p style={{ fontSize: ".72rem", color: "rgba(255,255,255,.55)", marginTop: ".5rem" }}>
                Empresa: {s.coleta.company.user.nome}
                {` · Aceita em ${new Date(s.coleta.dataAceite).toLocaleDateString("pt-BR")}`}
              </p>
            </div>
          )}

          {/* Detalhes */}
          <div className="card anim-fade-up stagger-3">
            <p className="section-label" style={{ marginBottom: ".75rem" }}>Detalhes</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
              <Field label="Material" value={s.material.nome} />
              <Field label="Quantidade" value={s.quantidade} />
              <Field label="Endereco" value={s.endereco} full />
              {s.descricao && <Field label="Descricao" value={s.descricao} full muted />}
              <Field label="Criada em" value={new Date(s.createdAt).toLocaleDateString("pt-BR")} />
            </div>

            {s.imagens.length > 0 && (
              <div style={{ marginTop: ".75rem", paddingTop: ".75rem", borderTop: "1.5px solid var(--border)" }}>
                <p className="section-label" style={{ marginBottom: ".5rem" }}>Fotos</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
                  {s.imagens.map(img => (
                    <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                      <img src={img.url} alt="" className="img-thumb" style={{
                        width: 60, height: 60, objectFit: "cover",
                        borderRadius: 8, border: "1.5px solid var(--border)",
                      }} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA — chat */}
        {s.coleta && (
          <div className="card anim-fade-up stagger-2 chat-col" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{
              padding: "1rem 1.25rem",
              borderBottom: "1.5px solid var(--border)",
              display: "flex", alignItems: "center", gap: ".6rem",
              background: "var(--surface-3)",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--green), var(--green-light))",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: ".88rem", color: "var(--text)", lineHeight: 1.2 }}>Chat com a empresa</p>
                <p style={{ fontSize: ".7rem", color: "var(--text-faint)" }}>{s.coleta.company.user.nome}</p>
              </div>
            </div>
            <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
              <ChatBox
                coletaId={s.coleta.id}
                currentUserId={userId}
                initialMessages={s.coleta.mensagens as any}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, full, muted }: { label: string; value: string; full?: boolean; muted?: boolean }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : undefined }}>
      <p className="section-label">{label}</p>
      <p style={{ fontSize: ".85rem", fontWeight: muted ? 400 : 600, color: muted ? "var(--text-muted)" : "var(--text)", marginTop: ".15rem", lineHeight: 1.5 }}>
        {value}
      </p>
    </div>
  );
}