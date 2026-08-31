import { listarSolicitacoesAprovadas } from "@/services/solicitacao.service";
import { AceitarSolicitacaoButton } from "../solicitacoes/AceitarSolicitacaoButton";
import { SolicitacaoCardVisual } from "@/components/cards/SolicitacaoCardVisual";
import { MapaColetas, type MapaColetaItem } from "@/components/ui/MapaColetas";

export const dynamic = "force-dynamic";

export default async function EmpresaMapaPage() {
  const solicitacoes = await listarSolicitacoesAprovadas();

  const pontos: MapaColetaItem[] = solicitacoes
    .filter((s) => (s.endereco ?? "").trim().length > 0)
    .map((s) => ({
      id: s.id,
      titulo: s.titulo,
      materialNome: s.material.nome,
      quantidade: s.quantidade,
      endereco: s.endereco!,
      imagemUrl: s.imagens[0]?.url ?? null,
    }));

  return (
    <div className="page-enter">
      <div style={{ marginBottom: "1.5rem" }}>
        <p className="section-label">Empresa</p>
        <h1 style={{ fontSize: "clamp(1.3rem, 3vw, 1.65rem)", fontWeight: 800, color: "var(--text)", letterSpacing: "-.4px" }}>
          Coletas no Mapa
        </h1>
        <p style={{ fontSize: ".84rem", color: "var(--text-muted)", marginTop: ".3rem" }}>
          {solicitacoes.length === 0
            ? "Nenhuma solicitação disponível para exibir no mapa."
            : `Visualize a localização de ${solicitacoes.length} ${solicitacoes.length === 1 ? "solicitação disponível" : "solicitações disponíveis"} e aceite pelos cards abaixo.`}
        </p>
      </div>

      {pontos.length > 0 ? (
        <div className="surface-card" style={{ marginBottom: "1.5rem" }}>
          <MapaColetas items={pontos} />
        </div>
      ) : (
        <div className="card empty-state" style={{ background: "linear-gradient(135deg, var(--surface), var(--surface-3))" }}>
          <div className="empty-state-icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--green-mid)" strokeWidth="1.5">
              <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", marginBottom: ".3rem" }}>
              Nada para mapear
            </p>
            <p style={{ fontSize: ".86rem", color: "var(--text-muted)", maxWidth: 340, margin: "0 auto" }}>
              Assim que houver solicitações aprovadas com endereço, elas aparecerão no mapa.
            </p>
          </div>
        </div>
      )}

      {solicitacoes.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {solicitacoes.map((s, i) => (
            <div key={s.id} className="anim-fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <SolicitacaoCardVisual
                id={s.id}
                titulo={s.titulo}
                descricao={s.descricao}
                quantidade={s.quantidade}
                endereco={s.endereco ?? "Região não informada"}
                status={s.status}
                createdAt={s.createdAt}
                material={s.material}
                imagens={s.imagens}
                reputacao={s.reputacaoSolicitante}
                actions={
                  <AceitarSolicitacaoButton
                    solicitacaoId={s.id}
                    titulo={s.titulo}
                    descricao={s.descricao}
                    quantidade={s.quantidade}
                    endereco={s.endereco ?? "Região não informada"}
                    materialNome={s.material.nome}
                    imagens={s.imagens}
                    reputacao={s.reputacaoSolicitante}
                  />
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
