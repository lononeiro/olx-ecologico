import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ColetaBadge } from "@/components/ui/StatusBadge";
import { ColetaStatusTracker } from "@/components/ui/ColetaStatusTracker";
import { ChatBox } from "@/components/forms/ChatBox";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EmpresaColetaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);
  const coletaId = Number(params.id);

  const [company, coleta] = await Promise.all([
    prisma.company.findUnique({ where: { userId }, select: { id: true } }),
    prisma.coleta.findUnique({
      where: { id: coletaId },
      include: {
        solicitacao: {
          include: {
            user: { select: { id: true, nome: true, email: true, telefone: true, endereco: true } },
            material: true,
            imagens: true,
          },
        },
        company: { include: { user: { select: { id: true, nome: true, email: true } } } },
        mensagens: {
          include: { remetente: { select: { id: true, nome: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  ]);

  if (!company || !coleta || coleta.companyId !== company.id) notFound();
  const s = coleta.solicitacao;

  return (
    <div className="page-enter">
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
        <Link href="/empresa/coletas" className="btn btn-ghost" style={{ padding: ".35rem .65rem", fontSize: ".82rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Voltar
        </Link>
        <div style={{ flex: 1 }}>
          <p className="section-label">Coleta #{coleta.id}</p>
          <h1 style={{ fontSize: "clamp(1.1rem, 3vw, 1.4rem)", fontWeight: 800, color: "var(--text)", letterSpacing: "-.3px", lineHeight: 1.2 }}>
            {s.titulo}
          </h1>
        </div>
        <ColetaBadge status={coleta.status} />
      </div>

      {/* ── Status tracker ── */}
      <div className="card anim-fade-up stagger-1" style={{ marginBottom: "1.25rem" }}>
        <p className="section-label" style={{ marginBottom: "1.25rem" }}>Progresso da Coleta</p>
        <ColetaStatusTracker coletaId={coleta.id} statusAtual={coleta.status} isEmpresa />
      </div>

      {/* ── Grid responsivo (mesmo padrão do dashboard) ── */}
      <div className="detail-grid">

        {/* COLUNA ESQUERDA */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Material */}
          <div className="card anim-fade-up stagger-3">
            <p className="section-label" style={{ marginBottom: ".75rem" }}>Material</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: ".75rem" }}>
              <Field label="Tipo" value={s.material.nome} />
              <Field label="Quantidade" value={s.quantidade} />
              <Field label="Aceita em" value={new Date(coleta.dataAceite).toLocaleDateString("pt-BR")} />
              {coleta.dataConclusao && <Field label="Concluida em" value={new Date(coleta.dataConclusao).toLocaleDateString("pt-BR")} />}
              <Field label="Endereco" value={s.endereco} full />
              {s.descricao && <Field label="Descricao" value={s.descricao} full muted />}
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

          {/* Solicitante */}
          <div className="card anim-fade-up stagger-4">
            <p className="section-label" style={{ marginBottom: ".75rem" }}>Solicitante</p>
            <div style={{ display: "flex", alignItems: "center", gap: ".75rem", marginBottom: ".65rem" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--green), var(--green-light))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: ".9rem", fontWeight: 800, color: "#fff",
              }}>
                {s.user.nome[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: ".9rem", color: "var(--text)" }}>{s.user.nome}</p>
                <p style={{ fontSize: ".78rem", color: "var(--text-muted)" }}>{s.user.email}</p>
              </div>
            </div>
            {(s.user as any).telefone && (
              <div style={{ display: "flex", alignItems: "center", gap: ".4rem", fontSize: ".82rem", color: "var(--text-muted)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {(s.user as any).telefone}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA — chat */}
        <div className="card anim-fade-up stagger-2 chat-col" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            padding: "1rem 1.25rem",
            borderBottom: "1.5px solid var(--border)",
            display: "flex", alignItems: "center", gap: ".6rem",
            background: "var(--surface-3)",
            flexShrink: 0,
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
              <p style={{ fontWeight: 700, fontSize: ".88rem", color: "var(--text)", lineHeight: 1.2 }}>
                Chat com {s.user.nome.split(" ")[0]}
              </p>
              <p style={{ fontSize: ".7rem", color: "var(--text-faint)" }}>Solicitante</p>
            </div>
          </div>
          <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <ChatBox
              coletaId={coleta.id}
              currentUserId={userId}
              initialMessages={coleta.mensagens as any}
            />
          </div>
        </div>
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