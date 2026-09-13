"use client";

import { useMapaFocus } from "./MapaFocusContext";

/** Centraliza o mapa de coletas no marcador desta solicitação. */
export function MostrarNoMapaButton({ solicitacaoId }: { solicitacaoId: number }) {
  const focus = useMapaFocus();
  if (!focus) return null;

  return (
    <button
      type="button"
      onClick={() => focus.focar(solicitacaoId)}
      className="btn btn-secondary"
      style={{ width: "100%", justifyContent: "center" }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      Mostrar no mapa
    </button>
  );
}
