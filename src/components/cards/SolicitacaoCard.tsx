"use client";
import Link from "next/link";

interface Props {
  solicitacao: {
    id: number;
    titulo: string;
    quantidade: string;
    endereco: string;
    status: string;
    createdAt: string | Date;
    material: { nome: string };
    imagens: { id: number; url: string }[];
    coleta?: { status: string } | null;
  };
  href?: string;
  actions?: React.ReactNode;
}

interface CardVisualState {
  badgeLabel: string;
  progressLabel: string;
  progressValue: number;
  badgeBackground: string;
  badgeText: string;
  badgeBorder: string;
  progressGradient: string;
  progressTrack: string;
}

const FALLBACK_IMAGE_BG =
  "linear-gradient(135deg, rgba(212,240,196,.75), rgba(227,242,251,.75))";

function getCardVisualState(status: string, coletaStatus?: string | null): CardVisualState {
  if (coletaStatus === "concluida") {
    return {
      badgeLabel: "Concluida",
      progressLabel: "Fluxo finalizado",
      progressValue: 100,
      badgeBackground: "rgba(30,122,50,.12)",
      badgeText: "var(--green-dark)",
      badgeBorder: "rgba(30,122,50,.18)",
      progressGradient: "linear-gradient(90deg, var(--green), var(--green-light))",
      progressTrack: "rgba(30,122,50,.12)",
    };
  }

  if (coletaStatus === "cancelada" || status === "rejeitada") {
    return {
      badgeLabel: coletaStatus === "cancelada" ? "Cancelada" : "Rejeitada",
      progressLabel: "Fluxo encerrado",
      progressValue: 100,
      badgeBackground: "rgba(184,50,40,.1)",
      badgeText: "var(--red)",
      badgeBorder: "rgba(184,50,40,.18)",
      progressGradient: "linear-gradient(90deg, var(--red), var(--red-mid))",
      progressTrack: "rgba(184,50,40,.1)",
    };
  }

  if (coletaStatus === "em_coleta") {
    return {
      badgeLabel: "Em coleta",
      progressLabel: "Coleta em andamento",
      progressValue: 85,
      badgeBackground: "rgba(107,63,168,.1)",
      badgeText: "var(--purple)",
      badgeBorder: "rgba(107,63,168,.16)",
      progressGradient: "linear-gradient(90deg, var(--purple), var(--blue-mid))",
      progressTrack: "rgba(107,63,168,.1)",
    };
  }

  if (coletaStatus === "a_caminho") {
    return {
      badgeLabel: "A caminho",
      progressLabel: "Rota iniciada",
      progressValue: 75,
      badgeBackground: "rgba(29,111,168,.1)",
      badgeText: "var(--blue)",
      badgeBorder: "rgba(29,111,168,.16)",
      progressGradient: "linear-gradient(90deg, var(--blue), var(--blue-mid))",
      progressTrack: "rgba(29,111,168,.1)",
    };
  }

  if (coletaStatus === "aceita") {
    return {
      badgeLabel: "Aceita",
      progressLabel: "Coleta confirmada",
      progressValue: 60,
      badgeBackground: "rgba(29,111,168,.1)",
      badgeText: "var(--blue)",
      badgeBorder: "rgba(29,111,168,.16)",
      progressGradient: "linear-gradient(90deg, var(--blue), var(--green-mid))",
      progressTrack: "rgba(29,111,168,.1)",
    };
  }

  if (status === "aprovada") {
    return {
      badgeLabel: "Aprovada",
      progressLabel: "Aguardando empresa",
      progressValue: 50,
      badgeBackground: "rgba(29,111,168,.1)",
      badgeText: "var(--blue)",
      badgeBorder: "rgba(29,111,168,.16)",
      progressGradient: "linear-gradient(90deg, var(--blue), var(--blue-mid))",
      progressTrack: "rgba(29,111,168,.1)",
    };
  }

  return {
    badgeLabel: "Aguardando",
    progressLabel: "Aguardando aprovacao",
    progressValue: 25,
    badgeBackground: "rgba(196,122,6,.1)",
    badgeText: "var(--yellow)",
    badgeBorder: "rgba(196,122,6,.18)",
    progressGradient: "linear-gradient(90deg, var(--yellow), var(--yellow-mid))",
    progressTrack: "rgba(196,122,6,.1)",
  };
}

