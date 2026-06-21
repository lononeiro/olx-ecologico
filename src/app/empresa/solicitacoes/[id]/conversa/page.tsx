import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatBox } from "@/components/forms/ChatBox";
import { RequestImageGallery } from "@/components/ui/RequestImageGallery";
import { SolicitacaoBadge } from "@/components/ui/StatusBadge";
import { authOptions } from "@/lib/auth";
import { obterOuCriarConversaEmpresa } from "@/services/conversa-solicitacao.service";

export const dynamic = "force-dynamic";

export default async function EmpresaConversaSolicitacaoPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = Number((session!.user as any).id);
  const solicitacaoId = Number(params.id);

  if (!solicitacaoId || Number.isNaN(solicitacaoId)) notFound();

  let conversa: Awaited<ReturnType<typeof obterOuCriarConversaEmpresa>>;
  try {
    conversa = await obterOuCriarConversaEmpresa(solicitacaoId, userId);
  } catch {
    notFound();
  }

  const solicitacao = conversa.solicitacao;

  return (
    <div className="page-enter" style={{ maxWidth: 1120, margin: "0 auto" }}>
      <style>{`
        .pre-accept-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(320px, 430px);
          gap: 1.25rem;
          align-items: start;
        }
        @media (max-width: 860px) {
          .pre-accept-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/empresa/solicitacoes" className="btn btn-ghost" style={{ padding: ".45rem .8rem", fontSize: ".82rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Voltar para solicitacoes
        </Link>
      </div>

      <div
        className="pre-accept-grid"
      >
        <article className="card" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="section-label">Conversa antes do aceite</p>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "clamp(1.35rem, 3vw, 1.8rem)", fontWeight: 800, color: "var(--text)", lineHeight: 1.2 }}>
                {solicitacao.titulo}
              </h1>
              <p style={{ marginTop: ".45rem", color: "var(--text-muted)", lineHeight: 1.6, fontSize: ".9rem" }}>
                Converse com o solicitante para validar volume, material e viabilidade antes de aceitar a coleta.
              </p>
            </div>
            <SolicitacaoBadge status={solicitacao.status} />
          </div>

          <div style={{ marginTop: "1.2rem" }}>
            <RequestImageGallery images={solicitacao.imagens} title={solicitacao.titulo} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: ".8rem",
              marginTop: "1.2rem",
            }}
          >
            <Info label="Material" value={solicitacao.material.nome} />
            <Info label="Quantidade" value={solicitacao.quantidade} />
            <Info label="Região aproximada" value={solicitacao.endereco ?? "Região não informada"} />
            <Info label="Descrição" value={solicitacao.descricao} full muted />
          </div>

          <div style={{ display: "flex", gap: ".65rem", flexWrap: "wrap", marginTop: "1.2rem" }}>
            <Link href="/empresa/solicitacoes" className="btn btn-secondary" style={{ flex: "1 1 180px", justifyContent: "center" }}>
              Ver outras solicitações
            </Link>
            <Link href="/empresa/solicitacoes" className="btn btn-blue" style={{ flex: "1 1 220px", justifyContent: "center" }}>
              Voltar e aceitar coleta
            </Link>
          </div>
        </article>

        <aside className="card" style={{ background: "var(--surface)", border: "1px solid var(--border)", minHeight: 520 }}>
          <div style={{ marginBottom: ".9rem" }}>
            <p className="section-label">Chat</p>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text)" }}>
              Duvidas com o solicitante
            </h2>
          </div>
          <ChatBox
            conversaId={conversa.id}
            currentUserId={userId}
            initialMessages={conversa.mensagens}
            apiPath={`/api/conversas-solicitacao/${conversa.id}/mensagens`}
            emptyText="Nenhuma pergunta enviada ainda"
            placeholder="Pergunte sobre volume, acesso ao local ou estado do material..."
          />
        </aside>
      </div>
    </div>
  );
}

function Info({
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
        padding: ".9rem 1rem",
        borderRadius: 18,
        border: "1px solid var(--border)",
        background: muted ? "var(--surface-3)" : "var(--surface)",
      }}
    >
      <p style={{ fontSize: ".7rem", textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--text-faint)", fontWeight: 700, marginBottom: ".35rem" }}>
        {label}
      </p>
      <p style={{ color: muted ? "var(--text-muted)" : "var(--text)", lineHeight: 1.55, fontSize: ".9rem" }}>
        {value}
      </p>
    </div>
  );
}
