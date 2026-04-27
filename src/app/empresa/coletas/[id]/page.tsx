import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatBox } from "@/components/forms/ChatBox";
import { RequestImageGallery } from "@/components/ui/RequestImageGallery";
import { ColetaStatusTracker } from "@/components/ui/ColetaStatusTracker";
import { ColetaBadge } from "@/components/ui/StatusBadge";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_COPY: Record<string, { title: string; description: string; tone: string }> = {
  aceita: {
    title: "Coleta confirmada",
    description: "A empresa assumiu a solicitação e pode alinhar os proximos passos com o solicitante.",
    tone: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200",
  },
  a_caminho: {
    title: "Equipe a caminho",
    description: "A coleta esta em deslocamento e o solicitante pode acompanhar o atendimento em andamento.",
    tone: "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200",
  },
  em_coleta: {
    title: "Coleta em execução",
    description: "O material esta sendo atendido no local, com o fluxo operacional ja em andamento.",
    tone: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200",
  },
  concluida: {
    title: "Coleta concluida",
    description: "Atendimento finalizado com registro completo da solicitação e da comunicação.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  cancelada: {
    title: "Coleta cancelada",
    description: "O fluxo foi encerrado antes da conclusão. Consulte o histórico da conversa se precisar revisar o contexto.",
    tone: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200",
  },
};

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
  const statusCopy = STATUS_COPY[coleta.status] ?? {
    title: coleta.status,
    description: "Acompanhe os dados operacionais desta coleta em uma visualização mais organizada.",
    tone: "border-slate-200 bg-slate-50 text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200",
  };

  return (
    <div
      className="page-enter"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, var(--surface-3) 0%, var(--bg) 100%)",
        padding: "1.5rem 0 3rem",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 1rem" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: ".75rem",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/empresa/coletas"
            className="btn btn-ghost"
            style={{ padding: ".45rem .8rem", fontSize: ".82rem" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Voltar para coletas
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
            Visao operacional
          </p>
        </div>

        <div className="detail-grid" style={{ maxWidth: 1180, margin: "0 auto" }}>
          <article
            style={{
              background: "var(--surface)",
              borderRadius: 32,
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "2rem 2rem 1.4rem",
                borderBottom: "1px solid var(--border)",
                background: "linear-gradient(180deg, var(--surface-3) 0%, var(--surface) 100%)",
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
                    Coleta #{coleta.id}
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
                      maxWidth: 600,
                      fontSize: ".92rem",
                      lineHeight: 1.6,
                      color: "var(--text-muted)",
                    }}
                  >
                    Painel detalhado da coleta com anexos, dados da solicitação e informações do solicitante em uma visualização mais limpa e profissional.
                  </p>
                </div>
                <ColetaBadge status={coleta.status} />
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
                  background: "linear-gradient(90deg, transparent, var(--border), transparent)",
                }}
              />
            </div>

            <div style={{ padding: "1.75rem 2rem 2rem" }}>
              <SectionHeading
                eyebrow="Dados"
                title="Informações da coleta"
                description="Leitura organizada para a equipe da empresa, sem remover nenhuma informação importante do fluxo atual."
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
                  label="Solicitação criada em"
                  value={new Date(s.createdAt).toLocaleString("pt-BR")}
                />
                <DocumentField
                  label="Aceita em"
                  value={new Date(coleta.dataAceite).toLocaleDateString("pt-BR")}
                />
                <DocumentField label="Status operacional" value={statusCopy.title} />
                {coleta.dataConclusao && (
                  <DocumentField
                    label="Concluida em"
                    value={new Date(coleta.dataConclusao).toLocaleDateString("pt-BR")}
                  />
                )}
                <DocumentField label="Endereco da coleta" value={s.endereco} full />
                {s.descricao && (
                  <DocumentField label="Descrição do material" value={s.descricao} full muted />
                )}

                <StatusSummary
                  title={statusCopy.title}
                  description={statusCopy.description}
                  tone={statusCopy.tone}
                />

                <DocumentField label="Solicitante" value={s.user.nome} />
                <DocumentField label="Email" value={s.user.email} />
                {(s.user as any).telefone && (
                  <DocumentField label="Telefone" value={(s.user as any).telefone} />
                )}
                {s.user.endereco && (
                  <DocumentField label="Endereco do perfil" value={s.user.endereco} full />
                )}
              </div>
            </div>
          </article>

          <aside className="chat-col">
            <section
              className="card"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <SectionHeading
                eyebrow="Acompanhamento"
                title="Progresso da coleta"
                description="O fluxo operacional segue disponivel abaixo da ficha principal, com os controles da empresa preservados."
              />
              <ColetaStatusTracker coletaId={coleta.id} statusAtual={coleta.status} isEmpresa />
            </section>

            <section
              className="card chat-card"
              style={{
                padding: 0,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div
                style={{
                  padding: "1rem 1.25rem",
                  borderBottom: "1px solid var(--border)",
                  background: "linear-gradient(180deg, var(--surface-3) 0%, var(--surface) 100%)",
                }}
              >
                <SectionHeading
                  eyebrow="Comunicação"
                  title={`Chat com ${s.user.nome.split(" ")[0]}`}
                  description="Conversa vinculada a esta coleta."
                  compact
                />
              </div>
              <div className="chat-card-body" style={{ padding: "1rem 1.25rem" }}>
                <ChatBox
                  coletaId={coleta.id}
                  currentUserId={userId}
                  initialMessages={coleta.mensagens as any}
                />
              </div>
            </section>
          </aside>
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
}: {
  label: string;
  value: string;
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
          fontSize: ".95rem",
          lineHeight: 1.6,
          color: muted ? "var(--text-muted)" : "var(--text)",
          fontWeight: muted ? 400 : 600,
          whiteSpace: "pre-line",
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
    <div
      className={tone}
      style={{
        gridColumn: "1 / -1",
        borderRadius: 20,
        borderWidth: 1,
        padding: "1rem 1.05rem",
      }}
    >
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
        Situação atual
      </p>
      <p style={{ fontSize: ".96rem", fontWeight: 700, marginBottom: ".25rem" }}>{title}</p>
      <p style={{ fontSize: ".85rem", lineHeight: 1.55 }}>{description}</p>
    </div>
  );
}