export function SolicitacaoCard({ solicitacao: s, href, actions }: Props) {
  const date = new Date(s.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const visualState = getCardVisualState(s.status, s.coleta?.status);
  const isFullyClickable = Boolean(href && !actions);
  const primaryImage = s.imagens[0];

  const cardContent = (
    <div
      className="group relative h-full overflow-hidden rounded-[30px] border bg-white transition-all duration-200"
      style={{
        borderColor: "rgba(214,234,214,.95)",
        boxShadow: "0 8px 26px rgba(15,50,20,.08)",
        transform: "translateY(0) scale(1)",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-4px) scale(1.01)";
        event.currentTarget.style.boxShadow = "0 18px 40px rgba(15,50,20,.12)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0) scale(1)";
        event.currentTarget.style.boxShadow = "0 8px 26px rgba(15,50,20,.08)";
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(248,252,248,.6) 0%, rgba(255,255,255,0) 55%)",
          pointerEvents: "none",
        }}
      />

      <div className="flex h-full flex-col">
        <div
          style={{
            position: "relative",
            height: 190,
            width: "100%",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={s.titulo}
              className="block h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                background: FALLBACK_IMAGE_BG,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  background: "rgba(255,255,255,.85)",
                  border: "1px solid rgba(214,234,214,.95)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--green)",
                  boxShadow: "0 10px 24px rgba(15,50,20,.08)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
            </div>
          )}

          <div
            style={{
              position: "absolute",
              left: 16,
              bottom: 16,
              display: "flex",
              gap: ".5rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                padding: ".38rem .72rem",
                borderRadius: 999,
                background: "rgba(255,255,255,.92)",
                color: "var(--text)",
                fontSize: ".7rem",
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                boxShadow: "0 8px 20px rgba(15,50,20,.10)",
              }}
            >
              {s.material.nome}
            </span>
            <span
              style={{
                padding: ".38rem .72rem",
                borderRadius: 999,
                background: "rgba(15,31,18,.72)",
                color: "#fff",
                fontSize: ".7rem",
                fontWeight: 700,
              }}
            >
              {s.imagens.length > 0 ? `${s.imagens.length} foto(s)` : "Sem foto"}
            </span>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: "1.2rem 1.2rem 1.15rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: ".9rem",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              {isFullyClickable || !href ? (
                <h3
                  style={{
                    fontSize: "1.08rem",
                    lineHeight: 1.25,
                    fontWeight: 800,
                    color: "var(--text)",
                    letterSpacing: "-.03em",
                    marginBottom: ".35rem",
                  }}
                >
                  {s.titulo}
                </h3>
              ) : (
                <Link
                  href={href}
                  style={{
                    display: "inline-block",
                    fontSize: "1.08rem",
                    lineHeight: 1.25,
                    fontWeight: 800,
                    color: "var(--text)",
                    textDecoration: "none",
                    letterSpacing: "-.03em",
                    marginBottom: ".35rem",
                  }}
                >
                  {s.titulo}
                </Link>
              )}
              <p style={{ fontSize: ".78rem", color: "var(--text-faint)" }}>
                Solicitação #{s.id}
              </p>
            </div>

            <span
              style={{
                flexShrink: 0,
                padding: ".42rem .78rem",
                borderRadius: 999,
                background: visualState.badgeBackground,
                color: visualState.badgeText,
                border: `1px solid ${visualState.badgeBorder}`,
                fontSize: ".72rem",
                fontWeight: 800,
                letterSpacing: ".06em",
                textTransform: "uppercase",
              }}
            >
              {visualState.badgeLabel}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: ".75rem",
            }}
          >
            <InfoTile
              icon={<IconRecycle />}
              label="Tipo de material"
              value={s.material.nome}
            />
            <InfoTile
              icon={<IconWeight />}
              label="Peso / quantidade"
              value={s.quantidade}
            />
            <InfoTile
              icon={<IconPin />}
              label="Endereco"
              value={s.endereco}
              wide
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: ".8rem",
              flexWrap: "wrap",
            }}
          >
            <p style={{ fontSize: ".76rem", color: "var(--text-faint)" }}>
              Criada em {date}
            </p>

            {isFullyClickable && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".45rem",
                  color: "var(--green)",
                  fontSize: ".78rem",
                  fontWeight: 700,
                }}
              >
                Ver detalhes
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(30,122,50,.08)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: ".15rem",
              paddingTop: ".95rem",
              borderTop: "1px solid rgba(214,234,214,.95)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: ".8rem",
                marginBottom: ".55rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: ".72rem",
                    color: "var(--text-faint)",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    fontWeight: 700,
                  }}
                >
                  Progresso
                </p>
                <p style={{ fontSize: ".82rem", color: "var(--text-muted)", marginTop: ".15rem" }}>
                  {visualState.progressLabel}
                </p>
              </div>
              <span
                style={{
                  fontSize: ".86rem",
                  fontWeight: 800,
                  color: "var(--text)",
                }}
              >
                {visualState.progressValue}%
              </span>
            </div>

            <div
              style={{
                width: "100%",
                height: 10,
                borderRadius: 999,
                background: visualState.progressTrack,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${visualState.progressValue}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: visualState.progressGradient,
                  transition: "width .35s var(--ease)",
                }}
              />
            </div>
          </div>

          {actions && (
            <div
              style={{
                marginTop: ".15rem",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(214,234,214,.95)",
                display: "flex",
                gap: ".6rem",
                flexWrap: "wrap",
              }}
            >
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isFullyClickable && href) {
    return <Link href={href}>{cardContent}</Link>;
  }

  return cardContent;
}

function InfoTile({
  icon,
  label,
  value,
  wide,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        gridColumn: wide ? "1 / -1" : undefined,
        display: "flex",
        alignItems: "flex-start",
        gap: ".75rem",
        padding: ".9rem .95rem",
        borderRadius: 18,
        background: "linear-gradient(180deg, rgba(248,252,248,1) 0%, rgba(255,255,255,1) 100%)",
        border: "1px solid rgba(214,234,214,.9)",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          background: "rgba(30,122,50,.08)",
          color: "var(--green)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: ".68rem",
            color: "var(--text-faint)",
            textTransform: "uppercase",
            letterSpacing: ".08em",
            fontWeight: 700,
            marginBottom: ".25rem",
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: ".88rem",
            color: "var(--text)",
            fontWeight: 700,
            lineHeight: 1.45,
            whiteSpace: wide ? "normal" : "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function IconRecycle() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
      <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
      <path d="m14 16-3 3 3 3" />
      <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
    </svg>
  );
}

function IconWeight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" x2="21" y1="6" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
