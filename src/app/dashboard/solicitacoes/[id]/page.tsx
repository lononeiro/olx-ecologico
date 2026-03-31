import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatBox } from "@/components/forms/ChatBox";
import { RequestImageGallery } from "@/components/ui/RequestImageGallery";
import { ColetaStatusTracker } from "@/components/ui/ColetaStatusTracker";
import { SolicitacaoBadge } from "@/components/ui/StatusBadge";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_COPY: Record<string, { title: string; description: string; tone: string }> = {
  pendente: {
    title: "Aguardando aprovacao",
    description: "Sua solicitacao esta em analise pela administracao.",
    tone: "border-yellow-200 bg-yellow-50 text-yellow-800",
  },
  aprovada: {
    title: "Aguardando empresa",
    description: "A solicitacao foi aprovada e aguarda uma empresa aceitar a coleta.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  rejeitada: {
    title: "Solicitacao rejeitada",
    description: "Entre em contato com o suporte caso precise de mais informacoes.",
    tone: "border-red-200 bg-red-50 text-red-800",
  },
};

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

  const statusCopy = STATUS_COPY[s.status] ?? {
    title: s.status,
    description: "Acompanhe os dados atualizados desta solicitacao.",
    tone: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <div
      className="page-enter"
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)",
        padding: "1.5rem 0 3rem",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 1rem" }}>
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: ".75rem",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/dashboard/solicitacoes"
            className="btn btn-ghost"
            style={{ padding: ".45rem .8rem", fontSize: ".82rem" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Voltar para solicitacoes
          </Link>
          <p
            style={{
              fontSize: ".74rem",
              color: "var(--text-faint)",
              letterSpacing: "1.6px",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Previa de documento
          </p>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <article
            style={{
              background: "#fff",
              borderRadius: 32,
              border: "1px solid rgba(148,163,184,.18)",
              boxShadow: "0 24px 60px rgba(15,23,42,.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "2rem 2rem 1.4rem",
                borderBottom: "1px solid rgba(226,232,240,.9)",
                background:
                  "linear-gradient(180deg, rgba(248,250,252,.95) 0%, rgba(255,255,255,1) 100%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 260 }}>
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
                    Solicitacao #{s.id}
                  </p>
                  <h1
                    style={{
                      fontSize: "clamp(1.5rem, 3vw, 2.1rem)",
                      lineHeight: 1.15,
                      letterSpacing: "-.04em",
                      fontWeight: 800,
                      color: "var(--text)",
                    }}
                  >
                    {s.titulo}
                  </h1>
                  <p
                    style={{
                      marginTop: ".75rem",
                      maxWidth: 560,
                      fontSize: ".92rem",
                      lineHeight: 1.6,
                      color: "var(--text-muted)",
                    }}
                  >
                    Documento de referencia da solicitacao de coleta com destaque visual para anexos e dados principais.
                  </p>
                </div>
                <SolicitacaoBadge status={s.status} />
              </div>
            </div>

            <div style={{ padding: "1.5rem 1.5rem 0" }}>
              <RequestImageGallery images={s.imagens} title={s.titulo} />
            </div>

            <div style={{ padding: "0 2rem" }}>
              <div
                style={{
                  height: 1,
                  marginTop: "1.75rem",
                  background:
                    "linear-gradient(90deg, rgba(226,232,240,0), rgba(226,232,240,1), rgba(226,232,240,0))",
                }}
              />
            </div>

            <div style={{ padding: "1.75rem 2rem 2rem" }}>
              <SectionHeading
                eyebrow="Dados"
                title="Informacoes da solicitacao"
                description="Hierarquia organizada para leitura formal, sem esconder os dados relevantes do sistema."
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "1rem",
                }}
              >
                <DocumentField label="Material" value={s.material.nome} />
                <DocumentField label="Quantidade" value={s.quantidade} />
                <DocumentField
                  label="Criada em"
                  value={new Date(s.createdAt).toLocaleString("pt-BR")}
                />
                <DocumentField label="Status" value={statusCopy.title} />
                <DocumentField label="Endereco" value={s.endereco} full />
                {s.descricao && (
                  <DocumentField label="Descricao" value={s.descricao} full muted />
                )}

                {s.coleta ? (
                  <>
                    <DocumentField
                      label="Empresa responsavel"
                      value={s.coleta.company.user.nome}
                    />
                    <DocumentField
                      label="Data do aceite"
                      value={new Date(s.coleta.dataAceite).toLocaleDateString("pt-BR")}
                    />
                    {s.coleta.codigoConfirmacao && (
                      <DocumentField
                        label="Codigo de confirmacao"
                        value={s.coleta.codigoConfirmacao}
                        mono
                      />
                    )}
                    {s.coleta.dataConclusao && (
                      <DocumentField
                        label="Data da conclusao"
                        value={new Date(s.coleta.dataConclusao).toLocaleDateString("pt-BR")}
                      />
                    )}
                  </>
                ) : (
                  <StatusSummary
                    title={statusCopy.title}
                    description={statusCopy.description}
                    tone={statusCopy.tone}
                  />
                )}
              </div>
            </div>
          </article>

          {s.coleta && (
            <div style={{ marginTop: "1.25rem", display: "grid", gap: "1rem" }}>
              <section
                className="card"
                style={{
                  background: "rgba(255,255,255,.88)",
                  border: "1px solid rgba(148,163,184,.18)",
                  boxShadow: "0 16px 40px rgba(15,23,42,.06)",
                }}
              >
                <SectionHeading
                  eyebrow="Acompanhamento"
                  title="Progresso da coleta"
                  description="O andamento operacional continua disponivel, mas separado da folha principal."
                />
                <ColetaStatusTracker coletaId={s.coleta.id} statusAtual={s.coleta.status} isEmpresa={false} />
              </section>

              <section
                className="card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  background: "rgba(255,255,255,.88)",
                  border: "1px solid rgba(148,163,184,.18)",
                  boxShadow: "0 16px 40px rgba(15,23,42,.06)",
                }}
              >
                <div
                  style={{
                    padding: "1rem 1.25rem",
                    borderBottom: "1px solid rgba(226,232,240,.9)",
                    background: "linear-gradient(180deg, rgba(248,250,252,.9) 0%, rgba(255,255,255,1) 100%)",
                  }}
                >
                  <SectionHeading
                    eyebrow="Comunicacao"
                    title="Chat com a empresa"
                    description={s.coleta.company.user.nome}
                    compact
                  />
                </div>
                <div style={{ padding: "1rem 1.25rem" }}>
                  <ChatBox
                    coletaId={s.coleta.id}
                    currentUserId={userId}
                    initialMessages={s.coleta.mensagens as any}
                  />
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  compact,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div style={{ marginBottom: compact ? ".2rem" : "1.2rem" }}>
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
        {eyebrow}
      </p>
      <h2
        style={{
          fontSize: compact ? "1rem" : "1.3rem",
          lineHeight: 1.2,
          fontWeight: 700,
          color: "var(--text)",
          marginBottom: description ? ".2rem" : 0,
        }}
      >
        {title}
      </h2>
      {description && (
        <p
          style={{
            fontSize: compact ? ".78rem" : ".86rem",
            color: "var(--text-muted)",
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

function DocumentField({
  label,
  value,
  full,
  muted,
  mono,
}: {
  label: string;
  value: string;
  full?: boolean;
  muted?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        gridColumn: full ? "1 / -1" : undefined,
        padding: "1rem 1.05rem",
        borderRadius: 20,
        border: "1px solid rgba(226,232,240,.9)",
        background: muted ? "rgba(248,250,252,.8)" : "#fff",
      }}
    >
      <p
        style={{
          fontSize: ".7rem",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          color: "var(--text-faint)",
          fontWeight: 700,
          marginBottom: ".45rem",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: mono ? "1rem" : ".95rem",
          lineHeight: 1.6,
          color: muted ? "var(--text-muted)" : "var(--text)",
          fontWeight: muted ? 400 : 600,
          whiteSpace: "pre-line",
          fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
          letterSpacing: mono ? "2px" : undefined,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function StatusSummary({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: string;
}) {
  return (
    <div className={tone} style={{ gridColumn: "1 / -1", borderRadius: 20, borderWidth: 1, padding: "1rem 1.05rem" }}>
      <p
        style={{
          fontSize: ".7rem",
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          fontWeight: 700,
          marginBottom: ".45rem",
          opacity: 0.8,
        }}
      >
        Situacao atual
      </p>
      <p style={{ fontSize: ".96rem", fontWeight: 700, marginBottom: ".25rem" }}>{title}</p>
      <p style={{ fontSize: ".85rem", lineHeight: 1.55 }}>{description}</p>
    </div>
  );
}
