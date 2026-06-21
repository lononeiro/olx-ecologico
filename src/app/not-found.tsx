import { BackButton } from "@/components/ui/BackButton";

export default function NotFound() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ marginBottom: "1rem", fontSize: "4rem", fontWeight: 700, color: "var(--green)", fontFamily: "ui-monospace, monospace" }}>
          404
        </div>
        <h1 style={{ marginBottom: ".5rem", fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 700, color: "var(--text)" }}>
          Página não encontrada
        </h1>
        <p style={{ marginBottom: "1.5rem", color: "var(--text-muted)", fontSize: ".95rem", lineHeight: 1.6, maxWidth: 400 }}>
          O conteúdo que você tentou abrir não existe ou mudou de endereço.
        </p>
        <BackButton className="btn btn-primary">Voltar para a página anterior</BackButton>
      </div>
    </div>
  );
}
