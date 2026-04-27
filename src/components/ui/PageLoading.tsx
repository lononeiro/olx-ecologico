type PageLoadingVariant = "full" | "content";

type PageLoadingProps = {
  variant?: PageLoadingVariant;
  title?: string;
  description?: string;
};

export function PageLoading({
  variant = "content",
  title = "Carregando",
  description = "Preparando as informacoes da pagina.",
}: PageLoadingProps) {
  const isFull = variant === "full";

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: isFull ? "100vh" : "min(520px, calc(100vh - 180px))",
        display: "grid",
        placeItems: "center",
        padding: isFull ? "2rem" : "1rem",
        background: isFull ? "var(--bg)" : "transparent",
        color: "var(--text)",
      }}
    >
      <div
        style={{
          width: "min(100%, 420px)",
          display: "grid",
          justifyItems: "center",
          gap: "1rem",
          textAlign: "center",
          animation: "fadeUp .35s var(--ease) both",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 72,
            height: 72,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: 9,
              borderRadius: "50%",
              border: "3px solid var(--green-xlight)",
              borderTopColor: "var(--green)",
              animation: "spin .75s linear infinite",
            }}
          />
          <span
            aria-hidden="true"
            style={{
              color: "var(--green)",
              fontSize: "1.45rem",
              lineHeight: 1,
            }}
          >
            ♻
          </span>
        </div>

        <div>
          <h2
            style={{
              color: "var(--text)",
              fontSize: "1rem",
              fontWeight: 700,
              marginBottom: ".35rem",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: ".88rem",
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        </div>

        <div
          aria-hidden="true"
          style={{
            width: "100%",
            display: "grid",
            gap: ".65rem",
            marginTop: ".25rem",
          }}
        >
          <span className="skeleton" style={{ height: 12, width: "80%", justifySelf: "center" }} />
          <span className="skeleton" style={{ height: 12, width: "62%", justifySelf: "center" }} />
        </div>
      </div>
    </div>
  );
}
