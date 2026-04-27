"use client";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: "flex", minHeight: "100vh", alignItems: "center",
          justifyContent: "center", background: "var(--bg)", padding: "2rem",
        }}>
          <div style={{ textAlign: "center", maxWidth: 480 }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text)", marginBottom: ".5rem" }}>
              Algo deu errado
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Ocorreu um erro inesperado. Tente recarregar a pagina.
            </p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Recarregar pagina
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
